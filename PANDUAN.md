# Panduan Website SMK Negeri (Supabase + GitHub Pages)

Aplikasi ini pakai **HTML + CSS + JavaScript murni** (tanpa Next.js) dan **Supabase** sebagai database. Ikuti langkah berurutan di bawah.

---

## A. Siapkan Supabase (database)

1. Buka https://supabase.com → daftar/masuk → **New Project**. Catat password database.
2. Tunggu proyek selesai dibuat (~2 menit).
3. Masuk menu **SQL Editor** → **New query**.
4. Buka file `supabase-setup.sql`, salin **seluruh isinya**, tempel, klik **Run**.
   Ini otomatis membuat semua tabel, keamanan (RLS), bucket gambar, dan data awal (termasuk 4 jurusan).
5. Buka juga file `supabase-tambahan.sql`, salin isinya, tempel di query baru, klik **Run**.
   Ini menambah tabel Profil dan kolom detail jurusan untuk halaman-halaman terpisah.
6. Buka file `supabase-tambahan2.sql`, salin isinya, tempel di query baru, klik **Run**.
   Ini menambah tabel Halaman custom dan Pengaturan section beranda.

## B. Ambil kunci koneksi

1. Menu **Project Settings** (ikon gerigi) → **API**.
2. Salin **Project URL** dan **anon public key**.
3. Buka file `js/config.js`, ganti dua baris:
   ```js
   const SUPABASE_URL = "https://xxxx.supabase.co";   // Project URL Anda
   const SUPABASE_ANON_KEY = "eyxxxx...";             // anon public key
   ```

## C. Buat akun Super Admin & Admin

1. Menu **Authentication** → **Users** → **Add user** → isi email & password.
   - Buat 1 akun untuk **super admin**, dan 1 (atau lebih) untuk **admin berita**.
   - (Centang "Auto Confirm User" agar bisa langsung login.)
2. Jadikan salah satu akun sebagai **super admin**. Kembali ke **SQL Editor**, jalankan
   (ganti emailnya):
   ```sql
   update profiles set role='super_admin'
   where id = (select id from auth.users where email='EMAIL_SUPER_ADMIN@contoh.com');
   ```
3. Akun lain otomatis berperan **admin** (hanya bisa kelola berita).

---

## D. Coba jalankan di komputer (lokal)

Karena browser membatasi file lokal, jalankan lewat server kecil:

- **Cara termudah:** buka folder ini di **VS Code** → install ekstensi *Live Server* → klik kanan `index.html` → **Open with Live Server**.
- Login admin: buka alamat `.../admin/index.html`.

---

## E. Hosting gratis di GitHub Pages

1. Buat akun di https://github.com → buat repository baru (misal `website-smk`), set **Public**.
2. Upload **semua isi folder `smk-app`** ke repository (tarik-lepas file di halaman repo, atau pakai GitHub Desktop).
3. Di repository: **Settings** → **Pages**.
4. Bagian *Source* pilih **Deploy from a branch** → Branch **main** → folder **/ (root)** → **Save**.
5. Tunggu ~1 menit. Website tampil di alamat:
   `https://NAMA-AKUN.github.io/website-smk/`
6. Halaman admin: `https://NAMA-AKUN.github.io/website-smk/admin/`

> Setiap kali Anda mengubah file dan mengunggahnya lagi ke GitHub, website ikut ter-update otomatis.

---

## Perbedaan Role

| Fitur                    | Super Admin | Admin |
|--------------------------|:-----------:|:-----:|
| Kelola Berita            | ✅          | ✅    |
| Jurusan, Galeri, Mitra   | ✅          | ❌    |
| Statistik, Menu, PPDB    | ✅          | ❌    |
| Pengaturan Situs         | ✅          | ❌    |
| Kelola Pengguna & Role   | ✅          | ❌    |

Keamanan ini diberlakukan **dua lapis**: di tampilan (menu disembunyikan) dan di database (RLS), jadi admin biasa benar-benar tidak bisa mengubah data selain berita meski mencoba.

---

## Struktur File

```
smk-app/
├── index.html            ← halaman publik (beranda, ringkasan semua)
├── profil.html           ← halaman Profil
├── jurusan.html          ← daftar jurusan
├── jurusan-detail.html   ← detail satu jurusan
├── berita.html           ← daftar semua berita
├── berita-detail.html    ← isi lengkap satu berita
├── galeri.html           ← galeri foto (dengan lightbox)
├── page.html             ← menampilkan halaman custom (page.html?slug=xxx)
├── supabase-setup.sql    ← jalankan #1 di Supabase
├── supabase-tambahan.sql ← jalankan #2 (profil & detail jurusan)
├── supabase-tambahan2.sql← jalankan #3 (halaman custom & section beranda)
├── PANDUAN.md            ← file ini
├── css/
│   ├── style.css         ← tampilan publik
│   ├── pages.css         ← tampilan halaman terpisah
│   └── admin.css         ← tampilan dashboard
├── js/
│   ├── config.js         ← ISI kredensial Supabase di sini
│   ├── main.js           ← memuat konten beranda
│   ├── pages.js          ← memuat konten halaman terpisah
│   ├── auth.js           ← login & role
│   ├── crud.js           ← simpan/hapus + upload gambar
│   └── dashboard.js      ← semua modul dashboard
└── admin/
    ├── index.html        ← login admin
    └── dashboard.html    ← panel admin
```

## Fitur Dashboard (Super Admin)

Selain kelola konten dasar, super admin punya kontrol tambahan:

- **Menu Navigasi** — tambah/edit/hapus menu. Ada dropdown "pilih cepat halaman" agar mudah mengarahkan menu ke halaman yang ada (termasuk halaman custom).
- **Halaman** — buat halaman sendiri (mis. Fasilitas, Ekstrakurikuler, Kontak). Dua mode:
  - *Visual* — tulis teks biasa dengan tombol format (tebal, judul, list, link).
  - *HTML* — tempel kode HTML/embed (Google Maps, YouTube, dll).
  - Halaman tampil di `page.html?slug=nama-slug` dan bisa ditambahkan ke menu.
- **Pengaturan Beranda** — atur bagian mana yang tampil di beranda (hero, statistik, jurusan, mitra, berita, galeri, PPDB), urutannya, dan judul tiap bagian.

> **Catatan keamanan:** mode HTML pada halaman custom menyisipkan kode apa adanya. Hanya super admin yang bisa membuatnya (dijaga RLS), jadi jangan menjadikan pihak tak tepercaya sebagai super admin.

## Cara membuat halaman baru + menambah ke menu

1. Login super admin → menu **Halaman** → isi judul, slug, konten → **Simpan**.
2. Masuk menu **Menu Navigasi** → di "pilih cepat halaman" pilih halaman custom tadi → **Simpan**.
3. Menu langsung muncul di semua halaman publik.

## Struktur Menu (per halaman)

- **Beranda** (`index.html`) — satu halaman berisi ringkasan: hero, statistik, jurusan ringkas, mitra, 3 berita terbaru, galeri ringkas, PPDB. Menu "Kontak" scroll ke footer.
- **Profil, Jurusan, Berita, Galeri** — masing-masing halaman sendiri dengan konten lengkap.
- Klik kartu berita/jurusan → halaman detailnya.
- Menu navigasi tetap diatur dari dashboard (Super Admin → Menu Navigasi). Arahkan URL ke `profil.html`, `jurusan.html`, dst.

## Masalah umum

- **Konten tidak muncul / error di console** → kredensial di `js/config.js` belum benar, atau SQL belum dijalankan.
- **Tidak bisa login** → user belum "confirmed" di Supabase (aktifkan Auto Confirm atau konfirmasi manual).
- **Admin biasa bisa lihat menu jurusan** → pastikan akun super admin sudah di-set via perintah SQL di langkah C.
- **Gambar gagal upload** → pastikan SQL bagian Storage sudah jalan (bucket `media` ada di menu Storage).
