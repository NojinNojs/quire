---
title: Quire — Technical Requirements
status: review
started: 2026-10-28
tags: [project, quire, tech]
---

# Quire — Technical Requirements

## Batasan yang Menentukan Pilihan

- Gratis, **tanpa kartu kredit**.
- Boleh menerima donasi (Vercel Hobby melarang pemakaian komersial; itu yang mengeluarkan Vercel dari daftar).
- Harus bisa dipindah ke VPS kalau donasi terkumpul — jadi jangan menulis kode yang hanya hidup di satu penyedia.
- Mobile-first, dipakai satu tangan, kadang tanpa sinyal.
- AI tidak boleh memakai kuota pribadi 9Router untuk pengguna lain.

## Susunan

| Lapisan | Pilihan | Alasan |
|---|---|---|
| Aplikasi + API | Cloudflare Workers (Pages Functions) | gratis, tanpa kartu, alamat `*.workers.dev`, boleh donasi |
| Antarmuka | React `19.3` + Vite `8.3` + TypeScript, PWA | satu bahasa untuk seluruh aplikasi, service worker untuk offline |
| API | Elysia `1.4` (Bun) | tipe otomatis ujung ke ujung, cepat, dan tetap bisa jalan di Cloudflare |
| Data | Supabase Postgres + Drizzle ORM `0.45` | satu tempat; SQL standar jadi mudah pindah ke VPS |
| Akun | Supabase Auth (email + kata sandi) | tidak perlu layanan tambahan |
| Foto cover | Supabase Storage | gratis 1 GB, cukup untuk ratusan cover |
| Baca halaman hak cipta | Cloudflare Workers AI (model vision) | kuota gratis harian; **bukan** 9Router |
| Katalog buku | Google Books + Open Library | gratis, tanpa kunci wajib |
| Alamat | `quire.workers.dev` | gratis; domain sendiri menyusul kalau perlu |

## Komponen Antarmuka

| Kebutuhan | Pilihan | Catatan |
|---|---|---|
| Gaya | CSS custom properties dari design system v1 | tanpa Tailwind: token sudah lengkap, dan radius 0–3 tidak butuh utility |
| Perilaku + aksesibilitas | Radix UI `1.8.1` | hanya untuk dialog, popover, dan tab |
| Ikon | set sendiri, 24px grid, stroke 1.75, ujung siku | bukan font ikon, bukan Lucide; 10 simbol di `app.js` |
| Gerak | CSS transition 120ms | cukup untuk 1px shift dan opacity; Motion hanya kalau nanti butuh choreography |

Catatan: tema dipilih lewat `data-theme` pada `<html>` (`shelf`, `municipal`, `oxford` × `light`, `dark`), token di `design-systems/themes/*.css`.

## Risiko yang Diketahui

- Adapter Cloudflare untuk Elysia masih **eksperimental**. API-nya hanya tiga endpoint, jadi
  kerusakan di sana tidak menjalar ke aplikasi. Jalan mundur: pindah ke Hono (satu berkas) atau
  jalankan API di Bun/VPS begitu donasi terkumpul.
- Supabase proyek gratis tidur setelah lama tidak dipakai; bangunnya beberapa detik.

## Aturan Portabilitas

1. SQL ditulis standar — tidak ada fungsi khusus Cloudflare di dalam query.
2. Penyimpanan gambar diakses lewat antarmuka S3, walau hari ini Supabase Storage.
3. Semua panggilan AI lewat satu modul `extract.ts`; ganti penyedia = ubah satu berkas.
4. Konfigurasi lewat variabel lingkungan, bukan nilai tertanam.
5. Tidak ada ketergantungan pada bindings Cloudflare di luar lapisan API.

## Alur Data Inti

1. **Masuk buku** → ISBN / kata kunci → katalog → kandidat → konfirmasi → simpan.
2. **Tanpa ISBN** → foto halaman judul → Workers AI → field yang terbaca saja → simpan dengan kolom kosong.
3. **Catat halaman** → tulis lokal dulu (IndexedDB) → kirim ke server saat ada sinyal.
4. **Hitung streak** → dilakukan di server saat halaman pertama hari itu masuk; satu baris per hari per pengguna.
5. **Kotak tahunan** → agregasi harian dari tabel progres, bukan dihitung ulang tiap muat halaman.

## Model Data Ringkas

`users` · `books` (satu baris per eksemplar, `isbn` boleh kosong, `pages` boleh kosong) · `works` (judul kanonik untuk mengelompokkan edisi) · `progress_log` (tanggal, halaman, buku) · `streaks` (hari terakhir, panjang, sisa pemulihan) · `notes` · `wishlist` · `annual_goals`

## Batas Gratis yang Harus Dipantau

- Supabase: 500 MB basis data, 1 GB penyimpanan, proyek tidur setelah lama tidak dipakai.
- Cloudflare Workers: 100.000 permintaan/hari.
- Workers AI: kuota harian; habis = fitur foto berhenti sementara, bukan tagihan.
- Google Books: batas harian per kunci; tanpa kunci lebih kecil.

## Yang Tidak Dipakai, dan Kenapa

- **Vercel** — paket gratis non-komersial, donasi saja sudah melanggar.
- **Firebase** — mahal saat tumbuh, dan keluar dari SQL standar.
- **9Router untuk pengguna umum** — itu kuota pribadi Aqsan.
- **VPS sekarang** — butuh uang dan perawatan sebelum ada pengguna.
