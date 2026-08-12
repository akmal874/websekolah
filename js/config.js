// ============================================================
//  KONFIGURASI SUPABASE
//  Ganti dua nilai di bawah ini dengan milik proyek Supabase Anda.
//  Cari di: Dashboard Supabase > Project Settings > API
// ============================================================

const SUPABASE_URL = "https://XXXXXXXXXXXX.supabase.co";   // <-- ganti
const SUPABASE_ANON_KEY = "eyXXXXXXXX...";                 // <-- ganti (anon public key)

// Nama bucket Storage untuk upload gambar (buat di Supabase > Storage)
const STORAGE_BUCKET = "media";

// Inisialisasi client (library dimuat via CDN di HTML)
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
