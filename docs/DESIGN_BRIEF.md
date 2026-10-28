---
title: Quire — Design Brief
status: review
started: 2026-10-28
tags: [project, quire, design]
---

# Quire — Design Brief

## Rasa yang Dituju

Arah kaca gelap **dibatalkan** 28 Oktober 2026. Penggantinya: sistem editorial berbasis kertas, dengan tiga tema yang bisa dipilih pembaca.

Rujukan resmi: `/home/nojin/works/quire-mockups/design-systems/DESIGN_SYSTEM.md` (v1), ringkasannya di [[QUIRE_DESIGN_SYSTEM]].

Yang berlaku sekarang: permukaan kertas tanpa blur, gradien, atau glow; tiga tema (`shelf`, `municipal`, `oxford`) dengan mode terang dan gelap; radius 0 pita, 2 input dan tombol, 3 kartu; Newsreader italic hanya untuk judul buku; teks antarmuka bahasa Inggris; ikon satu set geometris 24px stroke 1.75; satu aksen per layar.

## Warna

| Token | Nilai | Pakai |
|---|---|---|
| `--bg` | `#12100E` | latar utama, hangat bukan hitam murni |
| `--bg-raise` | `#171412` | latar panel yang menempel |
| `--glass` | `rgba(255,255,255,0.045)` | permukaan kartu |
| `--glass-strong` | `rgba(255,255,255,0.075)` | kartu aktif, panel bawah |
| `--line` | `rgba(255,255,255,0.09)` | garis 1 px, rambut |
| `--ink` | `#F3EEE6` | teks utama |
| `--ink-mute` | `rgba(243,238,230,0.62)` | teks kedua |
| `--ink-faint` | `rgba(243,238,230,0.38)` | label, metadata |
| `--accent` | `#C9A227` | satu aksen: garis progres, tautan |
| `--danger` | `#C2543C` | hapus, peringatan |

Aturan: **tidak ada warna status**. Tidak ada titik hijau, tidak ada lencana merah. Status dibaca dari kata dan posisi.

Latar punya dua orb lembut: amber `rgba(201,162,39,0.10)` di kiri atas, zaitun `rgba(96,108,74,0.10)` di kanan bawah, blur 120 px, tidak bergerak.

## Tipografi

- **Plus Jakarta Sans** — seluruh teks antarmuka. Bobot 400, 500, 600 saja.
- **Newsreader italic** — judul buku, kutipan, angka besar. Hanya italic.

| Peran | Ukuran / tinggi baris | Bobot |
|---|---|---|
| Judul layar | 28 / 32 | 600 |
| Judul buku | 22 / 28 | Newsreader italic |
| Isi | 16 / 24 | 400 |
| Metadata | 14 / 20 | 400, `--ink-mute` |
| Label kecil | 12 / 16 | 500, huruf besar, spasi 0.06em |
| Angka besar (streak) | 44 / 44 | Newsreader italic |

Tidak ada ukuran di bawah 12 px. Tidak ada teks rata kanan-tengah kecuali angka besar.

## Spasi dan Bentuk

- Grid 8 px: 4 (rambut), 8, 16, 24, 32, 48.
- Radius konsentris: `R_outer = R_inner + padding`. Kartu 16, isi di dalamnya 8.
- Panel bawah (sheet) radius 24 di dua sudut atas.
- Garis pemisah selalu 1 px `--line`, tidak pernah lebih tebal.

## Kaca

Resep permukaan, satu untuk seluruh aplikasi:

```
background: var(--glass);
backdrop-filter: blur(20px) saturate(140%);
border: 1px solid var(--line);
border-radius: 16px;
box-shadow: 0 1px 0 rgba(255,255,255,0.04) inset, 0 12px 32px rgba(0,0,0,0.28);
```

Kartu yang bisa ditekan naik ke `--glass-strong` dan bergeser 1 px, tidak membesar.

## Gerak

- Durasi: 220 ms (ganti isi), 280 ms (perpindahan layar), 320 ms (panel bawah).
- Easing tunggal: `cubic-bezier(0.65, 0, 0.35, 1)`.
- Satu gerak bermakna per layar. Cover membesar dari daftar ke detail; stepper bergeser saat angka berubah.
- `prefers-reduced-motion`: semua durasi jadi 0 ms, tanpa pengecualian.

## Cover Buku

Tidak ada foto. Cover dibuat dari kain: panel warna dengan judul Newsreader, penulis kecil di bawah, garis tipis di tepi punggung.

Lima warna kain: `#5A2A2F` (oxblood), `#4A5138` (zaitun), `#2E3A52` (indigo), `#7A5A2A` (okher), `#2C3B3B` (teal arang).

Warna ditetapkan dari **hash ISBN** — jadi tiap edisi mendapat kain berbeda, bukan tiap judul. Tiga Bumi Manusia milik Aqsan (cetakan 1980, Penguin, seabad 2025) harus terlihat sebagai tiga benda berbeda. Kalau ISBN tidak ada, hash memakai `judul + penerbit + tahun`.

Selain warna, cover kain selalu mencetak baris kecil di bawah penulis: **cetakan dan tahun**, mis. `Cet. 3 · 1964`. Untuk buku berbahasa Inggris, baris itu ditambah kode bahasa `EN` di sudut atas. Dengan begitu dua edisi berjudul sama tidak pernah bisa tertukar, bahkan oleh mata yang lewat sekilas.

## Ikon

Phosphor, bobot `regular`, ukuran 20 atau 24, warna `--ink-mute`. Tidak ada emoji, tidak ada ikon dekoratif tanpa fungsi.

## Aksesibilitas

- Kontras teks minimal 4,5:1; teks besar minimal 3:1.
- Target sentuh minimal 48×48 px, jarak antar target minimal 8 px.
- Fokus terlihat: `outline: 2px solid rgba(243,238,230,0.7)`, offset 2 px.
- Angka halaman selalu bisa diketik, tidak hanya digeser.
- Setiap aksi yang bisa dibatalkan punya `Undo` minimal 5 detik.

## Larangan

Gradient ungu-biru. Glass dengan blur palsu (tanpa `backdrop-filter`). Kartu bertumpuk tiga lapis. Badge yang tidak bisa ditekan. Titik status berwarna. Bayangan neon. Teks abu di atas abu dengan kontras di bawah standar. Animasi bounce. Ilustrasi AI. Emoji sebagai ikon.
