// ============================================================
//  KONFIGURASI SUPABASE
//  Ganti dua nilai di bawah ini dengan milik proyek Supabase Anda.
//  Cari di: Dashboard Supabase > Project Settings > API
// ============================================================

const SUPABASE_URL = "https://ofinlvtmhqtgubrmbegh.supabase.co";   // <-- ganti
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9maW5sdnRtaHF0Z3Vicm1iZWdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1MjgwMDMsImV4cCI6MjEwMjEwNDAwM30.bG55dgV1q1bIxjokpxyjhiretlsesr-Qy4YINutQE6A";                 // <-- ganti (anon public key)

// Nama bucket Storage untuk upload gambar (buat di Supabase > Storage)
const STORAGE_BUCKET = "media";

// Inisialisasi client (library dimuat via CDN di HTML)
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
