-- =====================================================================
--  SETUP DATABASE SUPABASE — Website SMK Negeri
--  Cara pakai: buka Supabase > SQL Editor > New query > tempel semua > Run
-- =====================================================================

-- ---------- 1. TABEL PROFIL (role tiap user) ----------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nama text,
  role text not null default 'admin' check (role in ('admin','super_admin')),
  created_at timestamptz default now()
);

-- Saat user baru dibuat di Authentication, otomatis buat profil (role default: admin)
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, nama, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'nama', new.email), 'admin')
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Fungsi bantu: cek apakah user saat ini super admin
create or replace function is_super()
returns boolean language sql security definer stable as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'super_admin');
$$;

-- ---------- 2. TABEL KONTEN ----------
create table if not exists pengaturan (
  id int primary key default 1,
  nama_sekolah text, tagline text, logo_url text,
  hero_judul text, hero_teks text, hero_gambar text,
  alamat text, telepon text, email text
);

create table if not exists jurusan (
  id uuid primary key default gen_random_uuid(),
  nama text not null, singkatan text, ikon text default '📘',
  deskripsi text, urutan int default 1, active boolean default true,
  created_at timestamptz default now()
);

create table if not exists berita (
  id uuid primary key default gen_random_uuid(),
  judul text not null, ringkasan text, isi text,
  gambar_url text, tanggal date default current_date,
  published boolean default true, author text,
  created_at timestamptz default now()
);

create table if not exists galeri (
  id uuid primary key default gen_random_uuid(),
  judul text, gambar_url text not null,
  created_at timestamptz default now()
);

create table if not exists mitra (
  id uuid primary key default gen_random_uuid(),
  nama text not null, logo_url text,
  urutan int default 1, active boolean default true
);

create table if not exists statistik (
  id uuid primary key default gen_random_uuid(),
  angka text not null, label text not null, urutan int default 1
);

create table if not exists nav_menu (
  id uuid primary key default gen_random_uuid(),
  label text not null, url text not null,
  urutan int default 1, active boolean default true
);

create table if not exists ppdb (
  id int primary key default 1,
  judul text, teks text, tombol text, link text
);

-- ---------- 3. ROW LEVEL SECURITY ----------
-- Semua tabel konten: PUBLIK boleh BACA, hanya user login yang boleh tulis.
-- Berita boleh ditulis semua admin. Sisanya hanya super admin.

alter table profiles   enable row level security;
alter table pengaturan enable row level security;
alter table jurusan    enable row level security;
alter table berita     enable row level security;
alter table galeri     enable row level security;
alter table mitra      enable row level security;
alter table statistik  enable row level security;
alter table nav_menu   enable row level security;
alter table ppdb       enable row level security;

-- PROFILES: user lihat semua; hanya super admin yang boleh ubah role
create policy "profiles_read"   on profiles for select using (true);
create policy "profiles_super_write" on profiles for update using (is_super());

-- Helper macro tak ada di SQL, jadi kita tulis policy per tabel.

-- BACA PUBLIK untuk semua tabel konten
create policy "read_pengaturan" on pengaturan for select using (true);
create policy "read_jurusan"    on jurusan    for select using (true);
create policy "read_berita"     on berita     for select using (true);
create policy "read_galeri"     on galeri     for select using (true);
create policy "read_mitra"      on mitra      for select using (true);
create policy "read_statistik"  on statistik  for select using (true);
create policy "read_nav"        on nav_menu   for select using (true);
create policy "read_ppdb"       on ppdb       for select using (true);

-- BERITA: semua user login (admin & super) boleh tulis/edit/hapus
create policy "berita_write_login" on berita for all
  using (auth.uid() is not null) with check (auth.uid() is not null);

-- TABEL LAIN: hanya SUPER ADMIN yang boleh tulis
create policy "peng_super"  on pengaturan for all using (is_super()) with check (is_super());
create policy "jur_super"   on jurusan    for all using (is_super()) with check (is_super());
create policy "gal_super"   on galeri     for all using (is_super()) with check (is_super());
create policy "mit_super"   on mitra      for all using (is_super()) with check (is_super());
create policy "stat_super"  on statistik  for all using (is_super()) with check (is_super());
create policy "nav_super"   on nav_menu   for all using (is_super()) with check (is_super());
create policy "ppdb_super"  on ppdb       for all using (is_super()) with check (is_super());

-- ---------- 4. STORAGE (bucket 'media' untuk upload gambar) ----------
insert into storage.buckets (id, name, public)
values ('media','media',true) on conflict (id) do nothing;

create policy "media_read"   on storage.objects for select using (bucket_id='media');
create policy "media_upload" on storage.objects for insert
  with check (bucket_id='media' and auth.uid() is not null);
create policy "media_delete" on storage.objects for delete
  using (bucket_id='media' and auth.uid() is not null);

-- ---------- 5. SEED DATA AWAL ----------
insert into pengaturan (id, nama_sekolah, tagline, hero_judul, hero_teks, alamat, telepon, email)
values (1,
  'SMK Negeri 1 Bahari',
  'Terakreditasi A · Pusat Keunggulan',
  'Siap Kerja, Siap Kuliah, Siap Berwirausaha',
  'Pendidikan vokasi berbasis kompetensi industri kemaritiman dan otomotif. Dengan fasilitas modern dan kerja sama DUDI, kami mencetak lulusan yang kompeten dan siap terjun ke dunia kerja.',
  'Jl. Pelabuhan No. 1, Kota Bahari.', '(0000) 123-456', 'info@smkn1bahari.sch.id')
on conflict (id) do nothing;

insert into ppdb (id, judul, teks, tombol, link) values
(1,'Penerimaan Peserta Didik Baru 2026 Telah Dibuka',
 'Daftar online, lengkapi berkas, dan jadilah bagian dari sekolah vokasi unggulan. Kuota terbatas untuk setiap jurusan.',
 'Daftar Sekarang','#') on conflict (id) do nothing;

insert into jurusan (nama, singkatan, ikon, deskripsi, urutan) values
('Nautika Kapal Penangkap Ikan','NKPI','🎣','Navigasi, penangkapan ikan, dan pengoperasian kapal perikanan sesuai standar pelayaran.',1),
('Nautika Kapal Niaga','NKN','⚓','Pelayaran niaga, navigasi kapal barang, dan tata laksana pelayaran internasional.',2),
('Agribisnis Perikanan Air Payau dan Laut','APAPL','🦐','Budidaya perikanan air payau dan laut, pembenihan, serta manajemen tambak.',3),
('Teknik Kendaraan Ringan Otomotif','TKRO','🚗','Perawatan dan perbaikan kendaraan ringan dengan teknologi otomotif terkini.',4)
on conflict do nothing;

insert into statistik (angka, label, urutan) values
('4','Kompetensi Keahlian',1),
('90%','Keterserapan Lulusan',2),
('30+','Mitra Industri (DUDI)',3),
('1.200','Siswa Aktif',4) on conflict do nothing;

insert into nav_menu (label, url, urutan) values
('Beranda','index.html',1),('Profil','#profil',2),('Jurusan','#jurusan',3),
('Berita','#berita',4),('Galeri','#galeri',5),('Kontak','#kontak',6) on conflict do nothing;

-- =====================================================================
--  SELESAI. Setelah ini, buat user di Authentication > Users,
--  lalu jadikan salah satunya super admin dengan perintah di bawah:
--
--  update profiles set role='super_admin'
--  where id = (select id from auth.users where email='EMAIL_ANDA@contoh.com');
-- =====================================================================
