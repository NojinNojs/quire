# Demo pengguna Quire

Jalankan `npm run dev`, lalu buka `http://localhost:5173/?demo=1#/shelf`.
Gunakan port yang tercetak di terminal bila 5173 sudah terpakai. Tautan **Try the interactive
demo** juga tersedia di halaman masuk dan halaman konfigurasi kosong.

Demo membuka aplikasi tanpa akun. Judul buku, detail edisi, progres, dan riwayat contoh
dipakai untuk presentasi. Katalog contoh tersedia secara lokal. Tidak memerlukan `.env`
atau koneksi Supabase; akun yang sudah masuk tidak dibuka oleh mode demo.

## Alur presentasi

1. **Collection**: cari judul atau filter status, lalu buka buku untuk melihat detailnya.
2. Pilih **Edit book**, ubah metadata edisi, lalu simpan. **Cancel edit** membatalkan perubahan.
3. Pilih **Delete book** untuk melihat konfirmasi bernama. **Cancel delete** mempertahankan buku; konfirmasi menghapus buku dan catatan progresnya.
4. **Today**: catat halaman dan gunakan Undo selama lima detik. Buka detail buku lain dan pilih **Read this book** untuk mengganti buku aktif.
5. **Search**: cari katalog contoh atau pilih **Enter manually** untuk menambahkan buku. Judul saja cukup.
6. Refresh halaman untuk memastikan perubahan tersimpan. **Reset demo** mengembalikan koleksi contoh; **Keep changes** membatalkan reset.

## Tur interaktif

Tekan **Guide** di header untuk tur lima langkah yang menyorot kontrol asli: buku aktif,
pencatatan halaman, filter rak, penambahan buku, dan pengaturan akun. Gunakan **Back**, **Next**,
**Skip tour**, atau Escape. Preferensi menyelesaikan atau melewati tur disimpan terpisah
untuk demo dan setiap akun. Tur dapat diputar ulang kapan saja.

Tautan langsung: `http://localhost:5173/?demo=1&tour=1#/shelf`. Halaman masuk dan daftar
juga menyediakan **Take a quick tour**. Tombol cepat 5, 10, dan 25 halaman mengubah jumlah
halaman sebelum dicatat. Rating buku kini memakai bintang yang dapat dipilih dengan keyboard.

Penyimpanan demo memakai `quire:demo:v1`. Reset hanya mengganti data demo, tidak menghapus
data akun. Bila penyimpanan browser ditolak, banner menjelaskan
bahwa perubahan hanya berlaku selama kunjungan ini.

Pencarian katalog eksternal, autentikasi, pemindaian kamera, dan unggah cover berada di
alur aplikasi akun. Demo ini berfokus pada pencarian lokal, koleksi, dan aktivitas membaca.

## Arah tampilan

Mode Operate, memakai sistem kertas dan foto cover buku asli sesuai arahan terbaru pengguna di
[design system](../design/DESIGN_SYSTEM.md). ENERGY 1 / RHYTHM 2 / MOTION 1: hierarki tenang,
komposisi berbeda untuk membaca dan koleksi, serta gerak singkat yang mengikuti preferensi
reduced motion. Banner membedakan data contoh; formulir, tema, dan navigasi tetap memakai
token proyek. Sembilan cover asli disimpan lokal; buku tanpa cover memakai satu gambar
placeholder yang sama. [Sumber cover](../../public/covers/SOURCES.md) mencatat asal setiap gambar.

## Verifikasi

Hasil pemeriksaan dan interaksi browser dicatat di
[bukti demo](../evidence/demo/README.md).
