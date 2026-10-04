# Architecture — "Sisa" (V1)

> Prinsip utama: **logika bisnis murni dan teruji, terpisah dari UI dan penyimpanan.** Parser dan perhitungan saldo adalah fungsi murni TypeScript yang bisa dites tanpa emulator.

---

## 1. Stack

| Lapisan | Pilihan | Catatan |
|---------|---------|---------|
| Framework | React Native + Expo | Gunakan SDK Expo stabil terbaru; **cek dokumentasi resmi** untuk versi dan perintah terkini sebelum setup |
| Bahasa | TypeScript, `strict: true` | |
| Navigasi | `expo-router` | |
| Database | `expo-sqlite` | Lokal, offline |
| State UI | React state + hook; **Zustand opsional** bila perlu | Jangan tambah state library bila tidak dibutuhkan |
| Tes | Jest (+ `jest-expo`) untuk unit test | Tes UI opsional di V1 |
| Lint/format | ESLint + Prettier | |
| Build | EAS Build (profil APK untuk instal langsung) | Cek kuota/ketentuan terbaru di dokumentasi Expo |

> Nomor versi sengaja tidak dikunci di dokumen ini agar tidak usang. Versi aktual dicatat di `package.json`.

## 2. Arsitektur Berlapis

```
┌────────────────────────────────────────────┐
│  UI (app/, src/ui)                         │  Layar, komponen, tema
│  - hanya memanggil hook / service          │
└───────────────▲────────────────────────────┘
                │
┌───────────────┴────────────────────────────┐
│  Application (src/app-services, src/hooks) │  Orkestrasi use case
│  - addTransaction, reconcileWallet, ...    │
└───────▲──────────────────────▲─────────────┘
        │                      │
┌───────┴──────────┐   ┌───────┴─────────────┐
│ Domain (murni)   │   │ Data (SQLite)       │
│ - parser         │   │ - repositories      │
│ - balance        │   │ - migrations        │
│ - reconcile      │   │                     │
│ - money          │   │                     │
└──────────────────┘   └─────────────────────┘
```

**Aturan dependensi (wajib):**
- `domain` **tidak boleh** mengimpor React, Expo, SQLite, atau apa pun dari lapisan lain.
- `ui` tidak boleh mengakses SQLite langsung; selalu lewat service/repository.
- `data` boleh mengimpor tipe dari `domain`, bukan sebaliknya.

## 3. Struktur Folder

```
.
├── AGENTS.md                  # Panduan agen AI (aturan kerja)
├── docs/
│   ├── PRD.md
│   ├── DESIGN_SYSTEM.md
│   └── ARCHITECTURE.md
├── app/                       # Rute expo-router (layar)
│   ├── _layout.tsx
│   ├── index.tsx              # Beranda
│   ├── transaction/[id].tsx   # Form tambah/ubah
│   └── wallets.tsx            # Kelola dompet
├── src/
│   ├── domain/
│   │   ├── types.ts
│   │   ├── money.ts           # parse/format Rupiah
│   │   ├── quickInputParser.ts
│   │   ├── balance.ts         # hitung saldo dari transaksi
│   │   ├── reconcile.ts       # hitung selisih penyesuaian
│   │   └── __tests__/
│   ├── data/
│   │   ├── db.ts              # buka database, jalankan migrasi
│   │   ├── migrations/
│   │   ├── walletRepository.ts
│   │   └── transactionRepository.ts
│   ├── app-services/
│   │   ├── transactionService.ts
│   │   └── walletService.ts
│   ├── hooks/                 # useWallets, useTransactions, ...
│   └── ui/
│       ├── theme/tokens.ts
│       ├── theme/useTheme.ts
│       └── components/        # QuickInputBar, WalletCard, ...
└── package.json
```

## 4. Model Data

### 4.1 Tipe Domain (TypeScript)

```ts
export type WalletId = string;
export type TransactionId = string;

export type TransactionType =
  | 'expense'
  | 'income'
  | 'transfer'
  | 'adjustment';

export interface Wallet {
  id: WalletId;
  name: string;
  openingBalance: number;   // Rupiah, integer
  archived: boolean;
  lastUsedAt: number | null; // epoch ms, untuk "dompet terakhir dipakai"
  createdAt: number;
}

export interface Transaction {
  id: TransactionId;
  type: TransactionType;
  amount: number;           // integer Rupiah. expense/income/transfer: > 0. adjustment: ≠ 0 (bertanda)
  walletId: WalletId;       // dompet utama / asal
  toWalletId: WalletId | null; // hanya untuk transfer
  note: string;
  occurredAt: number;       // epoch ms
  createdAt: number;
  source: 'manual' | 'quick_input' | 'reconciliation';
}
```

### 4.2 Skema SQLite

```sql
CREATE TABLE wallets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  opening_balance INTEGER NOT NULL DEFAULT 0,
  archived INTEGER NOT NULL DEFAULT 0,
  last_used_at INTEGER,
  created_at INTEGER NOT NULL
);

CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('expense','income','transfer','adjustment')),
  amount INTEGER NOT NULL,
  wallet_id TEXT NOT NULL REFERENCES wallets(id),
  to_wallet_id TEXT REFERENCES wallets(id),
  note TEXT NOT NULL DEFAULT '',
  occurred_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('manual','quick_input','reconciliation')),
  CHECK (
    (type = 'adjustment' AND amount <> 0 AND to_wallet_id IS NULL) OR
    (type IN ('expense','income') AND amount > 0 AND to_wallet_id IS NULL) OR
    (type = 'transfer' AND amount > 0 AND to_wallet_id IS NOT NULL AND to_wallet_id <> wallet_id)
  )
);

CREATE INDEX idx_tx_occurred ON transactions(occurred_at DESC);
CREATE INDEX idx_tx_wallet ON transactions(wallet_id);
```

- **Migrasi:** simpan versi skema (`PRAGMA user_version`), setiap perubahan = file migrasi baru, tidak mengubah migrasi lama.
- **ID:** UUID atau ID acak yang dibuat di klien.
- **Waktu:** epoch milidetik; konversi ke zona waktu perangkat hanya di lapisan UI.

## 5. Logika Domain

### 5.1 Efek Transaksi terhadap Saldo Dompet

| Jenis | `walletId` | `toWalletId` |
|-------|-----------|--------------|
| expense | −amount | n/a |
| income | +amount | n/a |
| transfer | −amount | +amount |
| adjustment | +amount (bertanda) | n/a |

```
saldo(dompet) = openingBalance + Σ efek transaksi pada dompet itu
totalSaldo    = Σ saldo(dompet aktif)
```

**Invarian yang wajib diuji:**
1. Transfer tidak mengubah `totalSaldo`.
2. `saldo` tidak pernah disimpan; selalu dihitung dari data.
3. Setelah Koreksi Saldo, `saldo(dompet) == saldoAktual`.
4. Menghapus lalu menambah transaksi yang sama mengembalikan saldo semula.

### 5.2 Koreksi Saldo

```
selisih = saldoAktual − saldo(dompet)
jika selisih == 0 → tidak ada entri
jika selisih ≠ 0 → Transaction{ type:'adjustment', amount: selisih, source:'reconciliation' }
```

### 5.3 Quick Input Parser (`quickInputParser.ts`)

Fungsi murni:

```ts
parseQuickInput(
  input: string,
  context: { wallets: Wallet[]; lastUsedWalletId: WalletId | null; now: number }
): ParseResult;

type ParseResult =
  | { ok: true; draft: TransactionDraft; confidence: 'high' | 'medium' }
  | { ok: false; reason: 'NO_AMOUNT' | 'EMPTY' | 'AMBIGUOUS_WALLET'; partialNote: string };
```

**Tahapan parsing (urutan tetap):**
1. Normalisasi: huruf kecil, rapikan spasi.
2. Ekstrak nominal (lihat tabel), hapus dari teks.
3. Deteksi dompet dari nama/alias dompet yang ada (pencocokan kata utuh, tidak peka huruf besar-kecil).
4. Deteksi jenis (kata kunci, pola `dari X ke Y`).
5. Deteksi tanggal (`kemarin`; selain itu hari ini).
6. Sisa teks menjadi catatan (`note`).

**Aturan nominal:**

| Input | Hasil |
|-------|-------|
| `25rb`, `25k` | 25.000 |
| `25.000`, `25000` | 25.000 |
| `1,5jt`, `1.5jt` | 1.500.000 |
| `2jt` | 2.000.000 |
| `25 rb` (dengan spasi) | 25.000 |

**Kasus ambigu yang harus ditangani eksplisit:** `1.500` (ribuan Indonesia vs desimal) diperlakukan sebagai 1.500 jika tanpa sufiks dan titik diikuti tepat 3 digit; `1.5jt` dengan sufiks diperlakukan sebagai desimal. Setiap keputusan ambigu **harus** punya unit test.

> Slang nominal (mis. "goceng", "ceban") adalah tambahan opsional setelah tes dasar hijau.

### 5.4 Uang (`money.ts`)
- Seluruh nominal = integer Rupiah. Tidak memakai floating point untuk penyimpanan atau penjumlahan.
- `formatRupiah(n)` → `Rp 25.000`, `−Rp 25.000` (lihat Design System).
- Hindari `Intl` yang perilakunya bisa berbeda antar mesin JS; pastikan format diuji di perangkat, atau implementasikan manual dengan tes.

## 6. Alur Data (Contoh: Quick Input)

```
Ketik "kopi 25rb gopay"
  → QuickInputBar memanggil parseQuickInput(text, context)   [domain, murni]
  → UI menampilkan pratinjau dari draft
  → Tekan Simpan → transactionService.add(draft)             [app-services]
  → transactionRepository.insert(...) dalam satu transaksi DB [data]
  → walletRepository.touchLastUsed(walletId)
  → hook memuat ulang data → saldo dihitung ulang dari domain/balance
```

## 7. Penanganan Error

- Kegagalan parsing = hasil normal (`ok: false`), **bukan** exception.
- Operasi DB yang menulis lebih dari satu tabel/baris berjalan dalam **satu transaksi DB**.
- Error tak terduga ditangkap di batas layar; tampilkan pesan netral dan jangan kehilangan teks yang sedang diketik.
- Validasi di dua tempat: UI (umpan balik cepat) dan service (penjaga akhir).

## 8. Strategi Pengujian

| Area | Jenis | Wajib? |
|------|-------|--------|
| `money`, `quickInputParser`, `balance`, `reconcile` | Unit test (Jest), tabel kasus | **Wajib, ditulis sebelum implementasi** |
| Repository (SQLite) | Tes integrasi bila praktis | Disarankan |
| Layar/komponen | Uji manual di perangkat + checklist | V1 cukup manual |

Tes parser berbentuk tabel `input → hasil` agar mudah ditambah dari kegagalan nyata saat dogfooding.

## 9. Keamanan & Privasi

- Data keuangan **tidak keluar dari perangkat** di V1 (tanpa jaringan, tanpa analitik).
- Tidak ada kunci API atau rahasia di repositori.
- Jangan mencatat (`console.log`) isi transaksi di build rilis.
- Cadangan/ekspor adalah fitur lanjutan, belum di V1.
- Pertimbangan hukum perlindungan data pribadi baru relevan bila aplikasi dirilis publik atau memproses data pihak lain; konsultasikan sebelum itu.

## 10. Jalur Evolusi (Tidak Dikerjakan di V1)

- **V1.1:** `expo-notifications` untuk notifikasi lokal terjadwal; modul `safeToSpend.ts` di domain (murni, teruji).
- **V1.5/V2:** modul native Kotlin (`NotificationListenerService`) lewat Expo Modules API, memerlukan *development build* (bukan Expo Go). Parser notifikasi diperlakukan sebagai domain murni terpisah dengan sampel rekaman sendiri. Detail teknis dan kebijakan platform diverifikasi ulang saat tahap itu dimulai.
- Arsitektur berlapis ini memungkinkan sumber transaksi baru (notifikasi) menghasilkan `TransactionDraft` yang sama dan memakai jalur `transactionService.add`.

## 11. Keputusan Arsitektur (ADR Ringkas)

| # | Keputusan | Alasan | Konsekuensi |
|---|-----------|--------|-------------|
| 1 | Saldo dihitung, tidak disimpan | Mencegah inkonsistensi | Perlu kueri agregat; cukup cepat untuk skala pribadi |
| 2 | Integer Rupiah | Hindari galat floating point | Tidak mendukung desimal/mata uang lain |
| 3 | Transfer = jenis entri sendiri | Cegah hitung ganda top-up | Logika tampilan perlu membedakan jenis |
| 4 | Penyesuaian = entri tersendiri | Jejak audit koreksi | Daftar punya satu jenis tambahan |
| 5 | Offline-first, tanpa backend | Sederhana, privat | Tanpa sinkronisasi antar perangkat |
| 6 | Domain murni terpisah | Mudah dites, siap evolusi | Sedikit boilerplate tambahan |
