# PRD — Pencatat Keuangan "Sisa" (V1)

> Nama "Sisa" adalah placeholder. Ganti sesuai keinginan.
> Status: Draft V1 · Platform: Android (utama) · Stack: React Native + Expo + TypeScript

---

## 1. Latar Belakang & Masalah

Pengguna utama (pembuat aplikasi) menghadapi tiga masalah nyata dengan pencatatan keuangan:

1. **Malas mencatat**: form input terlalu berlapis, sehingga ditinggalkan.
2. **Lupa mencatat**: data selalu bolong, sehingga saldo di aplikasi tidak pernah cocok dengan kenyataan.
3. **Tidak tahu / malas melihat sisa uang**: aplikasi yang harus dibuka secara aktif akhirnya tidak pernah dibuka.

**Wawasan inti:** akar ketiganya adalah *gesekan* dan *penghindaran*. Aplikasi harus (a) membuat pencatatan nyaris tanpa usaha, (b) tetap berguna meski data bolong, dan (c) nantinya mendatangi pengguna, bukan menunggu dibuka.

## 2. Tujuan V1

| ID | Tujuan | Ukuran keberhasilan |
|----|--------|---------------------|
| G1 | Mencatat transaksi sangat cepat | Satu transaksi via input teks selesai ≤ 5 detik (diukur manual) |
| G2 | Tetap akurat meski lupa mencatat | Fitur Koreksi Saldo membuat saldo aplikasi = saldo nyata dalam ≤ 3 ketukan |
| G3 | Terpakai nyata | Pembuat memakainya sendiri **7 hari berturut-turut** di HP Android |
| G4 | Layak untuk portofolio | Logika inti punya unit test; README menjelaskan keputusan desain |

## 3. Non-Goals (Sengaja Tidak Dikerjakan di V1)

- Auto-capture notifikasi bank/GoPay (rencana V2, hanya Android)
- Notifikasi harian & angka "aman dibelanjakan" (V1.1)
- Kategori, grafik, ekspor, tema kustom
- Akun pengguna, backend, sinkronisasi cloud
- Dukungan iOS (tidak diblokir secara teknis, tapi tidak diuji di V1)
- Multi-mata uang

## 4. Persona

**Pengguna utama (dogfooding):** pekerja/mahasiswa di Indonesia, bayar harian lewat **QRIS dari rekening bank** dan **GoPay**, sudah pernah meninggalkan aplikasi pencatat lain karena ribet.

## 5. Konsep Inti

- **Dompet:** sumber uang. V1 punya dua dompet awal: `Bank` dan `GoPay` (pengguna boleh menambah/mengubah nama).
- **Empat jenis entri:**

| Jenis | Efek saldo | Masuk statistik belanja? |
|-------|-----------|--------------------------|
| Pengeluaran | − pada 1 dompet | Ya |
| Pemasukan | + pada 1 dompet | Tidak |
| **Transfer antar dompet** | − dompet asal, + dompet tujuan | **Tidak** |
| Penyesuaian (hasil Koreksi Saldo) | ± pada 1 dompet | Ditandai terpisah ("tak tercatat") |

- **Mengapa Transfer penting:** top-up GoPay dari bank hanya memindahkan uang. Jika dicatat sebagai pengeluaran, belanja akan terhitung dua kali.
- **Invarian bisnis:** transfer tidak boleh mengubah total saldo seluruh dompet.

## 6. User Stories

- **US1** Sebagai pengguna, saya mengetik "kopi 25rb gopay" lalu transaksi tercatat tanpa mengisi form.
- **US2** Sebagai pengguna, jika input tidak terbaca, saya bisa mengisi form biasa dengan data yang sudah terisi sebagian.
- **US3** Sebagai pengguna, saya mencatat top-up GoPay sebagai transfer dari Bank ke GoPay.
- **US4** Sebagai pengguna, saya melihat saldo tiap dompet dan total saldo di layar utama.
- **US5** Sebagai pengguna, saya mengetik saldo aktual sebuah dompet dan aplikasi mencatat selisihnya otomatis.
- **US6** Sebagai pengguna, saya bisa mengedit atau menghapus transaksi yang salah.

## 7. Kebutuhan Fungsional

### FR-1 Manajemen Dompet
- FR-1.1 Aplikasi dimulai dengan *onboarding* singkat: buat dompet + isi saldo awal (dua dompet default disarankan).
- FR-1.2 Saldo dompet = `saldo_awal + Σ efek transaksi` (dihitung dari data, tidak disimpan sebagai angka mandiri).
- FR-1.3 Pengguna dapat menambah, mengganti nama, dan mengarsipkan dompet. Dompet yang punya transaksi tidak boleh dihapus permanen.

### FR-2 Input Cepat (Quick Input)
- FR-2.1 Satu kolom teks di layar utama, selalu terlihat.
- FR-2.2 Parser mengenali nominal: `25rb`, `25k`, `25.000`, `25000`, `1,5jt`, `1.5jt`, `2jt`.
- FR-2.3 Parser mengenali dompet dari nama/alias dompet yang ada; jika tidak disebut, gunakan **dompet terakhir dipakai**.
- FR-2.4 Parser mengenali jenis: kata kunci pemasukan (`gaji`, `masuk`, `terima`), transfer (`topup`, `top up`, `tf`, `transfer` + pola `dari X ke Y`), selain itu dianggap pengeluaran.
- FR-2.5 Parser mengenali tanggal sederhana: tanpa kata tanggal = hari ini; `kemarin` = kemarin.
- FR-2.6 Sebelum disimpan, tampilkan **pratinjau satu baris** hasil parsing (nominal, dompet, jenis) yang bisa dikonfirmasi dengan satu ketukan.
- FR-2.7 Jika nominal tidak terbaca, buka form manual dengan teks asli sebagai catatan.
- FR-2.8 Parser adalah **fungsi murni** tanpa efek samping dan tanpa jaringan.

### FR-3 Template Satu Ketuk (Opsional V1, prioritas rendah)
- FR-3.1 Pengguna menyimpan template (mis. "Kopi 25rb GoPay") dan mencatatnya dengan satu ketukan.

### FR-4 Transfer Antar Dompet
- FR-4.1 Transfer memiliki dompet asal ≠ dompet tujuan, nominal > 0.
- FR-4.2 Transfer tidak muncul sebagai pengeluaran/pemasukan.

### FR-5 Koreksi Saldo (Reconciliation)
- FR-5.1 Pengguna memilih dompet, mengetik saldo aktual.
- FR-5.2 Aplikasi menghitung `selisih = saldo_aktual − saldo_di_aplikasi` dan menampilkannya sebelum konfirmasi.
- FR-5.3 Setelah konfirmasi, buat entri **Penyesuaian** senilai selisih (bertanda + atau −). Jika selisih 0, tidak membuat entri.
- FR-5.4 Penyesuaian tampil di daftar dengan label "Tak tercatat".

### FR-6 Daftar & Layar Utama
- FR-6.1 Layar utama: total saldo, kartu saldo tiap dompet, kolom input cepat, daftar transaksi terbaru (urut waktu menurun).
- FR-6.2 Edit dan hapus transaksi dari daftar (hapus meminta konfirmasi ringan atau menyediakan "Urungkan").

### FR-7 Data
- FR-7.1 Semua data tersimpan **lokal di perangkat**. Tidak ada pengiriman data keuangan ke jaringan.
- FR-7.2 Nominal disimpan sebagai **bilangan bulat Rupiah** (tanpa desimal).

## 8. Kriteria Penerimaan (Contoh Kunci)

| ID | Skenario | Hasil yang diharapkan |
|----|----------|-----------------------|
| AC-1 | Input `kopi 25rb gopay` | Pengeluaran Rp 25.000, dompet GoPay, catatan "kopi" |
| AC-2 | Input `topup gopay 100rb dari bank` | Transfer Bank→GoPay Rp 100.000; total saldo tidak berubah |
| AC-3 | Input `gaji 5jt bank` | Pemasukan Rp 5.000.000 di Bank |
| AC-4 | Input `1,5jt` | Nominal 1.500.000 |
| AC-5 | Saldo app GoPay Rp 80.000, pengguna ketik aktual Rp 65.000 | Penyesuaian −15.000; saldo GoPay menjadi 65.000 |
| AC-6 | Input `makan` (tanpa nominal) | Form manual terbuka, tidak ada transaksi tersimpan otomatis |
| AC-7 | Tutup & buka ulang aplikasi | Semua data tetap ada |

## 9. Kebutuhan Non-Fungsional

- **Performa:** layar utama tampil < 1 detik pada HP Android kelas menengah dengan ±1.000 transaksi (verifikasi manual).
- **Offline penuh:** seluruh fitur V1 berjalan tanpa internet.
- **Privasi:** tanpa analitik pihak ketiga dan tanpa telemetri di V1.
- **Aksesibilitas:** target sentuh ≥ 48dp, kontras teks memadai, label aksesibilitas pada kontrol utama.
- **Bahasa:** UI Bahasa Indonesia.

## 10. Metrik Keberhasilan (Dogfooding)

Dicatat manual selama 2 minggu pemakaian:
- Jumlah hari dalam seminggu pengguna mencatat / melakukan koreksi saldo
- Rata-rata waktu mencatat satu transaksi
- Jumlah kali input gagal diparse (menjadi bahan perbaikan parser)
- Catatan kualitatif: apa yang membuat berhenti memakai?

> Tidak ada jaminan aplikasi ini mengubah perilaku. Hasil jujur (termasuk kegagalan dan perbaikannya) adalah bahan cerita portofolio.

## 11. Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
|--------|--------|----------|
| Parser salah menafsirkan input | Data keliru | Pratinjau sebelum simpan + fallback form + banyak unit test |
| Pengguna tetap malas membuka aplikasi | Aplikasi ditinggalkan | V1.1 menambah notifikasi pengingat |
| Cakupan melebar | V1 tidak selesai | Daftar Non-Goals dijaga ketat |
| Kode hasil AI tidak dipahami | Sulit debug & interview | Aturan "tes dulu + minta penjelasan" di AGENTS.md |

## 12. Roadmap

| Versi | Isi |
|-------|-----|
| **V1** | Dompet, input cepat, 4 jenis entri, layar utama, koreksi saldo, build APK |
| **V1.1** | Notifikasi harian: angka "aman dibelanjakan" + pengingat malam; template satu ketuk |
| **V1.5** | *Spike* Kotlin: tangkap notifikasi mentah (validasi kelayakan) |
| **V2** | Parser notifikasi bank/GoPay (Android), dedupe, antrean tinjauan |

## 13. Pertanyaan Terbuka

1. Gajian tanggal tetap atau tidak menentu? (menentukan rumus "aman dibelanjakan" di V1.1)
2. Apakah kategori dibutuhkan setelah 2 minggu pemakaian, atau cukup catatan bebas?
3. Apakah dompet tunai perlu ditambahkan?
4. Format sampel notifikasi bank/GoPay (direkam sendiri, data sensitif disamarkan) sebelum V2.
