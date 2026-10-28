---
title: Quire — Backend Schema
status: review
started: 2026-10-28
tags: [project, quire, backend]
---

# Quire — Backend Schema

PostgreSQL di Supabase. Semua tabel di skema `public`, semua akses dilindungi RLS. Identitas pengguna datang dari `auth.users`.

## Tabel

```sql
-- profil ringkas, dibuat otomatis saat pendaftaran
profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  annual_goal int,              -- target buku per tahun, null = tanpa target
  created_at timestamptz default now()
)

-- judul kanonik: satu baris per karya, bukan per edisi
works (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  author text,
  title_key text generated always as (lower(regexp_replace(title,'[^a-zA-Z0-9]+','','g'))) stored,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
)

-- satu baris per eksemplar yang dimiliki
books (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references profiles(id) on delete cascade,
  work_id uuid references works(id),
  title text not null,            -- wajib
  author text,                    -- opsional
  publisher text,
  city text,
  year int,
  edition text,                   -- "Tjetakan ketiga"
  pages int,                      -- NULL kalau tidak diketahui, jangan diisi default
  isbn text,                      -- NULL untuk buku pra-ISBN
  ddc text,                       -- "899.2213"
  language text,                  -- 'id' | 'en' | lainnya
  cover_url text,                 -- URL katalog
  cover_path text,                -- berkas di Storage kalau cover sendiri
  status text not null default 'want'
    check (status in ('want','reading','finished','wishlist')),
  rating int check (rating between 1 and 5),
  notes text,
  started_at date,
  finished_at date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
)

-- catatan halaman per hari per buku
progress_log (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references profiles(id) on delete cascade,
  book_id uuid not null references books(id) on delete cascade,
  day date not null,
  pages int not null check (pages > 0),
  created_at timestamptz default now(),
  unique (owner, book_id, day)      -- satu baris per buku per hari, ditambahkan
)

-- status streak, satu baris per pengguna
streaks (
  owner uuid primary key references profiles(id) on delete cascade,
  current int not null default 0,
  longest int not null default 0,
  last_day date,
  restore_left int not null default 1,
  restore_month text              -- '2026-10', penanda kuota pemulihan
)

-- foto halaman yang distabilo
book_photos (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references profiles(id) on delete cascade,
  book_id uuid not null references books(id) on delete cascade,
  storage_path text not null,
  caption text,
  created_at timestamptz default now()
)
```

## Aturan yang Ditegakkan Basis Data

1. `pages` boleh `NULL`. Tidak ada nilai default karangan.
2. `isbn` boleh `NULL` dan **tidak** unik secara global — satu pengguna boleh punya dua edisi dengan ISBN berbeda; ISBN yang sama dua kali untuk pengguna yang sama ditolak lewat indeks unik parsial.
3. `progress_log` unik per `(owner, book_id, day)` — mencatat dua kali di hari yang sama menambah, bukan menduplikasi.
4. Satu buku berstatus `reading` per pengguna, ditegakkan lewat indeks unik parsial.

```sql
create unique index one_active_book on books (owner) where status = 'reading';
create unique index no_duplicate_isbn on books (owner, isbn) where isbn is not null;
create index by_owner_status on books (owner, status);
create index progress_by_day on progress_log (owner, day);
```

## RLS

Setiap tabel: `enable row level security`, lalu satu kebijakan untuk pemilik.

```sql
create policy own_rows on books
  for all using (owner = auth.uid()) with check (owner = auth.uid());
```

`works` boleh dibaca semua pengguna terdaftar, ditulis hanya oleh pembuatnya. `profiles` hanya pemilik.

## Streak

Dihitung di server saat baris `progress_log` pertama hari itu masuk.

- Hari ini = hari terakhir → tidak ada perubahan.
- Hari ini = hari terakhir + 1 → `current = current + 1`.
- Selisih lebih dari satu hari → `current = 1`, `longest` tetap.
- Pemulihan: kalau selisih tepat dua hari dan `restore_left > 0` dan bulan berbeda dari `restore_month`, `current` dilanjutkan dan kuota berkurang satu.

## Storage

Bucket `covers` (privat, akses lewat signed URL) dan `pages` (foto halaman stabilo). Path: `{owner}/{book_id}/{uuid}.jpg`. Batas unggah 5 MB, hanya `image/jpeg` dan `image/webp`.

## Endpoint API (Elysia)

| Metode | Jalur | Guna |
|---|---|---|
| `GET` | `/health` | cek hidup |
| `GET` | `/catalog?q=` | cari Google Books + Open Library, gabung dan buang duplikat |
| `POST` | `/extract` | terima foto, kembalikan field yang terbaca (judul, penulis, penerbit, tahun, cetakan, DDC) |
| `POST` | `/streak/tick` | dipanggil setelah progres tersimpan, mengembalikan streak terbaru |

Sisanya — daftar buku, catatan, rating, target — langsung ke Supabase lewat klien dengan RLS. Tidak ada endpoint yang mengulang pekerjaan itu.

## Yang Tidak Ada di Skema

Lokasi rak, peminjaman, pengikut, komentar, harga wishlist, dan riwayat harga. Semuanya sudah diputuskan keluar.
