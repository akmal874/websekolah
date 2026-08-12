# Panduan Website SMK Negeri (Supabase + GitHub Pages)

Aplikasi ini pakai **HTML + CSS + JavaScript murni** (tanpa Next.js) dan **Supabase** sebagai database. Ikuti langkah berurutan di bawah.

---

## A. Siapkan Supabase (database)

1. Buka https://supabase.com → daftar/masuk → **New Project**. Catat password database.
2. Tunggu proyek selesai dibuat (~2 menit).
3. Masuk menu **SQL Editor** → **New query**.
4. Buka file `supabase-setup.sql`, salin **seluruh isinya**, tempel, klik **Run**.
   Ini otomatis membuat semua tabel, keamanan (RLS), bucket gambar, dan data awal (termasuk 4 jurusan).

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
├── index.html            ← halaman publik (beranda)
├── supabase-setup.sql    ← jalankan sekali di Supabase
├── PANDUAN.md            ← file ini
├── css/
│   ├── style.css         ← tampilan publik
│   └── admin.css         ← tampilan dashboard
├── js/
│   ├── config.js         ← ISI kredensial Supabase di sini
│   ├── main.js           ← memuat konten publik
│   ├── auth.js           ← login & role
│   ├── crud.js           ← simpan/hapus + upload gambar
│   └── dashboard.js      ← semua modul dashboard
└── admin/
    ├── index.html        ← login admin
    └── dashboard.html    ← panel admin
```

## Masalah umum

- **Konten tidak muncul / error di console** → kredensial di `js/config.js` belum benar, atau SQL belum dijalankan.
- **Tidak bisa login** → user belum "confirmed" di Supabase (aktifkan Auto Confirm atau konfirmasi manual).
- **Admin biasa bisa lihat menu jurusan** → pastikan akun super admin sudah di-set via perintah SQL di langkah C.
- **Gambar gagal upload** → pastikan SQL bagian Storage sudah jalan (bucket `media` ada di menu Storage).
