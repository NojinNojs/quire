---
title: Quire — Implementation Plan
status: review
started: 2026-10-28
tags: [project, quire, plan]
---

# Quire — Implementation Plan

Aturan tunggal: **irisan vertikal dulu.** Tiap tahap berakhir dengan sesuatu yang bisa dibuka di HP, bukan tumpukan modul setengah jadi.

## Tahapan

| # | Nama | Cabang | Selesai kalau |
|---|---|---|---|
| 0 | Fondasi repo | `chore/boot` | Vite + React + TypeScript menyala, Biome bersih, Vitest jalan satu uji, deploy kosong ke `quire.workers.dev` |
| 1 | Akun | `feat/auth` | Daftar, masuk, keluar lewat Supabase; sesi bertahan setelah aplikasi ditutup; RLS terbukti menolak akses rak orang lain |
| 2 | Tambah lewat katalog | `feat/catalog-add` | Ketik "Bumi Manusia", muncul kandidat, satu ditekan, buku tersimpan dan tampil di rak |
| 3 | Rak dan kelas | `feat/shelf` | Buku terkelompok per kelas, saring per status dan bahasa; kosong punya layar yang jelas |
| 4 | Catat halaman | `feat/progress` | Stepper menulis ke `progress_log`, buku pindah ke `reading`, Undo bekerja |
| 5 | Streak dan kotak tahun | `feat/streak` | Satu halaman menyalakan hari ini, streak bertambah, kotak tahun menampilkan halaman per hari |
| 6 | Tanpa barcode | `feat/photo-entry` | Foto halaman judul menghasilkan field terisi; kolom kosong tetap kosong; semua bisa disunting |
| 7 | Mode sapu | `feat/sweep` | Tiga puluh buku berturut-turut tanpa kembali ke menu |
| 8 | Selesai, rating, berikutnya | `feat/finish-flow` | Menandai selesai mengisi `finished_at`, menawarkan buku berikutnya, boleh dilewati |
| 9 | Wishlist dan catatan | `feat/wishlist-notes` | Wishlist terpisah dari rak; catatan dan foto halaman tersimpan per buku |
| 10 | Offline | `feat/offline` | Mode pesawat: catat halaman tetap jalan, terkirim sendiri saat sinyal kembali |
| 11 | Rupa dan poles | `feat/design-pass` | Design system terpasang penuh: kaca, tipografi, gerak, aksesibilitas lolos |
| 12 | Rilis | `feat/release` | PWA bisa dipasang, ikon dan splash benar, versi `0.1.0` ditandai |

## Urutan yang Tidak Boleh Dibalik

1. Akun sebelum apa pun — tanpa pemilik, RLS tidak bisa diuji.
2. Rak sebelum progres — tanpa buku, tidak ada yang dicatat.
3. Progres sebelum rupa — kalau rupa didahulukan, yang diuji cuma tampilan kosong.

## Uji

- **Vitest** untuk logika murni: hitung streak, pemulihan streak, pengelompokan kelas, penggabungan hasil katalog.
- **Playwright** untuk lima jalur: daftar, tambah buku, catat halaman, selesai lalu pilih berikutnya, mode pesawat.
- Uji RLS ditulis sebagai uji basis data: pengguna A tidak bisa membaca, mengubah, atau menghapus baris pengguna B.

## Definisi Selesai per Tahap

Sebuah tahap dianggap selesai hanya kalau: `biome check` bersih, uji lulus, aplikasi ter-deploy, dan Aqsan bisa memakainya di HP-nya sendiri. Bukan "di komputerku jalan".

## Perkiraan Kasar

Tahap 0–2 satu malam. Tahap 3–5 satu malam. Tahap 6–8 satu malam. Tahap 9–12 satu malam lagi, dengan jeda pemakaian nyata di antaranya — pemakaian nyata selalu menemukan hal yang tidak terlihat di dokumen.

## Yang Tidak Dikerjakan Sekarang

Aplikasi native, impor Goodreads, ekspor, sosial, dan lokasi rak. Semua sudah diputuskan keluar dari MVP.
