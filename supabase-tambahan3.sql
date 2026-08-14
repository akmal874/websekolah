-- =====================================================================
--  TAMBAHAN SQL #3 — hero & tombol, footer, sosial media, copyright
--  Jalankan di Supabase > SQL Editor SETELAH supabase-tambahan2.sql
-- =====================================================================

-- ---------- Kolom baru untuk pengaturan (hero, tombol, footer, copyright) ----------
alter table pengaturan add column if not exists hero_eyebrow text;
alter table pengaturan add column if not exists btn_ppdb_teks text default 'Daftar PPDB';
alter table pengaturan add column if not exists btn_ppdb_link text default '#ppdb';
alter table pengaturan add column if not exists btn_jurusan_teks text default 'Lihat Jurusan';
alter table pengaturan add column if not exists btn_jurusan_link text default 'jurusan.html';
alter table pengaturan add column if not exists footer_deskripsi text;
alter table pengaturan add column if not exists copyright text;

-- Isi nilai awal yang masuk akal (hanya kalau masih kosong)
update pengaturan set
  hero_eyebrow    = coalesce(hero_eyebrow, 'SMK Pusat Keunggulan · Akreditasi A'),
  btn_ppdb_teks   = coalesce(btn_ppdb_teks, 'Daftar PPDB 2026'),
  btn_ppdb_link   = coalesce(btn_ppdb_link, '#ppdb'),
  btn_jurusan_teks= coalesce(btn_jurusan_teks, 'Lihat Jurusan'),
  btn_jurusan_link= coalesce(btn_jurusan_link, 'jurusan.html'),
  copyright       = coalesce(copyright, '© 2026 SMK Negeri 1 Bahari. Seluruh hak cipta dilindungi.')
where id = 1;

-- ---------- KOLOM TAUTAN FOOTER (kolom link yang bisa dikelola) ----------
create table if not exists footer_link (
  id uuid primary key default gen_random_uuid(),
  kolom text not null default 'Tautan',   -- nama kolom/grup, mis. "Tautan", "Layanan"
  label text not null,                     -- teks link
  url text not null,
  urutan int default 1,
  active boolean default true
);
alter table footer_link enable row level security;
create policy "read_flink"  on footer_link for select using (true);
create policy "flink_super" on footer_link for all using (is_super()) with check (is_super());

-- ---------- SOSIAL MEDIA ----------
create table if not exists sosial_media (
  id uuid primary key default gen_random_uuid(),
  nama text not null,      -- Instagram, YouTube, dll
  url text not null,
  urutan int default 1,
  active boolean default true
);
alter table sosial_media enable row level security;
create policy "read_sosmed"  on sosial_media for select using (true);
create policy "sosmed_super" on sosial_media for all using (is_super()) with check (is_super());

-- ---------- Dukungan halaman custom di Pengaturan Beranda ----------
-- Halaman custom bisa ikut ditampilkan sebagai section di beranda
alter table halaman add column if not exists di_beranda boolean default false;
alter table halaman add column if not exists beranda_urutan int default 99;

-- ---------- Seed data awal footer & sosial media ----------
insert into footer_link (kolom, label, url, urutan) values
('Tautan','Profil','profil.html',1),
('Tautan','Jurusan','jurusan.html',2),
('Tautan','Berita','berita.html',3),
('Tautan','Galeri','galeri.html',4),
('Layanan','PPDB Online','index.html#ppdb',1),
('Layanan','Login Admin','admin/index.html',2)
on conflict do nothing;

insert into sosial_media (nama, url, urutan) values
('Instagram','#',1),('YouTube','#',2),('Facebook','#',3),('TikTok','#',4)
on conflict do nothing;

insert into footer_link (kolom, label, url, urutan)
select 'Tautan','Beranda','index.html',0
where not exists (select 1 from footer_link);
