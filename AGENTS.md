# AGENTS.md — Panduan Agen AI untuk "Sisa"

> File ini dibaca agen AI (mis. Google Antigravity) di awal sesi. Ia berisi aturan kerja yang **wajib** diikuti.
> Dokumen rujukan: `docs/PRD.md`, `docs/DESIGN_SYSTEM.md`, `docs/ARCHITECTURE.md`. Jika ada konflik, urutan prioritas: **instruksi pengguna di sesi ini → PRD → ARCHITECTURE → DESIGN_SYSTEM → file ini**. Jika ada konflik yang tidak jelas, **berhenti dan tanyakan**, jangan menebak.

---

## 1. Konteks Proyek

Aplikasi Android pencatat keuangan pribadi (React Native + Expo + TypeScript) untuk pengguna dengan dua dompet: rekening bank (QRIS) dan GoPay. Fokus: pencatatan nyaris tanpa usaha lewat input teks, dan Koreksi Saldo agar data tetap akurat meski sebagian transaksi terlupa. Semua data lokal dan offline.

**Pemilik proyek adalah pelajar-pengembang (level menengah, bisa web).** Proyek ini untuk **portofolio karier**, sehingga pemilik harus *memahami* kode yang dihasilkan. Agen berperan sebagai pemandu dan akselerator, bukan sekadar generator.

## 2. Batas Cakupan V1 (JANGAN dilanggar)

**Dikerjakan:** dompet, quick input + parser, 4 jenis entri (pengeluaran, pemasukan, transfer, penyesuaian), layar utama, form transaksi, koreksi saldo, kelola dompet, build APK.

**Dilarang ditambahkan tanpa persetujuan eksplisit:**
- Kategori, grafik, ekspor, tema kustom, widget
- Notifikasi (jadwal/harian) dan penangkapan notifikasi bank/GoPay
- Backend, akun, sinkronisasi cloud, analitik, panggilan jaringan apa pun
- Kode native Kotlin/Swift
- Library UI besar atau state library baru

Jika agen merasa fitur di luar daftar "dikerjakan" berguna, **usulkan secara tertulis**, jangan implementasikan.

## 3. Alur Kerja Wajib (Satu Tugas = Satu Siklus)

Untuk setiap tugas, ikuti urutan ini:

1. **Baca** dokumen rujukan yang relevan. Sebutkan bagian PRD/ARCHITECTURE yang mendasari tugas.
2. **Rencana singkat** (maks ±10 baris): file yang akan dibuat/diubah dan alasannya. Tunggu persetujuan bila perubahannya besar (>5 file atau mengubah struktur).
3. **Tulis tes dulu** untuk logika domain (parser, saldo, koreksi, uang). Tampilkan tes, jalankan, pastikan **gagal** dengan alasan yang benar.
4. **Implementasi minimal** hingga tes lulus.
5. **Jalankan** pemeriksaan: tes, `tsc --noEmit`, lint. Laporkan hasil **apa adanya**; jangan klaim lulus jika tidak dijalankan.
6. **Penjelasan untuk pemilik** (mode belajar): ringkas konsep kunci kode, mengapa dirancang begitu, dan **satu bagian yang sebaiknya pemilik ubah/tulis sendiri** sebagai latihan.
7. **Usulkan pesan commit** (Conventional Commits, mis. `feat(parser): parse jt and k suffixes`). Satu perubahan logis per commit.

Tugas **tidak selesai** sampai Definition of Done (bagian 8) terpenuhi.

## 4. Perintah

> Verifikasi dan perbarui bagian ini setelah proyek dibuat. Jangan mengarang perintah; periksa `package.json` dan dokumentasi resmi Expo.

```bash
npm install                 # pasang dependensi
npx expo start              # jalankan dev server (uji di HP)
npm test                    # jalankan unit test (Jest)
npx tsc --noEmit            # cek tipe
npm run lint                # lint (jika skrip tersedia)
```

Build APK memakai EAS Build; ikuti dokumentasi Expo terkini dan konfirmasi dengan pemilik sebelum menjalankan (membutuhkan akun dan memakai kuota).

## 5. Aturan Kode

### Umum
- TypeScript `strict`. **Dilarang** `any` dan `@ts-ignore` tanpa komentar alasan yang jelas.
- Fungsi kecil, bernama jelas. Tidak ada "kode ajaib" tanpa komentar mengapa.
- Komentar menjelaskan **mengapa**, bukan mengulang apa yang kode lakukan.
- Tidak ada dependensi baru tanpa persetujuan. Saat mengusulkan: sebutkan alasan, ukuran/pemeliharaan, dan alternatif tanpa library.
- **Jangan mengasumsikan API library dari ingatan.** Periksa dokumentasi resmi / versi terpasang di `package.json`. API yang sudah usang atau tidak ada adalah kegagalan umum kode AI; verifikasi sebelum memakai.

### Arsitektur (lihat `docs/ARCHITECTURE.md`)
- `src/domain/` **murni**: tanpa import React, Expo, SQLite, atau lapisan lain.
- UI tidak mengakses SQLite langsung; lewat `app-services` / repository.
- Saldo **dihitung** dari transaksi, tidak pernah disimpan sebagai kolom.
- Semua nominal **integer Rupiah**. Dilarang floating point untuk uang.
- Penulisan DB multi-langkah **dalam satu transaksi DB**.
- Perubahan skema = file migrasi baru; jangan edit migrasi lama.

### UI (lihat `docs/DESIGN_SYSTEM.md`)
- Hanya pakai token dari `src/ui/theme/tokens.ts`; **dilarang** hex/angka spasi langsung di komponen.
- Dukung tema terang dan gelap sejak awal.
- Pengeluaran **tidak** berwarna merah; merah hanya untuk aksi hapus.
- Teks UI Bahasa Indonesia, nada netral, tidak menghakimi (lihat bagian Nada Bahasa).
- Target sentuh ≥ 48dp dan `accessibilityLabel` pada kontrol interaktif.

### Parser (area berisiko tertinggi)
- Fungsi murni; kegagalan parsing = `{ ok: false }`, bukan exception.
- Setiap aturan dan kasus ambigu punya tes berbentuk tabel `input → hasil`.
- Kasus gagal nyata dari pemakaian ditambahkan sebagai tes baru sebelum diperbaiki.

## 6. Keamanan & Privasi

- Dilarang menambahkan panggilan jaringan, analitik, atau pelaporan crash pihak ketiga.
- Dilarang menaruh rahasia/kunci API di repo atau `.env` yang ter-commit.
- Dilarang `console.log` data transaksi pada kode produksi.
- Jangan menjalankan perintah destruktif (`rm -rf`, menghapus database/migrasi, `git push --force`, `git reset --hard`) tanpa konfirmasi eksplisit pemilik.
- Jangan membaca/menulis di luar folder proyek.
- Jangan meminta atau memproses data keuangan asli pemilik; gunakan data contoh/fiktif untuk tes.

## 7. Urutan Tugas V1 (Panduan Kerja)

Kerjakan **berurutan**, satu per sesi, konfirmasi sebelum lanjut.

| # | Tugas | Hasil | Tes wajib |
|---|-------|-------|-----------|
| T1 | Setup proyek Expo + TypeScript strict + Jest + ESLint; jalankan di HP | Aplikasi kosong tampil di perangkat | Satu tes contoh lulus |
| T2 | `domain/types.ts`, `money.ts` (parse & format Rupiah) | Fungsi uang | Tabel kasus nominal & format |
| T3 | `domain/balance.ts` + `reconcile.ts` | Hitung saldo & selisih | Invarian: transfer tidak ubah total; koreksi → saldo = aktual |
| T4 | Skema SQLite, migrasi, repository wallet & transaksi | Penyimpanan lokal | Tes integrasi bila praktis |
| T5 | `quickInputParser.ts` | Parser lengkap sesuai ARCHITECTURE §5.3 | Tabel tes besar (≥ 30 kasus, termasuk ambigu) |
| T6 | Tema & token + komponen dasar (Button, AmountField, WalletPicker) | Dasar UI | Uji manual terang/gelap |
| T7 | Layar Beranda: total saldo, WalletCard, daftar transaksi | Tampilan utama | Uji manual |
| T8 | QuickInputBar + pratinjau + simpan + form fallback | Fitur inti pencatatan | Uji manual AC-1…AC-6 |
| T9 | Edit/hapus (+Urungkan), Kelola Dompet | Kelengkapan CRUD | Uji manual |
| T10 | ReconcileSheet (Koreksi Saldo) | Fitur koreksi | AC-5 + uji manual |
| T11 | Onboarding, polesan, README, build APK | Dapat diinstal dan dipakai | Checklist AC-1…AC-7 |

## 8. Definition of Done (per tugas)

- [ ] Perilaku sesuai PRD / kriteria penerimaan terkait
- [ ] Tes domain ditulis **sebelum** implementasi, dan lulus
- [ ] `tsc --noEmit` dan lint bersih (atau pengecualian dijelaskan)
- [ ] Tidak ada nilai hardcode warna/spasi; tidak ada `any` tanpa alasan
- [ ] Tidak melanggar batas cakupan V1
- [ ] Penjelasan mode belajar diberikan + satu latihan untuk pemilik
- [ ] Hasil pengecekan dilaporkan jujur, termasuk hal yang **belum** diuji di perangkat nyata
- [ ] Pesan commit diusulkan

## 9. Mode Belajar (Penting untuk Tujuan Portofolio)

- Jelaskan kode dengan bahasa sederhana setelah menulisnya; hindari dump kode tanpa penjelasan.
- Jika pemilik bertanya "kenapa?", jelaskan alasan desain dan alternatifnya, termasuk kekurangannya.
- Untuk bagian sulit (parser, perhitungan saldo, transaksi DB), **dorong pemilik menulis sendiri versi pertama**, lalu agen meninjau dan memberi masukan.
- Saat ada bug: jelaskan **akar masalah**, bukan hanya menambal. Jika dua percobaan perbaikan gagal, **berhenti**, ringkas apa yang sudah dicoba, dan minta arahan. Jangan berputar atau menebak-nebak berulang.
- Jujur soal ketidakpastian: gunakan label **[Yakin]**, **[Cukup yakin]**, **[Tidak yakin, perlu diverifikasi]** untuk klaim teknis penting (versi library, perilaku Android, kebijakan toko).

## 10. Cara Berkomunikasi

- Bahasa Indonesia; istilah teknis boleh bahasa Inggris.
- Langsung ke inti; tanpa basa-basi pembuka.
- Jangan mengarang sumber, dokumentasi, atau perilaku. Jika tidak tahu, katakan tidak tahu dan sarankan cara memverifikasi.
- Jika permintaan ambigu, ajukan **satu** pertanyaan klarifikasi yang paling menentukan sebelum bekerja.
- Laporkan akhir tugas dengan format: **Apa yang dibuat → Hasil tes/cek → Yang belum terverifikasi → Langkah berikutnya.**

## 11. Prompt Pembuka yang Disarankan (untuk Pemilik)

Tempel sebagai pesan pertama sesi baru:

```
Baca AGENTS.md, docs/PRD.md, docs/ARCHITECTURE.md, dan docs/DESIGN_SYSTEM.md.
Kita mengerjakan tugas T1 dari AGENTS.md bagian 7.
Ikuti alur kerja bagian 3. Mulai dengan rencana singkat dan tunggu persetujuan saya
sebelum membuat atau mengubah file. Jangan menambah dependensi tanpa bertanya.
Periksa dokumentasi resmi Expo untuk perintah setup terbaru, jangan dari ingatan.
```

Untuk tugas berikutnya: `Lanjut ke T<n>. Ringkas dulu kondisi proyek saat ini, lalu ikuti alur kerja.`

## 12. Catatan Penempatan File (untuk Pemilik)

Lokasi file aturan Antigravity bisa berbeda antar versi. Sumber yang saya temukan (blog pihak ketiga, bukan dokumentasi resmi) menyebut `AGENTS.md` dibaca dari root proyek sejak pembaruan Maret 2026, dengan `GEMINI.md` berprioritas lebih tinggi, serta folder `.agent/rules/` atau `.agents/rules/` untuk aturan workspace. **[Cukup yakin, perlu diverifikasi]** Periksa panel *Rules/Customizations* di Antigravity dan dokumentasi resmi Google. Jika `AGENTS.md` tidak terbaca, buat file aturan di folder rules workspace yang merujuk ke file ini.
