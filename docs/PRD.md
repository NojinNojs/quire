---
title: Quire — PRD v2
status: review
started: 2026-10-28
tags: [project, quire, books, product]
---

# Quire — PRD v2

*Quire*: kuras kertas yang dilipat dan dijahit menjadi buku. Satu suku kata, hanya berarti bagi orang yang pernah membuka punggung buku.

**Satu kalimat:** katalog buku pribadi yang membuat rak terasa seperti perpustakaan — dan membuat kamu kembali membaca tiap hari.

## Masalah

Sekitar 100 buku, tersebar di lemari dan meja, tercampur. Tidak ada satu tempat yang tahu buku apa saja yang dimiliki, mana yang belum dibaca, dan mana yang sedang berjalan. Katalog daring tidak mengenal banyak edisi Indonesia. Waktu luang habis untuk menggulir.

## Prinsip

1. **Dibuka di mana saja** — ponsel, laptop, kapan pun. Bukan alat yang terikat satu mesin.
2. **Masuk dalam satu pindai atau satu foto** — kalau mencatat butuh mengetik, rak tetap kosong.
3. **Simpan dulu, lengkapi nanti** — judul dan penulis cukup untuk masuk rak.
4. **Rak terurut seperti perpustakaan** — dikelompokkan per kelas, bukan daftar acak.
5. **Jangan mengarang** — metadata yang tidak diketahui dibiarkan kosong, tidak ditebak diam-diam.
6. **Jangan melawan kebiasaan fisik** — anotasi tetap di halaman buku; aplikasi hanya menyimpan ringkasannya.

## Tujuan

1. Semua buku tercatat dan bisa ditemukan kembali.
2. Membaca lebih sering, bukan lebih banyak sekaligus.
3. Waktu menggulir berpindah ke halaman.

## Keputusan yang Sudah Dikunci

| Hal | Keputusan |
|---|---|
| Pengguna | Aqsan dulu; teman-teman menyusul lewat pendaftaran biasa |
| Bentuk | PWA mobile-first, bisa dipasang di HP |
| Buku aktif | **Satu** buku aktif. Menutup buku langsung menawarkan buku berikutnya |
| Streak | 1 halaman sudah dihitung. Boleh dipulihkan **1× per bulan** |
| Riwayat | Kotak tahunan ala GitHub, warnanya dari jumlah halaman per hari |
| Wishlist | Ada, terpisah dari rak. Tanpa pelacakan harga |
| Pinjam-meminjam | Tidak ada sistem. Cukup dicatat di kotak catatan buku |
| Lokasi fisik | **Dihapus.** Tidak pernah ditanya, tidak pernah ditampilkan |
| Edisi | Tiap edisi = baris sendiri. Peringatan kalau ISBN sudah ada, tanpa menggabung |
| Bahasa | Ada penanda bahasa per buku; statistik bisa dilihat per bahasa |
| Anotasi | Satu kotak catatan bebas + foto halaman yang distabilo. Tidak diekspor |
| Rating | Bintang 1–5 |
| Target tahunan | Ada, tampil di layar utama |
| Masuk buku | Pindai barcode, cari judul, foto halaman judul/hak cipta, atau ketik manual |
| Mode sapu | Scan berturut-turut tanpa berhenti, untuk 100 buku pertama |
| Cover | URL katalog; foto sendiri kalau edisinya salah |

## Yang Masuk MVP

- Tambah buku: pindai, cari, foto, ketik. Mode sapu.
- Kelas buku otomatis (DDC) dan pengelompokan rak per kelas.
- Layar **Hari Ini**: buku aktif, catat halaman, streak, target tahunan.
- **Rak**: dikelompokkan per kelas, bisa disaring status dan bahasa.
- **Cari** yang menemukan judul, penulis, dan kelas.
- Detail buku: metadata, catatan, foto stabilo, rating, status, antar-edisi.
- Kotak tahunan.
- Akun: daftar, masuk, rak terpisah per orang.

## Yang Ditunda

Sosial, mengikuti teman, pinjam-meminjam, Reading Wrapped, rekomendasi AI, impor Goodreads, aplikasi native, lokasi rak, pelacakan harga wishlist, ekspor.

## Layar

1. **Hari Ini** — cover buku aktif, progres halaman, stepper besar, streak, sisa target tahunan. Tanpa buku aktif: satu kalimat dan tombol memilih.
2. **Rak** — kelompok per kelas (`800 — Sastra`), tiap baris: cover kecil, judul, penulis, status, bahasa.
3. **Cari** — satu kolom; hasil rak di atas, kandidat katalog di bawah.
4. **Detail** — metadata, progres, rating, status, catatan, foto stabilo, daftar edisi lain dari judul yang sama.
5. **Tambah** — empat jalan masuk, lalu blok konfirmasi yang menampilkan edisi sebelum disimpan.
6. **Tahun** — kotak tahunan dan angka: buku selesai, halaman, bahasa.
7. **Pengaturan** — akun, tema, target tahunan.

## Nada Visual

Editorial berbasis kertas, bukan kaca. Tiga tema pilihan pembaca (`shelf`, `municipal`, `oxford`) dengan mode terang dan gelap; rincian di [[QUIRE_DESIGN_SYSTEM]] dan `design-systems/DESIGN_SYSTEM.md`.

Huruf: Newsreader italic hanya untuk judul buku, Plus Jakarta Sans untuk antarmuka, mono untuk angka. Radius 0 untuk pita, 2 untuk input dan tombol, 3 untuk kartu. Satu aksen per layar. Ikon satu set geometris 24px, stroke 1.75.

Teks antarmuka **bahasa Inggris**; istilah pustaka Indonesia hanya untuk nama diri dan `TETRALOGI PULAU BURU`.

## Definisi Selesai

1. 100 buku masuk tanpa mengetik satu judul pun.
2. Buku tanpa barcode, tanpa ISBN, tanpa KDT tetap bisa masuk dan tercatat progresnya.
3. Streak tujuh hari tercapai tanpa pengingat.
4. Kotak tahunan terisi dan bisa dilihat per bahasa.

## Pertanyaan Terbuka

- Statistik per bahasa: cukup angka, atau perlu target terpisah untuk buku Inggris?
- Kalau buku selesai, tawaran buku berikutnya diambil dari wishlist, dari rak yang belum dibaca, atau urutan kelas?
