# Demo pengguna Quire

Jalankan `npm run dev`, lalu buka `http://localhost:5173/?demo=1#/today`.
Gunakan port yang tercetak di terminal bila 5173 sudah terpakai. Tautan **Try the interactive
demo** juga tersedia di halaman masuk dan halaman konfigurasi kosong.

Demo membuka aplikasi tanpa akun. Judul buku, detail edisi, progres, dan riwayat contoh
dipakai untuk presentasi. Katalog contoh tersedia secara lokal. Tidak memerlukan `.env`
atau koneksi Supabase; akun yang sudah masuk tidak dibuka oleh mode demo.

## Alur presentasi

1. **Today**: mulai dari The Waves, halaman 48. Isi Pages read dengan 10 dan tekan Log
   10 pages. Progres menjadi 58 dan streak bertambah. Undo tersedia selama lima detik.
2. **Shelf**: lihat pengelompokan DDC, ubah Grid ke List, lalu coba filter status, bahasa,
   dan pencarian judul. Pencarian tanpa hasil menampilkan Clear filters.
3. Buka **Meditations**. Isi Notes, tekan Save notes, pilih Rating, lalu Read this book.
   Today berpindah ke buku ini dan hanya satu buku berstatus Reading.
4. **Search**: cari Pride and Prejudice dan tekan Add to shelf. Tombol menjadi On your shelf.
   Buka Enter manually untuk mencatat buku sendiri; judul saja cukup.
5. **Settings**: ganti Shelf, Municipal, atau Oxford, lalu hidupkan Dark mode.
6. Refresh halaman untuk menunjukkan bahwa catatan, buku, dan progres tersimpan.
7. **Reset demo** lalu Reset sample library untuk mengulang presentasi. Keep changes
   membatalkan reset. Leave demo kembali ke aplikasi akun.

## Tur interaktif

Tekan **Guide** di header untuk tur lima langkah yang menyorot kontrol asli: buku aktif,
pencatatan halaman, filter rak, penambahan buku, dan tema. Gunakan **Back**, **Next**,
**Skip tour**, atau Escape. Preferensi menyelesaikan atau melewati tur disimpan terpisah
untuk demo dan setiap akun. Tur dapat diputar ulang kapan saja.

Tautan langsung: `http://localhost:5173/?demo=1&tour=1#/today`. Halaman masuk dan daftar
juga menyediakan **Take a quick tour**. Tombol cepat 5, 10, dan 25 halaman mengubah jumlah
halaman sebelum dicatat. Rating buku kini memakai bintang yang dapat dipilih dengan keyboard.

Penyimpanan demo memakai `quire:demo:v1`. Reset hanya mengganti data demo, tidak menghapus
data akun atau preferensi tampilan. Bila penyimpanan browser ditolak, banner menjelaskan
bahwa perubahan hanya berlaku selama kunjungan ini.

Pencarian katalog eksternal, autentikasi, pemindaian kamera, dan unggah cover berada di
alur aplikasi akun. Demo ini berfokus pada pencarian lokal, koleksi, dan aktivitas membaca.

## Arah tampilan

Mode Operate, memakai sistem kertas dan foto cover buku asli sesuai arahan terbaru pengguna di
[design system](DESIGN_SYSTEM.md). ENERGY 1 / RHYTHM 2 / MOTION 1: hierarki tenang,
komposisi berbeda untuk membaca dan koleksi, serta gerak singkat yang mengikuti preferensi
reduced motion. Banner membedakan data contoh; formulir, tema, dan navigasi tetap memakai
token proyek. Sembilan cover asli disimpan lokal; buku tanpa cover memakai satu gambar
placeholder yang sama. [Sumber cover](../public/covers/SOURCES.md) mencatat asal setiap gambar.

## Verifikasi

Hasil pemeriksaan dan interaksi browser dicatat di
[bukti demo](evidence/demo/README.md).
