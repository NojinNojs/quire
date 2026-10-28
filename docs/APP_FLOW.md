---
title: Quire — App Flow
status: review
started: 2026-10-28
tags: [project, quire, flow]
---

# Quire — App Flow

Peta perjalanan. Semua yang di bawah ini ditulis sebagai niat pengguna, bukan nama layar.

## Alur Utama Harian

```mermaid
flowchart TD
  A[Buka Quire] --> B{Sudah masuk?}
  B -- belum --> L[Masuk atau daftar] --> C
  B -- sudah --> C[Layar Hari Ini]
  C --> D{Sudah baca hari ini?}
  D -- belum --> E[Catat halaman]
  D -- sudah --> F[Lihat streak dan kotak tahun]
  E --> G[Streak bertambah, kotak tahun menyala]
  G --> H[Tutup aplikasi]
  F --> H
```

Aturan: membuka aplikasi **tidak** dihitung sebagai hari membaca. Hanya halaman yang dicatat.

## Menambah Buku

```mermaid
flowchart TD
  A[Tab Tambah] --> B{Punya barcode?}
  B -- ya --> C[Pindai ISBN]
  B -- tidak --> D{Ada di katalog?}
  C --> E[Kandidat dari Google Books / Open Library]
  E --> F{Edisinya benar?}
  F -- ya --> S[Simpan]
  F -- tidak --> G[Foto halaman judul atau hak cipta]
  D -- ya --> E
  D -- tidak --> G
  G --> H[Baca dengan AI: judul, penulis, penerbit, tahun, cetakan]
  H --> I[Kolom kosong dibiarkan kosong]
  I --> S
  S --> T{Sudah ada ISBN ini?}
  T -- ya --> U[Peringatan: edisi ini sudah di rak]
  T -- tidak --> V[Masuk rak, terkelompok per kelas]
  U --> V
```

**Mode sapu:** setelah satu buku tersimpan, kamera langsung siap memindai berikutnya. Jumlah buku hari ini tampil kecil di atas. Tidak ada layar perayaan.

## Mencatat Halaman

```mermaid
flowchart TD
  A[Layar Hari Ini] --> B[Stepper: -10 -1 +1 +10, atau ketik angka]
  B --> C[Tombol Catat]
  C --> D{Ada sinyal?}
  D -- ya --> E[Kirim ke server]
  D -- tidak --> F[Simpan di perangkat, kirim nanti]
  E --> G[Streak dan kotak tahun diperbarui]
  F --> G
  G --> H[Snackbar: Undo 30 detik]
```

## Menutup Buku dan Memilih Berikutnya

```mermaid
flowchart TD
  A[Detail buku] --> B[Tandai selesai]
  B --> C[Rating ditawarkan sekali, boleh dilewati]
  C --> D[Layar: mau lanjut ke apa?]
  D --> E[Dari wishlist]
  D --> F[Dari rak yang belum dibaca]
  D --> G[Lewati, nanti saja]
  E --> H[Buku aktif berganti]
  F --> H
```

Kalau pengguna melewati, layar Hari Ini menampilkan satu kalimat dan tombol memilih — bukan rak kosong yang bisu.

## Mencari Buku

1. Ketik apa saja — judul, penulis, nama kelas, atau bahasa.
2. Bagian atas: hasil dari rak sendiri.
3. Bagian bawah: kandidat dari katalog, dengan tombol **Tambah ke rak**.
4. Kosong: satu kalimat, lalu tombol ke tab Tambah.

## Wishlist

- Ditambahkan dari pencarian katalog atau manual.
- Tidak pernah muncul sebagai buku aktif.
- Tidak dipakai untuk menghitung target tahunan.

## Kotak Tahun

- Dibuka dari layar Hari Ini.
- Menampilkan 12 bulan kotak, warna dari jumlah halaman.
- Angka pendamping: buku selesai, halaman, dan bahasa.
- Bisa disaring per bahasa.
- Tidak ada lencana, tidak ada perayaan palsu.

## Keadaan Tidak Nyaman yang Harus Ditangani

| Kejadian | Perilaku |
|---|---|
| Buku tanpa jumlah halaman | Progres tampil "halaman 40", tanpa batang persen |
| Katalog tidak menemukan apa pun | Tawarkan foto halaman judul, lalu ketik manual |
| AI salah membaca | Semua kolom bisa disunting sebelum simpan |
| ISBN sudah ada | Peringatan, tanpa menggabung otomatis |
| Tanpa sinyal | Semua aksi tersimpan lokal, indikator kecil "belum terkirim" |
| Sesi kedaluwarsa | Diarahkan masuk kembali; aksi yang sedang diketik tetap tersimpan |
| Streak hampir putus | Satu tombol pemulihan, sekali per bulan, tanpa iklan |
| Buku selesai tapi belum ada berikutnya | Tawaran memilih, boleh dilewati |
| Proyek Supabase tidur | Tampil lambat sekali, lalu normal; tanpa layar error menakutkan |

## Yang Tidak Ada di Alur Ini

Onboarding berlapis, tur aplikasi, notifikasi push, mengikuti teman, berbagi ke media sosial, lencana, dan layar perayaan.
