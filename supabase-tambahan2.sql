-- =====================================================================
--  TAMBAHAN SQL #2 — halaman custom + pengaturan section beranda
--  Jalankan di Supabase > SQL Editor SETELAH supabase-tambahan.sql
-- =====================================================================

-- ---------- HALAMAN CUSTOM ----------
-- Halaman dinamis yang dibuat super admin, diakses via page.html?slug=xxx
create table if not exists halaman (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,          -- mis. 'fasilitas' -> page.html?slug=fasilitas
  judul text not null,
  konten text,                        -- HTML atau teks (mode diatur di kolom mode)
  mode text default 'visual' check (mode in ('visual','html')),
  published boolean default true,
  created_at timestamptz default now()
);

alter table halaman enable row level security;
create policy "read_halaman"  on halaman for select using (published = true or is_super());
create policy "halaman_super" on halaman for all using (is_super()) with check (is_super());

-- ---------- PENGATURAN SECTION BERANDA ----------
-- Mengatur tampil/tidak, urutan, dan judul tiap bagian di beranda
create table if not exists beranda_section (
  key text primary key,               -- hero, stats, jurusan, mitra, berita, galeri, ppdb
  judul text,                         -- judul yang tampil (untuk section yang punya judul)
  aktif boolean default true,
  urutan int default 1
);

alter table beranda_section enable row level security;
create policy "read_bsection"  on beranda_section for select using (true);
create policy "bsection_super" on beranda_section for all using (is_super()) with check (is_super());

-- Data awal section beranda (sesuai urutan tampil sekarang)
insert into beranda_section (key, judul, aktif, urutan) values
('hero',    null,                    true, 1),
('stats',   null,                    true, 2),
('jurusan', 'Kompetensi Keahlian',   true, 3),
('mitra',   'Mitra DUDI Kami',       true, 4),
('berita',  'Berita & Pengumuman',   true, 5),
('galeri',  'Galeri Kegiatan',       true, 6),
('ppdb',    null,                    true, 7)
on conflict (key) do nothing;
