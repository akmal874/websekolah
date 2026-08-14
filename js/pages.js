// ============================================================
//  PAGES.JS — nav & footer bersama + konten halaman terpisah
//  Catatan: file berada di root, jadi path relatif sama dengan index.html
// ============================================================

function escP(s){ return (s??'').toString().replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function tglP(iso){ if(!iso)return''; const b=['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];const d=new Date(iso);return `${d.getDate()} ${b[d.getMonth()]} ${d.getFullYear()}`; }
function qs(k){ return new URLSearchParams(location.search).get(k); }
function toggleMenu(){ document.getElementById('menu')?.classList.toggle('open'); }

// ---------- NAV & FOOTER bersama (identik di semua halaman) ----------
async function loadShared(){
  const { data:set } = await sb.from('pengaturan').select('*').eq('id',1).single();
  const nama=set?.nama_sekolah||'SMK Negeri 1 Bahari';
  const tagline=set?.tagline||'';
  // nav
  document.querySelectorAll('[data-set="nama"]').forEach(e=>e.textContent=nama);
  document.querySelectorAll('[data-set="tagline"]').forEach(e=>e.textContent=tagline);
  const mark=document.getElementById('mark-img');
  if(mark && set?.logo_url) mark.innerHTML=`<img src="${escP(set.logo_url)}" alt="">`;
  // menu
  const box=document.getElementById('menu');
  if(box){
    const { data } = await sb.from('nav_menu').select('*').eq('active',true).order('urutan');
    const items=(data&&data.length)?data:[
      {label:'Beranda',url:'index.html'},{label:'Profil',url:'profil.html'},
      {label:'Jurusan',url:'jurusan.html'},{label:'Berita',url:'berita.html'},
      {label:'Galeri',url:'galeri.html'},{label:'Kontak',url:'index.html#kontak'}
    ];
    box.innerHTML=items.map(m=>`<a href="${escP(m.url)}">${escP(m.label)}</a>`).join('')
      +`<a class="btn-primary" href="index.html#ppdb">Daftar PPDB</a>`;
  }
  // footer
  const ft=document.getElementById('footer-info');
  if(ft) ft.innerHTML=`${escP(set?.alamat||'')}<br>Telp: ${escP(set?.telepon||'-')}<br>Email: ${escP(set?.email||'-')}`;
}

// ---------- HALAMAN PROFIL ----------
async function loadProfil(){
  const box=document.getElementById('profil-body'); if(!box) return;
  const { data:p } = await sb.from('profil').select('*').eq('id',1).single();
  if(!p){ box.innerHTML='<p class="empty">Konten profil belum diisi.</p>'; return; }
  const misi=(p.misi||'').split('\n').filter(Boolean).map(m=>`<li>${escP(m)}</li>`).join('');
  const fasil=(p.fasilitas||'').split('\n').filter(Boolean).map(f=>`<div class="f">${escP(f)}</div>`).join('');
  box.innerHTML=`
    <div class="prose">
      <h2>Sejarah Sekolah</h2>
      <p>${escP(p.sejarah||'-')}</p>
    </div>
    <div class="vm-grid">
      <div class="vm-card"><h3>Visi</h3><p>${escP(p.visi||'-')}</p></div>
      <div class="vm-card"><h3>Misi</h3><ul>${misi||'<li>-</li>'}</ul></div>
    </div>
    ${p.sambutan?`
    <h2 style="font-size:24px;color:var(--navy);margin:36px 0 12px;">Sambutan Kepala Sekolah</h2>
    <div class="sambutan">
      <div class="foto">${p.sambutan_foto?`<img src="${escP(p.sambutan_foto)}" alt="">`:'👤'}</div>
      <div>
        <p style="font-size:15.5px;line-height:1.8;color:var(--slate);">${escP(p.sambutan)}</p>
        <div class="who">${escP(p.sambutan_nama||'')}<small>${escP(p.sambutan_jabatan||'')}</small></div>
      </div>
    </div>`:''}
    ${fasil?`<h2 style="font-size:24px;color:var(--navy);margin:36px 0 12px;">Fasilitas</h2><div class="fasil">${fasil}</div>`:''}
  `;
}

// ---------- HALAMAN GALERI ----------
async function loadGaleriPage(){
  const box=document.getElementById('galeri-body'); if(!box) return;
  box.innerHTML='<div class="loading">Memuat…</div>';
  const { data } = await sb.from('galeri').select('*').order('created_at',{ascending:false});
  if(!data||!data.length){ box.innerHTML='<div class="empty">Belum ada foto.</div>'; return; }
  box.innerHTML=data.map(g=>`
    <div class="g" onclick="showImg('${escP(g.gambar_url)}')">
      <img src="${escP(g.gambar_url)}" alt="${escP(g.judul||'')}">
      ${g.judul?`<div class="cap">${escP(g.judul)}</div>`:''}
    </div>`).join('');
}
function showImg(url){
  const lb=document.getElementById('lightbox');
  document.getElementById('lb-img').src=url; lb.classList.add('open');
}
function closeImg(){ document.getElementById('lightbox').classList.remove('open'); }

// ---------- HALAMAN BERITA (daftar lengkap) ----------
async function loadBeritaPage(){
  const box=document.getElementById('berita-body'); if(!box) return;
  box.innerHTML='<div class="loading">Memuat…</div>';
  const { data } = await sb.from('berita').select('*').eq('published',true).order('tanggal',{ascending:false});
  if(!data||!data.length){ box.innerHTML='<div class="empty">Belum ada berita.</div>'; return; }
  box.innerHTML=data.map(b=>`
    <a class="card" href="berita-detail.html?id=${b.id}">
      <div class="img">${b.gambar_url?`<img src="${escP(b.gambar_url)}" alt="">`:''}</div>
      <div class="body">
        <div class="date">${tglP(b.tanggal)}</div>
        <h4>${escP(b.judul)}</h4>
        <p>${escP((b.ringkasan||b.isi||'').slice(0,110))}${(b.ringkasan||b.isi||'').length>110?'…':''}</p>
      </div>
    </a>`).join('');
}

// ---------- DETAIL BERITA ----------
async function loadBeritaDetail(){
  const box=document.getElementById('berita-detail'); if(!box) return;
  const id=qs('id');
  if(!id){ box.innerHTML='<div class="empty">Berita tidak ditemukan.</div>'; return; }
  const { data:b } = await sb.from('berita').select('*').eq('id',id).single();
  if(!b){ box.innerHTML='<div class="empty">Berita tidak ditemukan.</div>'; return; }
  document.title=b.judul+' — Berita';
  box.innerHTML=`
    <a class="back" href="berita.html">← Kembali ke Berita</a>
    ${b.gambar_url?`<img class="cover" src="${escP(b.gambar_url)}" alt="">`:''}
    <div class="meta">${tglP(b.tanggal)}</div>
    <h1>${escP(b.judul)}</h1>
    <div class="isi">${escP(b.isi||b.ringkasan||'')}</div>`;
}

// ---------- HALAMAN JURUSAN (daftar) ----------
async function loadJurusanPage(){
  const box=document.getElementById('jurusan-body'); if(!box) return;
  box.innerHTML='<div class="loading">Memuat…</div>';
  const { data } = await sb.from('jurusan').select('*').eq('active',true).order('urutan');
  if(!data||!data.length){ box.innerHTML='<div class="empty">Belum ada jurusan.</div>'; return; }
  box.innerHTML=data.map(j=>`
    <a class="card" href="jurusan-detail.html?id=${j.id}">
      <div class="top">${j.gambar_url?`<img src="${escP(j.gambar_url)}" alt="">`:escP(j.ikon||'📘')}</div>
      <div class="body">
        <span class="abbr">${escP(j.singkatan||'')}</span>
        <h3>${escP(j.nama)}</h3>
        <p>${escP(j.deskripsi||'')}</p>
        <span class="more">Lihat detail →</span>
      </div>
    </a>`).join('');
}

// ---------- DETAIL JURUSAN ----------
async function loadJurusanDetail(){
  const box=document.getElementById('jurusan-detail'); if(!box) return;
  const id=qs('id');
  if(!id){ box.innerHTML='<div class="empty">Jurusan tidak ditemukan.</div>'; return; }
  const { data:j } = await sb.from('jurusan').select('*').eq('id',id).single();
  if(!j){ box.innerHTML='<div class="empty">Jurusan tidak ditemukan.</div>'; return; }
  document.title=j.nama+' — Jurusan';
  box.innerHTML=`
    <a class="back" href="jurusan.html">← Kembali ke Jurusan</a>
    <div class="cover">${j.gambar_url?`<img src="${escP(j.gambar_url)}" style="width:100%;height:100%;object-fit:cover;border-radius:16px;" alt="">`:escP(j.ikon||'📘')}</div>
    <span class="abbr">${escP(j.singkatan||'')}</span>
    <h1>${escP(j.nama)}</h1>
    <div class="sec"><h3>Tentang Jurusan</h3><p>${escP(j.detail||j.deskripsi||'-')}</p></div>
    ${j.prospek?`<div class="sec"><h3>Prospek Karier</h3><p>${escP(j.prospek)}</p></div>`:''}`;
}

// ---------- HALAMAN CUSTOM (page.html?slug=xxx) ----------
async function loadHalamanCustom(){
  const box=document.getElementById('page-konten'); if(!box) return;
  const slug=qs('slug');
  if(!slug){ box.innerHTML='<div class="empty">Halaman tidak ditemukan.</div>'; return; }
  const { data:h } = await sb.from('halaman').select('*').eq('slug',slug).eq('published',true).single();
  if(!h){
    document.getElementById('page-judul').textContent='Halaman tidak ditemukan';
    box.innerHTML='<div class="empty">Halaman yang Anda cari tidak ada atau belum diterbitkan.</div>';
    return;
  }
  document.title=h.judul+' — SMK Negeri';
  document.getElementById('page-judul').textContent=h.judul;
  document.getElementById('page-crumb').textContent=h.judul;
  // konten visual & html sama-sama dirender sebagai HTML (mode html memang untuk embed)
  box.innerHTML=h.konten||'';
}

// ---------- INIT ----------
document.addEventListener('DOMContentLoaded',()=>{
  loadShared();
  loadProfil(); loadGaleriPage(); loadBeritaPage(); loadBeritaDetail();
  loadJurusanPage(); loadJurusanDetail(); loadHalamanCustom();
});
