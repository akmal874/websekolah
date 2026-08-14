// ============================================================
//  MAIN.JS — memuat konten publik dari Supabase
// ============================================================

// Toggle menu mobile
function toggleMenu(){
  document.getElementById('menu')?.classList.toggle('open');
}

// Format tanggal Indonesia
function tglID(iso){
  if(!iso) return '';
  const bln=['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  const d=new Date(iso);
  return `${d.getDate()} ${bln[d.getMonth()]} ${d.getFullYear()}`;
}

// Escape teks agar aman dari HTML injection
function esc(s){
  return (s??'').toString().replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// ---------- MENU NAVIGASI (dinamis) ----------
async function loadMenu(){
  const box=document.getElementById('menu'); if(!box) return;
  const { data } = await sb.from('nav_menu').select('*').eq('active',true).order('urutan');
  const items = (data&&data.length) ? data : [
    {label:'Beranda',url:'index.html'},{label:'Profil',url:'profil.html'},
    {label:'Jurusan',url:'jurusan.html'},{label:'Berita',url:'berita.html'},
    {label:'Galeri',url:'galeri.html'},{label:'Kontak',url:'#kontak'}
  ];
  const ppdbTeks = SETTINGS.btn_ppdb_teks || 'Daftar PPDB';
  const ppdbLink = SETTINGS.btn_ppdb_link || '#ppdb';
  box.innerHTML = items.map(m=>`<a href="${esc(m.url)}">${esc(m.label)}</a>`).join('')
    + `<a class="btn-primary" href="${esc(ppdbLink)}">${esc(ppdbTeks)}</a>`;
}

// ---------- JURUSAN ----------
async function loadJurusan(){
  const box=document.getElementById('jur-grid'); if(!box) return;
  box.innerHTML='<div class="loading">Memuat jurusan…</div>';
  const { data,error } = await sb.from('jurusan').select('*').eq('active',true).order('urutan');
  if(error||!data||!data.length){ box.innerHTML='<div class="empty">Belum ada data jurusan.</div>'; return; }
  box.innerHTML = data.map(j=>`
    <div class="jur">
      <div class="ic">${esc(j.ikon||'📘')}</div>
      <h4>${esc(j.nama)}</h4>
      <span class="abbr">${esc(j.singkatan||'')}</span>
      <p>${esc(j.deskripsi||'')}</p>
    </div>`).join('');
}

// ---------- STATISTIK ----------
async function loadStats(){
  const box=document.getElementById('stats'); if(!box) return;
  const { data } = await sb.from('statistik').select('*').order('urutan');
  const items = (data&&data.length)?data:[
    {angka:'4',label:'Kompetensi Keahlian'},{angka:'90%',label:'Keterserapan Lulusan'},
    {angka:'30+',label:'Mitra Industri'},{angka:'1.200',label:'Siswa Aktif'}
  ];
  box.innerHTML = items.map(s=>`<div class="item"><div class="num">${esc(s.angka)}</div><div class="lbl">${esc(s.label)}</div></div>`).join('');
}

// ---------- MITRA ----------
async function loadMitra(){
  const box=document.getElementById('logos'); if(!box) return;
  const { data } = await sb.from('mitra').select('*').eq('active',true).order('urutan');
  if(!data||!data.length){ box.innerHTML='<div class="empty">Belum ada mitra industri.</div>'; return; }
  box.innerHTML = data.map(m=>`<div class="lg">${m.logo_url?`<img src="${esc(m.logo_url)}" alt="${esc(m.nama)}">`:esc(m.nama)}</div>`).join('');
}

// ---------- BERITA ----------
async function loadBerita(){
  const box=document.getElementById('news-cards'); if(!box) return;
  box.innerHTML='<div class="loading">Memuat berita…</div>';
  const { data,error } = await sb.from('berita').select('*').eq('published',true).order('tanggal',{ascending:false}).limit(3);
  if(error||!data||!data.length){ box.innerHTML='<div class="empty">Belum ada berita.</div>'; return; }
  box.innerHTML = data.map(b=>`
    <a class="card" href="berita-detail.html?id=${b.id}">
      <div class="img">${b.gambar_url?`<img src="${esc(b.gambar_url)}" alt="">`:''}</div>
      <div class="body">
        <div class="date">${tglID(b.tanggal)}</div>
        <h4>${esc(b.judul)}</h4>
        <p>${esc((b.ringkasan||b.isi||'').slice(0,110))}${(b.ringkasan||b.isi||'').length>110?'…':''}</p>
      </div>
    </a>`).join('');
}

// ---------- GALERI ----------
async function loadGaleri(){
  const box=document.getElementById('gal-grid'); if(!box) return;
  const { data } = await sb.from('galeri').select('*').order('created_at',{ascending:false}).limit(8);
  if(!data||!data.length){ box.innerHTML='<div class="empty">Belum ada foto galeri.</div>'; return; }
  box.innerHTML = data.map(g=>`<div class="g">${g.gambar_url?`<img src="${esc(g.gambar_url)}" alt="${esc(g.judul||'')}">`:''}</div>`).join('');
}

// ---------- PENGATURAN SITUS (nama sekolah, hero, dll) ----------
let SETTINGS={}; // disimpan agar bisa dipakai loadMenu (tombol navbar)
async function loadPengaturan(){
  const { data } = await sb.from('pengaturan').select('*').eq('id',1).single();
  if(!data) return;
  SETTINGS=data;
  document.querySelectorAll('[data-set="nama"]').forEach(e=>e.textContent=data.nama_sekolah||e.textContent);
  document.querySelectorAll('[data-set="tagline"]').forEach(e=>e.textContent=data.tagline||e.textContent);
  const eb=document.getElementById('hero-eyebrow'); if(eb&&data.hero_eyebrow) eb.textContent=data.hero_eyebrow;
  const hh=document.getElementById('hero-h1'); if(hh&&data.hero_judul) hh.textContent=data.hero_judul;
  const hp=document.getElementById('hero-p'); if(hp&&data.hero_teks) hp.textContent=data.hero_teks;
  const hi=document.getElementById('heroimg'); if(hi&&data.hero_gambar) hi.innerHTML=`<img src="${esc(data.hero_gambar)}" alt="">`;
  const ma=document.getElementById('mark-img'); if(ma&&data.logo_url) ma.innerHTML=`<img src="${esc(data.logo_url)}" alt="">`;
  // tombol hero
  const bp=document.getElementById('hero-btn-ppdb');
  if(bp){ if(data.btn_ppdb_teks) bp.textContent=data.btn_ppdb_teks; if(data.btn_ppdb_link) bp.href=data.btn_ppdb_link; }
  const bj=document.getElementById('hero-btn-jurusan');
  if(bj){ if(data.btn_jurusan_teks) bj.textContent=data.btn_jurusan_teks; if(data.btn_jurusan_link) bj.href=data.btn_jurusan_link; }
  const ft=document.getElementById('footer-info');
  if(ft) ft.innerHTML=`${esc(data.alamat||'')}<br>Telp: ${esc(data.telepon||'-')}<br>Email: ${esc(data.email||'-')}`;
}

// ---------- PENGATURAN SECTION BERANDA ----------
async function loadBerandaSection(){
  const { data } = await sb.from('beranda_section').select('*').order('urutan',{ascending:true});
  if(!data||!data.length) return;
  data.forEach(s=>{
    const el=document.querySelector(`[data-section="${s.key}"]`);
    if(!el) return;
    el.style.display = s.aktif ? '' : 'none';           // tampil/sembunyi
    if(s.judul){                                         // judul section
      const t=document.querySelector(`[data-sectitle="${s.key}"]`);
      if(t) t.textContent=s.judul;
    }
  });
  // Susun ulang urutan section langsung di DOM (sesuai kolom urutan)
  const first=document.querySelector('[data-section]');
  if(!first) return;
  const anchor=first.parentNode;              // induk semua section (body)
  const marker=first.previousElementSibling;  // patokan sisip (nav)
  data.forEach(s=>{
    const el=document.querySelector(`[data-section="${s.key}"]`);
    if(el) anchor.appendChild(el);            // pindahkan ke urutan sesuai data
  });
  // pastikan footer tetap paling bawah
  const footer=document.querySelector('footer');
  if(footer) anchor.appendChild(footer);
}

// ---------- HALAMAN CUSTOM DI BERANDA ----------
async function loadHalamanBeranda(){
  const { data } = await sb.from('halaman').select('*').eq('published',true).eq('di_beranda',true).order('beranda_urutan');
  if(!data||!data.length) return;
  const footer=document.querySelector('footer');
  const parent=footer?.parentNode||document.body;
  data.forEach(h=>{
    const sec=document.createElement('section');
    sec.className='wrap-custom';
    sec.innerHTML=`<div class="head"><h2>${esc(h.judul)}</h2></div><div class="prose" style="max-width:1000px;margin:0 auto;">${h.konten||''}</div>`;
    parent.insertBefore(sec,footer); // sisipkan sebelum footer
  });
}

// ---------- INIT ----------
document.addEventListener('DOMContentLoaded',async()=>{
  await loadPengaturan();            // isi SETTINGS dulu (untuk tombol navbar)
  loadMenu(); loadStats(); loadJurusan();
  loadMitra(); loadBerita(); loadGaleri();
  await loadBerandaSection();
  await loadHalamanBeranda();        // halaman custom yang dipilih tampil di beranda
  renderFooterPublik();
});
