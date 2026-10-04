# Design System — "Sisa" (V1)

> Dokumen ini adalah sumber kebenaran visual dan nada bahasa. Semua nilai warna, spasi, dan tipografi **harus** diambil dari token di `src/ui/theme/tokens.ts`, tidak boleh ditulis langsung (*hardcode*) di komponen.

---

## 1. Prinsip Desain

1. **Nol gesekan.** Aksi utama (mencatat) harus tercapai dalam ≤ 2 ketukan dari layar utama. Input selalu terlihat.
2. **Tidak menghakimi.** Pengguna cenderung menghindari melihat saldo. Hindari merah mencolok, tanda seru, atau bahasa menyalahkan. Informasi disampaikan netral.
3. **Satu angka dominan.** Setiap layar punya satu hal terpenting yang paling besar.
4. **Toleran terhadap data bolong.** Selisih/koreksi ditampilkan sebagai hal biasa, bukan kesalahan pengguna.
5. **Ringan dan cepat.** Tanpa animasi dekoratif. Gerak hanya untuk memberi umpan balik.

## 2. Token Warna

Dua tema: **terang** dan **gelap**, mengikuti pengaturan sistem. Nilai di bawah adalah titik awal; sesuaikan setelah dicoba di perangkat, lalu periksa kontras (target WCAG AA: 4.5:1 untuk teks biasa).

| Token | Terang | Gelap | Penggunaan |
|-------|--------|-------|------------|
| `bg` | `#FAFAF7` | `#121413` | Latar layar |
| `surface` | `#FFFFFF` | `#1C1F1E` | Kartu, input |
| `surfaceAlt` | `#F0F1EC` | `#262A28` | Area sekunder, chip |
| `border` | `#E2E4DD` | `#33383A` | Garis pemisah |
| `text` | `#1A1D1B` | `#ECEEEA` | Teks utama |
| `textMuted` | `#5E6661` | `#9AA39E` | Teks sekunder |
| `primary` | `#2F6B57` | `#6FC3A6` | Aksi utama, fokus |
| `onPrimary` | `#FFFFFF` | `#0C1512` | Teks di atas primary |
| `income` | `#2F6B57` | `#6FC3A6` | Nominal pemasukan |
| `expense` | `#3A3F3C` | `#D5D9D6` | Nominal pengeluaran (**netral**, bukan merah) |
| `transfer` | `#3D5A80` | `#8FB0DA` | Transfer antar dompet |
| `adjust` | `#8A6A1F` | `#D9B866` | Penyesuaian "tak tercatat" |
| `danger` | `#B3382C` | `#F08A7E` | Hanya untuk aksi destruktif (hapus) |
| `focus` | `#2F6B57` | `#6FC3A6` | Cincin fokus |

**Aturan:** pengeluaran **tidak** diberi warna merah. Merah hanya untuk tombol/konfirmasi hapus. Makna tidak boleh hanya dibawa warna: selalu sertakan tanda (+/−), ikon, atau label.

## 3. Tipografi

Font sistem (tanpa unduhan font tambahan di V1) agar cepat dan konsisten.

| Token | Ukuran / Tinggi baris | Bobot | Penggunaan |
|-------|----------------------|-------|------------|
| `display` | 36 / 44 | 700 | Total saldo |
| `title` | 22 / 28 | 600 | Judul layar |
| `heading` | 17 / 24 | 600 | Judul kartu, nama dompet |
| `body` | 16 / 24 | 400 | Teks umum, input |
| `caption` | 13 / 18 | 400 | Tanggal, keterangan |
| `amount` | 17 / 24 | 600 | Nominal di daftar (gunakan *tabular numbers* bila tersedia agar angka sejajar) |

Hormati pengaturan ukuran font sistem; layout tidak boleh pecah pada skala teks besar.

## 4. Spasi, Bentuk, Elevasi

- **Skala spasi (dp):** `4, 8, 12, 16, 24, 32, 48` (token `space.1`–`space.7`).
- **Radius:** `sm 8`, `md 12`, `lg 20`, `full 999`.
- **Elevasi:** minimal. Gunakan `border` tipis, bukan bayangan tebal. Satu level bayangan ringan hanya untuk bottom sheet.
- **Margin layar:** 16dp horizontal.
- **Target sentuh minimum:** 48 × 48dp.

## 5. Format Data

| Hal | Aturan | Contoh |
|-----|--------|--------|
| Mata uang | Awalan `Rp`, spasi, pemisah ribuan titik, tanpa desimal | `Rp 25.000` |
| Negatif | Tanda minus Unicode `−`, bukan tanda kurung | `−Rp 25.000` |
| Pemasukan | Tanda `+` | `+Rp 5.000.000` |
| Tanggal hari ini/kemarin | "Hari ini", "Kemarin" | |
| Tanggal lain | `12 Mar` (tahun hanya jika bukan tahun berjalan) | |
| Singkatan nominal di input | `rb`, `k`, `jt` diterima saat mengetik, **ditampilkan** sebagai angka lengkap | |

## 6. Komponen

### 6.1 QuickInputBar (komponen paling penting)
- Menempel di bagian bawah layar utama, di atas keyboard saat aktif.
- Placeholder bergilir, contoh: `kopi 25rb gopay`.
- Saat mengetik, tampil **pratinjau satu baris** di atasnya: `Pengeluaran · Rp 25.000 · GoPay` + tombol `Simpan` (primary) dan `Ubah`.
- Jika nominal tak terbaca: pratinjau diganti teks netral `Belum ada nominal` dan tombol `Isi manual`.
- Aksi *submit* keyboard = Simpan bila pratinjau valid.

### 6.2 WalletCard
- Nama dompet (`heading`), saldo (`amount` besar), tombol teks `Koreksi saldo`.
- Tampil horizontal dapat digulir; total saldo (`display`) berada di atasnya.

### 6.3 TransactionRow
- Kiri: ikon jenis + catatan (maks 1 baris, ellipsis) + dompet & jam (`caption`).
- Kanan: nominal berwarna sesuai token jenis.
- Penyesuaian: label kecil `Tak tercatat` bergaya `adjust`.
- Geser untuk hapus **disertai** tombol "Urungkan" (snackbar), bukan dialog konfirmasi berat.

### 6.4 Button
| Varian | Pakai untuk |
|--------|-------------|
| `primary` | Satu aksi utama per layar |
| `secondary` | Aksi pendukung (outline) |
| `text` | Aksi ringan (Koreksi saldo, Batal) |
| `danger` | Hapus permanen |

Status wajib: default, pressed, disabled, loading.

### 6.5 AmountField & WalletPicker
- AmountField: keyboard numerik, tampil terformat saat mengetik.
- WalletPicker: chip horizontal; default = dompet terakhir dipakai.

### 6.6 ReconcileSheet (bottom sheet)
1. Pilih dompet (jika dibuka dari tombol global).
2. Isi saldo aktual.
3. Tampilkan baris ringkasan netral: `Saldo di aplikasi Rp 80.000 · Aktual Rp 65.000 · Selisih −Rp 15.000`.
4. Tombol `Catat selisih` (primary) dan `Batal`.

### 6.7 EmptyState & Snackbar
- Empty state: satu kalimat ramah + contoh input, tanpa ilustrasi di V1.
- Snackbar: untuk konfirmasi tersimpan dan "Urungkan"; hilang otomatis ±4 detik.

## 7. Layar V1

| Layar | Isi utama |
|-------|-----------|
| Onboarding | Buat dompet + saldo awal (maks 2 langkah) |
| Beranda | Total saldo, WalletCard, daftar transaksi, QuickInputBar |
| Form Transaksi | Jenis, nominal, dompet, catatan, tanggal (fallback/edit) |
| Koreksi Saldo | ReconcileSheet |
| Kelola Dompet | Tambah, ubah nama, arsipkan |

Navigasi sederhana: Beranda sebagai pusat, layar lain berupa modal atau *push* dangkal. Tanpa tab bar di V1.

## 8. Nada Bahasa (Copywriting, Bahasa Indonesia)

- Santai, jelas, hangat; sapa dengan "kamu" bila perlu, hindari bahasa baku kaku dan hindari menggurui.
- Jangan memakai kata yang menyalahkan: hindari "boros", "kamu melebihi batas", "gagal".
- Selisih koreksi disebut "tak tercatat", bukan "kesalahan".

| Situasi | Teks |
|---------|------|
| Berhasil simpan | `Tercatat.` |
| Nominal tak terbaca | `Belum ada nominal. Isi manual?` |
| Selisih nol | `Pas! Tidak ada selisih.` |
| Kosong | `Belum ada catatan. Coba ketik: kopi 25rb gopay` |
| Hapus | `Dihapus. Urungkan` |

## 9. Aksesibilitas

- Kontras teks memenuhi WCAG AA; periksa kedua tema.
- Semua kontrol interaktif punya `accessibilityLabel` dan `accessibilityRole`.
- Info tidak boleh dibawa warna saja (lihat bagian 2).
- Layout diuji pada skala font besar dan layar kecil (~360dp lebar).
- Urutan fokus/pembacaan *screen reader* logis (total saldo → dompet → input → daftar).

## 10. Aturan Implementasi untuk Agen/Pengembang

1. Hanya pakai token dari `tokens.ts`; dilarang hex/angka spasi langsung di komponen.
2. Setiap komponen UI baru: dokumentasikan varian & status di file komponen (komentar singkat).
3. Dukungan tema terang/gelap dari awal, bukan belakangan.
4. Tidak menambah library UI besar tanpa persetujuan; komponen dibuat sendiri dengan primitif React Native.
5. Perubahan token wajib memperbarui dokumen ini.
