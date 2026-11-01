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
  B -- sudah --> C[Koleksi buku]
  C --> D{Kelola buku atau baca?}
  D -- kelola --> E[Tambah, lihat detail, edit, atau hapus buku]
  D -- baca --> F[Layar Hari Ini]
  F --> G[Catat halaman dan lihat progres]
  E --> H[Kembali ke koleksi]
  G --> H
```

Aturan: membuka aplikasi **tidak** dihitung sebagai hari membaca. Hanya halaman yang dicatat.

Saat belum masuk, `/` tetap tanpa hash (atau `/?auth=signup` untuk daftar). Tautan
langsung mempertahankan hash halaman selama masuk, termasuk setelah muat ulang; tanpa
tautan langsung, pengguna masuk ke Collection. Keluar menghapus hash rute akun.
Rute demo tetap menggunakan `?demo=1` dan hash halaman demo; keluar dari demo menghapus hash.

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

## Mengelola Koleksi

Collection menjadi halaman awal setelah masuk. Tombol Add book membuka pencarian katalog atau input manual. Memilih sampul atau judul membuka `#/book/<id>`.

Detail buku menyediakan Edit book dan Delete book. Edit menyimpan metadata ke koleksi; Cancel membuang perubahan yang belum disimpan. Hapus meminta konfirmasi dengan judul buku dan menjelaskan data terkait yang ikut dihapus. Setelah berhasil, pengguna kembali ke koleksi tanpa buku tersebut. Kesalahan simpan atau hapus tetap terlihat dan tidak menampilkan sukses palsu.

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

Notifikasi push, mengikuti teman, berbagi ke media sosial, lencana, dan layar perayaan.

## Tur produk, diperbarui 29 Oktober 2026

Arahan terbaru pengguna menambahkan tur layar langkah demi langkah. Tur bersifat opsional,
dapat dilewati, dan tersedia kembali lewat Guide di header. Urutannya: buku aktif di Today,
kontrol pencatatan halaman, filter Shelf, pilihan entri Search, lalu akun di Settings.
Kontrol tetap dapat digunakan selama tur; panel berpindah agar tidak menutupi target.
Escape menutup tur dan mengembalikan fokus. Halaman masuk/daftar menautkan tur demo tanpa
mengirim data akun. Penyelesaian dan pilihan melewati disimpan per demo atau akun.
