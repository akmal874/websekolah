-- =====================================================================
--  TAMBAHAN SQL — untuk fitur halaman terpisah (profil & detail)
--  Jalankan di Supabase > SQL Editor SETELAH supabase-setup.sql
-- =====================================================================

-- Kolom tambahan untuk detail jurusan (isi panjang, gambar, prospek kerja)
alter table jurusan add column if not exists detail text;
alter table jurusan add column if not exists gambar_url text;
alter table jurusan add column if not exists prospek text;

-- Tabel profil sekolah (konten panjang: sejarah, visi, misi, sambutan)
create table if not exists profil (
  id int primary key default 1,
  sejarah text,
  visi text,
  misi text,
  sambutan text,
  sambutan_nama text,       -- nama kepala sekolah
  sambutan_jabatan text,    -- mis. "Kepala Sekolah"
  sambutan_foto text,
  fasilitas text            -- daftar fasilitas, satu per baris
);

alter table profil enable row level security;
create policy "read_profil"  on profil for select using (true);
create policy "profil_super" on profil for all using (is_super()) with check (is_super());

-- Data awal profil
insert into profil (id, sejarah, visi, misi, sambutan, sambutan_nama, sambutan_jabatan, fasilitas) values
(1,
 'SMK Negeri 1 Bahari berdiri sejak tahun 1985 sebagai sekolah vokasi yang berfokus pada bidang kemaritiman. Selama puluhan tahun, sekolah ini telah meluluskan ribuan tenaga terampil yang tersebar di industri perikanan, pelayaran, dan otomotif nasional.',
 'Menjadi sekolah vokasi unggulan yang menghasilkan lulusan berkarakter, kompeten, dan berdaya saing global di bidang kemaritiman dan otomotif.',
 'Menyelenggarakan pendidikan vokasi berkualitas.\nMengembangkan kerja sama dengan dunia usaha dan dunia industri.\nMembentuk karakter siswa yang berakhlak dan mandiri.\nMeningkatkan keterserapan lulusan di dunia kerja.',
 'Selamat datang di website resmi kami. Kami berkomitmen mencetak generasi yang siap kerja, siap kuliah, dan siap berwirausaha melalui pendidikan vokasi yang relevan dengan kebutuhan industri.',
 'Nama Kepala Sekolah', 'Kepala Sekolah',
 'Bengkel Praktik Otomotif\nLaboratorium Nautika & Simulator Kapal\nTambak Budidaya Perikanan\nPerpustakaan Digital\nLapangan Olahraga\nMasjid Sekolah')
on conflict (id) do nothing;
