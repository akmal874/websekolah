// ============================================================
//  DASHBOARD.JS — modul konten, navigasi, kontrol role
// ============================================================
let ME=null; // profil user aktif

// Definisi modul. superOnly=true berarti hanya super_admin yang bisa akses.
const MODULES={
  ringkasan:{ label:'Ringkasan', icon:'📊', superOnly:false },
  berita:   { label:'Berita',    icon:'📰', superOnly:false }, // admin & super
  jurusan:  { label:'Jurusan',   icon:'🎓', superOnly:true  },
  profil:   { label:'Profil Sekolah', icon:'🏫', superOnly:true },
  galeri:   { label:'Galeri',    icon:'🖼️', superOnly:true  },
  mitra:    { label:'Mitra DUDI',icon:'🤝', superOnly:true  },
  statistik:{ label:'Statistik', icon:'🔢', superOnly:true  },
  menu:     { label:'Menu Navigasi', icon:'🧭', superOnly:true },
  halaman:  { label:'Halaman', icon:'📄', superOnly:true },
  beranda:  { label:'Pengaturan Beranda', icon:'🏠', superOnly:true },
  footer:   { label:'Footer', icon:'📍', superOnly:true },
  ppdb:     { label:'PPDB', icon:'📝', superOnly:true },
  pengaturan:{ label:'Pengaturan Situs', icon:'⚙️', superOnly:true },
  pengguna: { label:'Kelola Pengguna', icon:'👥', superOnly:true }
};

// ---------- INIT ----------
async function initDashboard(){
  ME=await requireAuth(); if(!ME) return;
  document.getElementById('u-nama').textContent=ME.nama||ME.email;
  document.getElementById('u-role').textContent = isSuper(ME)?'Super Admin':'Admin';
  document.getElementById('side-role').textContent = isSuper(ME)?'Super Admin':'Admin (Berita)';
  buildSidebar();
  // buka modul default
  openModule('ringkasan');
}

function buildSidebar(){
  const nav=document.getElementById('side-nav'); nav.innerHTML='';
  Object.entries(MODULES).forEach(([key,m])=>{
    if(m.superOnly && !isSuper(ME)) return; // sembunyikan untuk admin biasa
    const a=document.createElement('a');
    a.className='item'; a.dataset.mod=key;
    a.innerHTML=`<span>${m.icon}</span> ${m.label}`;
    a.onclick=()=>openModule(key);
    nav.appendChild(a);
  });
}

function openModule(key){
  const m=MODULES[key];
  if(m.superOnly && !isSuper(ME)){ toast('Akses ditolak. Hanya Super Admin.',false); return; }
  document.querySelectorAll('.sidebar a.item').forEach(a=>a.classList.toggle('active',a.dataset.mod===key));
  document.getElementById('page-title').textContent=m.label;
  const c=document.getElementById('content'); c.innerHTML='<div class="panel">Memuat…</div>';
  ({
    ringkasan:renderRingkasan, berita:renderBerita, jurusan:renderJurusan,
    profil:renderProfil,
    galeri:renderGaleri, mitra:renderMitra, statistik:renderStatistik,
    menu:renderMenu, halaman:renderHalaman, beranda:renderBeranda, footer:renderFooter,
    ppdb:renderPPDB, pengaturan:renderPengaturan, pengguna:renderPengguna
  })[key]();
}

// ================= RINGKASAN =================
async function renderRingkasan(){
  const c=document.getElementById('content');
  const [berita,jur,gal,mitra]=await Promise.all([
    db.list('berita'),db.list('jurusan'),db.list('galeri'),db.list('mitra','urutan',true)
  ]);
  c.innerHTML=`
    <div class="stat-cards">
      <div class="sc"><div class="n">${berita.length}</div><div class="l">Berita</div></div>
      <div class="sc"><div class="n">${jur.length}</div><div class="l">Jurusan</div></div>
      <div class="sc"><div class="n">${gal.length}</div><div class="l">Foto Galeri</div></div>
      <div class="sc"><div class="n">${mitra.length}</div><div class="l">Mitra DUDI</div></div>
    </div>
    <div class="panel">
      <h2>Selamat datang, ${escA(ME.nama||ME.email)} 👋</h2>
      <p class="desc">Anda masuk sebagai <b>${isSuper(ME)?'Super Admin':'Admin'}</b>.
      ${isSuper(ME)?'Anda dapat mengelola seluruh konten dan pengguna.':'Anda dapat menambah dan mengelola berita.'}</p>
    </div>`;
}

// ================= BERITA (admin & super) =================
async function renderBerita(){
  const c=document.getElementById('content');
  const rows=await db.list('berita','tanggal',false);
  c.innerHTML=`
    <div id="toast" class="msg"></div>
    <div class="panel">
      <h2 id="b-form-title">Tambah Berita</h2>
      <p class="desc">Isi form lalu simpan. Gambar bisa diupload atau tempel URL.</p>
      <input type="hidden" id="b-id">
      <div class="grid2">
        <div class="field"><label>Judul</label><input id="b-judul" placeholder="Judul berita"></div>
        <div class="field"><label>Tanggal</label><input type="date" id="b-tanggal"></div>
      </div>
      <div class="field"><label>Ringkasan singkat</label><input id="b-ringkasan" placeholder="Ringkasan 1 kalimat"></div>
      <div class="field"><label>Isi berita</label><textarea id="b-isi" placeholder="Tulis isi berita…"></textarea></div>
      <div class="grid2">
        <div class="field"><label>Upload gambar</label><input type="file" id="b-file" accept="image/*"><div class="hint">Atau kosongkan dan pakai URL di sebelah.</div></div>
        <div class="field"><label>URL gambar (opsional)</label><input id="b-url" placeholder="https://…"></div>
      </div>
      <div class="field"><label><input type="checkbox" id="b-pub" checked> Tampilkan di website (published)</label></div>
      <div class="row">
        <button class="btn" onclick="simpanBerita()">Simpan</button>
        <button class="btn btn-ghost" onclick="resetBerita()">Batal</button>
      </div>
    </div>
    <div class="panel">
      <div class="tabhead"><h2>Daftar Berita</h2></div>
      <table><thead><tr><th>Gambar</th><th>Judul</th><th>Tanggal</th><th>Status</th><th></th></tr></thead>
      <tbody>${rows.length?rows.map(b=>`
        <tr>
          <td>${b.gambar_url?`<img class="thumb" src="${escA(b.gambar_url)}">`:'<div class="thumb"></div>'}</td>
          <td>${escA(b.judul)}</td>
          <td>${tglIDa(b.tanggal)}</td>
          <td><span class="badge ${b.published?'on':'off'}">${b.published?'Tampil':'Draft'}</span></td>
          <td class="row">
            <button class="btn btn-sm btn-ghost" onclick='editBerita(${JSON.stringify(b)})'>Edit</button>
            <button class="btn btn-sm btn-danger" onclick="hapusBerita('${b.id}')">Hapus</button>
          </td>
        </tr>`).join(''):'<tr><td colspan="5" style="text-align:center;color:#94a3b8;">Belum ada berita.</td></tr>'}
      </tbody></table>
    </div>`;
}
function resetBerita(){
  ['b-id','b-judul','b-ringkasan','b-isi','b-url'].forEach(i=>document.getElementById(i).value='');
  document.getElementById('b-file').value=''; document.getElementById('b-pub').checked=true;
  document.getElementById('b-form-title').textContent='Tambah Berita';
}
function editBerita(b){
  document.getElementById('b-id').value=b.id;
  document.getElementById('b-judul').value=b.judul||'';
  document.getElementById('b-tanggal').value=b.tanggal?b.tanggal.slice(0,10):'';
  document.getElementById('b-ringkasan').value=b.ringkasan||'';
  document.getElementById('b-isi').value=b.isi||'';
  document.getElementById('b-url').value=b.gambar_url||'';
  document.getElementById('b-pub').checked=!!b.published;
  document.getElementById('b-form-title').textContent='Edit Berita';
  window.scrollTo({top:0,behavior:'smooth'});
}
async function simpanBerita(){
  const id=document.getElementById('b-id').value;
  const judul=document.getElementById('b-judul').value.trim();
  if(!judul){ toast('Judul wajib diisi.',false); return; }
  const gambar=await resolveGambar('b-file','b-url');
  const obj={
    judul,
    tanggal:document.getElementById('b-tanggal').value||new Date().toISOString().slice(0,10),
    ringkasan:document.getElementById('b-ringkasan').value.trim(),
    isi:document.getElementById('b-isi').value.trim(),
    published:document.getElementById('b-pub').checked,
    author:ME.email
  };
  if(gambar) obj.gambar_url=gambar;
  const ok= id ? await db.update('berita',id,obj) : await db.insert('berita',obj);
  if(ok){ resetBerita(); renderBerita(); }
}
async function hapusBerita(id){ if(await db.remove('berita',id)) renderBerita(); }

// ================= JURUSAN (super) =================
async function renderJurusan(){
  const c=document.getElementById('content');
  const rows=await db.list('jurusan','urutan',true);
  c.innerHTML=`
    <div id="toast" class="msg"></div>
    <div class="panel">
      <h2 id="j-form-title">Tambah Jurusan</h2>
      <input type="hidden" id="j-id">
      <div class="grid2">
        <div class="field"><label>Nama jurusan</label><input id="j-nama" placeholder="Nautika Kapal Penangkap Ikan"></div>
        <div class="field"><label>Singkatan</label><input id="j-singkatan" placeholder="NKPI"></div>
      </div>
      <div class="grid2">
        <div class="field"><label>Ikon (emoji)</label><input id="j-ikon" placeholder="⚓"></div>
        <div class="field"><label>Urutan</label><input type="number" id="j-urutan" value="1"></div>
      </div>
      <div class="field"><label>Deskripsi singkat</label><textarea id="j-deskripsi"></textarea></div>
      <div class="field"><label>Detail lengkap (halaman detail)</label><textarea id="j-detail"></textarea></div>
      <div class="field"><label>Prospek karier</label><textarea id="j-prospek"></textarea></div>
      <div class="grid2">
        <div class="field"><label>Upload gambar jurusan</label><input type="file" id="j-file" accept="image/*"></div>
        <div class="field"><label>URL gambar (opsional)</label><input id="j-url" placeholder="https://…"></div>
      </div>
      <div class="field"><label><input type="checkbox" id="j-active" checked> Tampilkan</label></div>
      <div class="row"><button class="btn" onclick="simpanJurusan()">Simpan</button><button class="btn btn-ghost" onclick="resetJurusan()">Batal</button></div>
    </div>
    <div class="panel">
      <h2>Daftar Jurusan</h2>
      <table><thead><tr><th>Ikon</th><th>Nama</th><th>Singkatan</th><th>Urutan</th><th>Status</th><th></th></tr></thead>
      <tbody>${rows.map(j=>`
        <tr>
          <td style="font-size:22px;">${escA(j.ikon||'📘')}</td>
          <td>${escA(j.nama)}</td><td>${escA(j.singkatan||'')}</td><td>${j.urutan??''}</td>
          <td><span class="badge ${j.active?'on':'off'}">${j.active?'Tampil':'Nonaktif'}</span></td>
          <td class="row"><button class="btn btn-sm btn-ghost" onclick='editJurusan(${JSON.stringify(j)})'>Edit</button>
          <button class="btn btn-sm btn-danger" onclick="hapusJurusan('${j.id}')">Hapus</button></td>
        </tr>`).join('')||'<tr><td colspan="6" style="text-align:center;color:#94a3b8;">Belum ada jurusan.</td></tr>'}
      </tbody></table>
    </div>`;
}
function resetJurusan(){['j-id','j-nama','j-singkatan','j-ikon','j-deskripsi','j-detail','j-prospek','j-url'].forEach(i=>document.getElementById(i).value='');document.getElementById('j-file').value='';document.getElementById('j-urutan').value='1';document.getElementById('j-active').checked=true;document.getElementById('j-form-title').textContent='Tambah Jurusan';}
function editJurusan(j){document.getElementById('j-id').value=j.id;document.getElementById('j-nama').value=j.nama||'';document.getElementById('j-singkatan').value=j.singkatan||'';document.getElementById('j-ikon').value=j.ikon||'';document.getElementById('j-urutan').value=j.urutan||1;document.getElementById('j-deskripsi').value=j.deskripsi||'';document.getElementById('j-detail').value=j.detail||'';document.getElementById('j-prospek').value=j.prospek||'';document.getElementById('j-url').value=j.gambar_url||'';document.getElementById('j-active').checked=!!j.active;document.getElementById('j-form-title').textContent='Edit Jurusan';window.scrollTo({top:0,behavior:'smooth'});}
async function simpanJurusan(){
  const id=document.getElementById('j-id').value;
  const nama=document.getElementById('j-nama').value.trim();
  if(!nama){toast('Nama wajib diisi.',false);return;}
  const gambar=await resolveGambar('j-file','j-url');
  const obj={nama,singkatan:document.getElementById('j-singkatan').value.trim(),ikon:document.getElementById('j-ikon').value.trim()||'📘',urutan:parseInt(document.getElementById('j-urutan').value)||1,deskripsi:document.getElementById('j-deskripsi').value.trim(),detail:document.getElementById('j-detail').value.trim(),prospek:document.getElementById('j-prospek').value.trim(),active:document.getElementById('j-active').checked};
  if(gambar) obj.gambar_url=gambar;
  const ok=id?await db.update('jurusan',id,obj):await db.insert('jurusan',obj);
  if(ok){resetJurusan();renderJurusan();}
}
async function hapusJurusan(id){if(await db.remove('jurusan',id))renderJurusan();}

// ================= PROFIL SEKOLAH (super) =================
async function renderProfil(){
  const c=document.getElementById('content');
  const { data }=await sb.from('profil').select('*').eq('id',1).single();
  const p=data||{};
  c.innerHTML=`
    <div id="toast" class="msg"></div>
    <div class="panel">
      <h2>Profil Sekolah</h2>
      <p class="desc">Konten ini tampil di halaman Profil. Misi & Fasilitas: tulis satu item per baris.</p>
      <div class="field"><label>Sejarah</label><textarea id="pr-sejarah" style="min-height:120px;">${escA(p.sejarah||'')}</textarea></div>
      <div class="grid2">
        <div class="field"><label>Visi</label><textarea id="pr-visi">${escA(p.visi||'')}</textarea></div>
        <div class="field"><label>Misi (satu per baris)</label><textarea id="pr-misi">${escA(p.misi||'')}</textarea></div>
      </div>
      <h2 style="margin-top:10px;">Sambutan Kepala Sekolah</h2>
      <div class="field"><label>Isi sambutan</label><textarea id="pr-sambutan">${escA(p.sambutan||'')}</textarea></div>
      <div class="grid2">
        <div class="field"><label>Nama</label><input id="pr-nama" value="${escA(p.sambutan_nama||'')}"></div>
        <div class="field"><label>Jabatan</label><input id="pr-jabatan" value="${escA(p.sambutan_jabatan||'')}"></div>
      </div>
      <div class="grid2">
        <div class="field"><label>Upload foto kepala sekolah</label><input type="file" id="pr-foto-file" accept="image/*"></div>
        <div class="field"><label>URL foto (opsional)</label><input id="pr-foto-url" value="${escA(p.sambutan_foto||'')}"></div>
      </div>
      <div class="field"><label>Fasilitas (satu per baris)</label><textarea id="pr-fasilitas" style="min-height:110px;">${escA(p.fasilitas||'')}</textarea></div>
      <button class="btn" onclick="simpanProfil()">Simpan</button>
    </div>`;
}
async function simpanProfil(){
  const foto=await resolveGambar('pr-foto-file','pr-foto-url');
  const obj={id:1,
    sejarah:document.getElementById('pr-sejarah').value.trim(),
    visi:document.getElementById('pr-visi').value.trim(),
    misi:document.getElementById('pr-misi').value.trim(),
    sambutan:document.getElementById('pr-sambutan').value.trim(),
    sambutan_nama:document.getElementById('pr-nama').value.trim(),
    sambutan_jabatan:document.getElementById('pr-jabatan').value.trim(),
    fasilitas:document.getElementById('pr-fasilitas').value.trim()
  };
  if(foto) obj.sambutan_foto=foto;
  const { error }=await sb.from('profil').upsert(obj);
  toast(error?('Gagal: '+error.message):'Tersimpan.',!error);
}

// ================= GALERI (super) =================
async function renderGaleri(){
  const c=document.getElementById('content');
  const rows=await db.list('galeri');
  c.innerHTML=`
    <div id="toast" class="msg"></div>
    <div class="panel">
      <h2>Tambah Foto Galeri</h2>
      <div class="field"><label>Judul (opsional)</label><input id="g-judul" placeholder="Kegiatan PKL 2026"></div>
      <div class="grid2">
        <div class="field"><label>Upload gambar</label><input type="file" id="g-file" accept="image/*"></div>
        <div class="field"><label>URL gambar (opsional)</label><input id="g-url" placeholder="https://…"></div>
      </div>
      <button class="btn" onclick="simpanGaleri()">Simpan</button>
    </div>
    <div class="panel"><h2>Foto Tersimpan</h2>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;">
      ${rows.map(g=>`<div style="border:1px solid var(--line);border-radius:10px;overflow:hidden;">
        <img src="${escA(g.gambar_url)}" style="width:100%;height:110px;object-fit:cover;">
        <div style="padding:8px;font-size:12px;display:flex;justify-content:space-between;align-items:center;">
          <span>${escA(g.judul||'')}</span>
          <button class="btn btn-sm btn-danger" onclick="hapusGaleri('${g.id}')">×</button>
        </div></div>`).join('')||'<p style="color:#94a3b8;">Belum ada foto.</p>'}
      </div>
    </div>`;
}
async function simpanGaleri(){
  const gambar=await resolveGambar('g-file','g-url');
  if(!gambar){toast('Pilih gambar atau isi URL.',false);return;}
  if(await db.insert('galeri',{judul:document.getElementById('g-judul').value.trim(),gambar_url:gambar})) renderGaleri();
}
async function hapusGaleri(id){if(await db.remove('galeri',id))renderGaleri();}

// ================= MITRA (super) =================
async function renderMitra(){
  const c=document.getElementById('content');
  const rows=await db.list('mitra','urutan',true);
  c.innerHTML=`
    <div id="toast" class="msg"></div>
    <div class="panel"><h2>Tambah Mitra DUDI</h2>
      <div class="grid2">
        <div class="field"><label>Nama perusahaan</label><input id="m-nama" placeholder="PT Perikanan Nusantara"></div>
        <div class="field"><label>Urutan</label><input type="number" id="m-urutan" value="1"></div>
      </div>
      <div class="grid2">
        <div class="field"><label>Upload logo</label><input type="file" id="m-file" accept="image/*"></div>
        <div class="field"><label>URL logo (opsional)</label><input id="m-url" placeholder="https://…"></div>
      </div>
      <button class="btn" onclick="simpanMitra()">Simpan</button>
    </div>
    <div class="panel"><h2>Daftar Mitra</h2>
      <table><thead><tr><th>Logo</th><th>Nama</th><th>Urutan</th><th></th></tr></thead>
      <tbody>${rows.map(m=>`<tr><td>${m.logo_url?`<img class="thumb" src="${escA(m.logo_url)}">`:'—'}</td><td>${escA(m.nama)}</td><td>${m.urutan??''}</td>
      <td><button class="btn btn-sm btn-danger" onclick="hapusMitra('${m.id}')">Hapus</button></td></tr>`).join('')||'<tr><td colspan="4" style="text-align:center;color:#94a3b8;">Belum ada mitra.</td></tr>'}</tbody></table>
    </div>`;
}
async function simpanMitra(){
  const nama=document.getElementById('m-nama').value.trim(); if(!nama){toast('Nama wajib diisi.',false);return;}
  const logo=await resolveGambar('m-file','m-url');
  if(await db.insert('mitra',{nama,logo_url:logo,urutan:parseInt(document.getElementById('m-urutan').value)||1,active:true})) renderMitra();
}
async function hapusMitra(id){if(await db.remove('mitra',id))renderMitra();}

// ================= STATISTIK (super) =================
async function renderStatistik(){
  const c=document.getElementById('content');
  const rows=await db.list('statistik','urutan',true);
  c.innerHTML=`
    <div id="toast" class="msg"></div>
    <div class="panel"><h2>Tambah Statistik</h2>
      <div class="grid2">
        <div class="field"><label>Angka</label><input id="s-angka" placeholder="92%"></div>
        <div class="field"><label>Urutan</label><input type="number" id="s-urutan" value="1"></div>
      </div>
      <div class="field"><label>Label</label><input id="s-label" placeholder="Keterserapan Lulusan"></div>
      <button class="btn" onclick="simpanStat()">Simpan</button>
    </div>
    <div class="panel"><h2>Daftar Statistik</h2>
      <table><thead><tr><th>Angka</th><th>Label</th><th>Urutan</th><th></th></tr></thead>
      <tbody>${rows.map(s=>`<tr><td><b>${escA(s.angka)}</b></td><td>${escA(s.label)}</td><td>${s.urutan??''}</td>
      <td><button class="btn btn-sm btn-danger" onclick="hapusStat('${s.id}')">Hapus</button></td></tr>`).join('')||'<tr><td colspan="4" style="text-align:center;color:#94a3b8;">Belum ada.</td></tr>'}</tbody></table>
    </div>`;
}
async function simpanStat(){
  const angka=document.getElementById('s-angka').value.trim(),label=document.getElementById('s-label').value.trim();
  if(!angka||!label){toast('Angka & label wajib diisi.',false);return;}
  if(await db.insert('statistik',{angka,label,urutan:parseInt(document.getElementById('s-urutan').value)||1})) renderStatistik();
}
async function hapusStat(id){if(await db.remove('statistik',id))renderStatistik();}

// ================= MENU NAVIGASI (super) =================
async function renderMenu(){
  const c=document.getElementById('content');
  const rows=await db.list('nav_menu','urutan',true);
  // ambil daftar halaman custom untuk pilihan URL
  const { data:pages } = await sb.from('halaman').select('slug,judul').eq('published',true).order('judul');
  const pageOpts=(pages||[]).map(p=>`<option value="page.html?slug=${escA(p.slug)}">${escA(p.judul)} (custom)</option>`).join('');
  c.innerHTML=`
    <div id="toast" class="msg"></div>
    <div class="panel"><h2 id="n-form-title">Tambah Menu</h2>
      <input type="hidden" id="n-id">
      <div class="grid2">
        <div class="field"><label>Label</label><input id="n-label" placeholder="Profil"></div>
        <div class="field"><label>URL / anchor</label><input id="n-url" placeholder="profil.html atau #kontak"></div>
      </div>
      <div class="field"><label>Pilih cepat halaman (opsional)</label>
        <select id="n-pick" onchange="if(this.value){document.getElementById('n-url').value=this.value;}">
          <option value="">— pilih halaman —</option>
          <option value="index.html">Beranda</option>
          <option value="profil.html">Profil</option>
          <option value="jurusan.html">Jurusan</option>
          <option value="berita.html">Berita</option>
          <option value="galeri.html">Galeri</option>
          <option value="index.html#kontak">Kontak (footer beranda)</option>
          ${pageOpts}
        </select>
        <div class="hint">Memilih di sini otomatis mengisi kolom URL di atas.</div>
      </div>
      <div class="grid2">
        <div class="field"><label>Urutan</label><input type="number" id="n-urutan" value="1"></div>
        <div class="field"><label><input type="checkbox" id="n-active" checked> Tampilkan</label></div>
      </div>
      <div class="row">
        <button class="btn" onclick="simpanMenu()">Simpan</button>
        <button class="btn btn-ghost" onclick="resetMenu()">Batal</button>
      </div>
    </div>
    <div class="panel"><h2>Daftar Menu</h2>
      <table><thead><tr><th>Urutan</th><th>Label</th><th>URL</th><th>Status</th><th>Aksi</th></tr></thead>
      <tbody>${rows.map(n=>`<tr><td>${n.urutan??''}</td><td>${escA(n.label)}</td><td>${escA(n.url)}</td>
      <td><span class="badge ${n.active?'on':'off'}">${n.active?'Tampil':'Nonaktif'}</span></td>
      <td class="row">
        <button class="btn btn-sm ${n.active?'btn-ghost':''}" onclick="toggleMenuAktif('${n.id}',${n.active})">${n.active?'Nonaktifkan':'Aktifkan'}</button>
        <button class="btn btn-sm btn-ghost" onclick='editMenu(${JSON.stringify(n)})'>Edit</button>
        <button class="btn btn-sm btn-danger" onclick="hapusMenu('${n.id}')">Hapus</button>
      </td></tr>`).join('')||'<tr><td colspan="5" style="text-align:center;color:#94a3b8;">Belum ada menu.</td></tr>'}</tbody></table>
    </div>`;
}
async function toggleMenuAktif(id,current){
  if(await db.update('nav_menu',id,{active:!current})) renderMenu();
}
function resetMenu(){
  ['n-id','n-label','n-url'].forEach(i=>document.getElementById(i).value='');
  document.getElementById('n-urutan').value='1'; document.getElementById('n-active').checked=true;
  document.getElementById('n-pick').value=''; document.getElementById('n-form-title').textContent='Tambah Menu';
}
function editMenu(n){
  document.getElementById('n-id').value=n.id;
  document.getElementById('n-label').value=n.label||'';
  document.getElementById('n-url').value=n.url||'';
  document.getElementById('n-urutan').value=n.urutan||1;
  document.getElementById('n-active').checked=!!n.active;
  document.getElementById('n-form-title').textContent='Edit Menu';
  window.scrollTo({top:0,behavior:'smooth'});
}
async function simpanMenu(){
  const id=document.getElementById('n-id').value;
  const label=document.getElementById('n-label').value.trim(),url=document.getElementById('n-url').value.trim();
  if(!label||!url){toast('Label & URL wajib diisi.',false);return;}
  const obj={label,url,urutan:parseInt(document.getElementById('n-urutan').value)||1,active:document.getElementById('n-active').checked};
  const ok=id?await db.update('nav_menu',id,obj):await db.insert('nav_menu',obj);
  if(ok){resetMenu();renderMenu();}
}
async function hapusMenu(id){if(await db.remove('nav_menu',id))renderMenu();}

// ================= HALAMAN CUSTOM (super) =================
async function renderHalaman(){
  const c=document.getElementById('content');
  const rows=await db.list('halaman','created_at',false);
  c.innerHTML=`
    <div id="toast" class="msg"></div>
    <div class="panel">
      <h2 id="h-form-title">Tambah Halaman</h2>
      <p class="desc">Buat halaman sendiri (mis. Fasilitas, Ekstrakurikuler). Halaman tampil di <code>page.html?slug=...</code> dan bisa ditambahkan ke menu navigasi.</p>
      <input type="hidden" id="h-id">
      <div class="grid2">
        <div class="field"><label>Judul halaman</label><input id="h-judul" placeholder="Fasilitas Sekolah" oninput="autoSlug()"></div>
        <div class="field"><label>Slug (alamat URL)</label><input id="h-slug" placeholder="fasilitas"><div class="hint">Hanya huruf kecil & tanda hubung. Contoh: page.html?slug=<b id="slug-preview">fasilitas</b></div></div>
      </div>
      <div class="field">
        <label>Mode penulisan konten</label>
        <div class="split">
          <label><input type="radio" name="h-mode" value="visual" checked onchange="switchMode('visual')"> Visual (teks biasa)</label>
          <span class="or">atau</span>
          <label><input type="radio" name="h-mode" value="html" onchange="switchMode('html')"> HTML (tempel kode/embed)</label>
        </div>
      </div>
      <div class="field" id="wrap-visual">
        <label>Konten</label>
        <div id="h-toolbar" style="margin-bottom:8px;display:flex;gap:6px;flex-wrap:wrap;">
          <button type="button" class="btn btn-sm btn-ghost" onclick="fmt('bold')"><b>B</b></button>
          <button type="button" class="btn btn-sm btn-ghost" onclick="fmt('italic')"><i>I</i></button>
          <button type="button" class="btn btn-sm btn-ghost" onclick="fmt('formatBlock','h2')">Judul</button>
          <button type="button" class="btn btn-sm btn-ghost" onclick="fmt('insertUnorderedList')">• List</button>
          <button type="button" class="btn btn-sm btn-ghost" onclick="fmtLink()">🔗 Link</button>
        </div>
        <div id="h-visual" contenteditable="true" style="min-height:200px;border:1.5px solid var(--line);border-radius:9px;padding:14px;font-size:14px;line-height:1.7;"></div>
      </div>
      <div class="field hidden" id="wrap-html">
        <label>Kode HTML / Embed</label>
        <textarea id="h-html" style="min-height:220px;font-family:monospace;font-size:13px;" placeholder="&lt;iframe src=...&gt;&lt;/iframe&gt; atau kode HTML lain"></textarea>
        <div class="hint">Bisa tempel embed Google Maps, YouTube, atau HTML apa pun.</div>
      </div>
      <div class="field"><label><input type="checkbox" id="h-pub" checked> Terbitkan (published)</label></div>
      <div class="row"><button class="btn" onclick="simpanHalaman()">Simpan</button><button class="btn btn-ghost" onclick="resetHalaman()">Batal</button></div>
    </div>
    <div class="panel"><h2>Daftar Halaman</h2>
      <table><thead><tr><th>Judul</th><th>Slug</th><th>Mode</th><th>Status</th><th></th></tr></thead>
      <tbody>${rows.map(h=>`<tr>
        <td>${escA(h.judul)}</td>
        <td><a href="../page.html?slug=${escA(h.slug)}" target="_blank">${escA(h.slug)}</a></td>
        <td>${h.mode==='html'?'HTML':'Visual'}</td>
        <td><span class="badge ${h.published?'on':'off'}">${h.published?'Terbit':'Draft'}</span></td>
        <td class="row">
          <button class="btn btn-sm btn-ghost" onclick='editHalaman(${JSON.stringify(h)})'>Edit</button>
          <button class="btn btn-sm btn-danger" onclick="hapusHalaman('${h.id}')">Hapus</button>
        </td></tr>`).join('')||'<tr><td colspan="5" style="text-align:center;color:#94a3b8;">Belum ada halaman.</td></tr>'}</tbody></table>
    </div>`;
}
function autoSlug(){
  const j=document.getElementById('h-judul').value;
  const s=document.getElementById('h-slug');
  if(!s.dataset.touched){
    s.value=j.toLowerCase().trim().replace(/[^a-z0-9\s-]/g,'').replace(/\s+/g,'-').replace(/-+/g,'-');
    document.getElementById('slug-preview').textContent=s.value||'slug';
  }
}
function switchMode(m){
  document.getElementById('wrap-visual').classList.toggle('hidden',m!=='visual');
  document.getElementById('wrap-html').classList.toggle('hidden',m!=='html');
}
function fmt(cmd,val){ document.execCommand(cmd,false,val||null); document.getElementById('h-visual').focus(); }
function fmtLink(){ const url=prompt('Masukkan URL:'); if(url) document.execCommand('createLink',false,url); }
function resetHalaman(){
  document.getElementById('h-id').value='';
  document.getElementById('h-judul').value='';
  const s=document.getElementById('h-slug'); s.value=''; delete s.dataset.touched;
  document.getElementById('h-visual').innerHTML='';
  document.getElementById('h-html').value='';
  document.getElementById('h-pub').checked=true;
  document.querySelector('input[name="h-mode"][value="visual"]').checked=true; switchMode('visual');
  document.getElementById('h-form-title').textContent='Tambah Halaman';
}
function editHalaman(h){
  document.getElementById('h-id').value=h.id;
  document.getElementById('h-judul').value=h.judul||'';
  const s=document.getElementById('h-slug'); s.value=h.slug||''; s.dataset.touched='1';
  document.getElementById('h-pub').checked=!!h.published;
  const mode=h.mode||'visual';
  document.querySelector(`input[name="h-mode"][value="${mode}"]`).checked=true; switchMode(mode);
  if(mode==='html'){ document.getElementById('h-html').value=h.konten||''; }
  else { document.getElementById('h-visual').innerHTML=h.konten||''; }
  document.getElementById('h-form-title').textContent='Edit Halaman';
  window.scrollTo({top:0,behavior:'smooth'});
}
async function simpanHalaman(){
  const id=document.getElementById('h-id').value;
  const judul=document.getElementById('h-judul').value.trim();
  let slug=document.getElementById('h-slug').value.trim().toLowerCase().replace(/[^a-z0-9-]/g,'');
  if(!judul||!slug){toast('Judul & slug wajib diisi.',false);return;}
  const mode=document.querySelector('input[name="h-mode"]:checked').value;
  const konten = mode==='html' ? document.getElementById('h-html').value : document.getElementById('h-visual').innerHTML;
  const obj={judul,slug,mode,konten,published:document.getElementById('h-pub').checked};
  const ok=id?await db.update('halaman',id,obj):await db.insert('halaman',obj);
  if(ok){resetHalaman();renderHalaman();}
}
async function hapusHalaman(id){if(await db.remove('halaman',id))renderHalaman();}

// ================= PENGATURAN BERANDA (super) =================
async function renderBeranda(){
  const c=document.getElementById('content');
  const { data } = await sb.from('beranda_section').select('*').order('urutan');
  const rows=data||[];
  const namaSection={hero:'Hero (banner atas)',stats:'Statistik',jurusan:'Jurusan',mitra:'Mitra DUDI',berita:'Berita',galeri:'Galeri',ppdb:'PPDB'};
  const punyaJudul=['jurusan','mitra','berita','galeri'];
  c.innerHTML=`
    <div id="toast" class="msg"></div>
    <div class="panel">
      <h2>Pengaturan Bagian Beranda</h2>
      <p class="desc">Atur bagian mana yang tampil di beranda, urutannya, dan judulnya. Klik Simpan setelah mengubah.</p>
      <table><thead><tr><th>Bagian</th><th>Judul (jika ada)</th><th>Urutan</th><th>Tampil</th></tr></thead>
      <tbody>${rows.map(s=>`<tr>
        <td><b>${namaSection[s.key]||s.key}</b></td>
        <td>${punyaJudul.includes(s.key)?`<input id="bs-judul-${s.key}" value="${escA(s.judul||'')}" style="width:100%;padding:8px;border:1.5px solid var(--line);border-radius:7px;">`:'<span style="color:#94a3b8;">—</span>'}</td>
        <td><input type="number" id="bs-urutan-${s.key}" value="${s.urutan??1}" style="width:70px;padding:8px;border:1.5px solid var(--line);border-radius:7px;"></td>
        <td><input type="checkbox" id="bs-aktif-${s.key}" ${s.aktif?'checked':''}></td>
      </tr>`).join('')}</tbody></table>
      <div style="margin-top:18px;"><button class="btn" onclick='simpanBeranda(${JSON.stringify(rows.map(r=>r.key))})'>Simpan Semua</button></div>
    </div>
    <div class="panel">
      <h2>Halaman Custom di Beranda</h2>
      <p class="desc">Pilih halaman buatan sendiri yang ingin ikut tampil sebagai bagian di beranda. Untuk menambah/mengedit/menghapus isi halaman, gunakan menu <b>Halaman</b>.</p>
      <div id="beranda-halaman"><div class="loading">Memuat…</div></div>
    </div>`;
  loadHalamanBeranda();
}
async function loadHalamanBeranda(){
  const box=document.getElementById('beranda-halaman'); if(!box) return;
  const rows=await db.list('halaman','judul',true);
  if(!rows.length){ box.innerHTML='<p style="color:#94a3b8;">Belum ada halaman custom. Buat dulu di menu Halaman.</p>'; return; }
  box.innerHTML=`
    <table><thead><tr><th>Judul</th><th>Tampil di beranda</th><th>Urutan</th><th>Aksi</th></tr></thead>
    <tbody>${rows.map(h=>`<tr>
      <td>${escA(h.judul)}</td>
      <td><input type="checkbox" id="hb-aktif-${h.id}" ${h.di_beranda?'checked':''}></td>
      <td><input type="number" id="hb-urutan-${h.id}" value="${h.beranda_urutan??99}" style="width:70px;padding:8px;border:1.5px solid var(--line);border-radius:7px;"></td>
      <td class="row">
        <button class="btn btn-sm" onclick="simpanHalamanBeranda('${h.id}')">Simpan</button>
        <button class="btn btn-sm btn-ghost" onclick="openModule('halaman')">Edit isi</button>
      </td>
    </tr>`).join('')}</tbody></table>`;
}
async function simpanHalamanBeranda(id){
  const obj={
    di_beranda:document.getElementById('hb-aktif-'+id).checked,
    beranda_urutan:parseInt(document.getElementById('hb-urutan-'+id).value)||99
  };
  if(await db.update('halaman',id,obj)) { toast('Tersimpan.'); loadHalamanBeranda(); }
}
async function simpanBeranda(keys){
  const punyaJudul=['jurusan','mitra','berita','galeri'];
  for(const key of keys){
    const obj={
      aktif:document.getElementById('bs-aktif-'+key).checked,
      urutan:parseInt(document.getElementById('bs-urutan-'+key).value)||1
    };
    if(punyaJudul.includes(key)){ obj.judul=document.getElementById('bs-judul-'+key).value.trim(); }
    await sb.from('beranda_section').update(obj).eq('key',key);
  }
  toast('Pengaturan beranda tersimpan.');
  renderBeranda();
}

// ================= FOOTER (super) =================
async function renderFooter(){
  const c=document.getElementById('content');
  const { data:p }=await sb.from('pengaturan').select('*').eq('id',1).single();
  const s=p||{};
  const links=await db.list('footer_link','urutan',true);
  const sosmed=await db.list('sosial_media','urutan',true);
  c.innerHTML=`
    <div id="toast" class="msg"></div>
    <div class="panel">
      <h2>Informasi Footer</h2>
      <div class="field"><label>Deskripsi singkat sekolah (kolom pertama footer)</label><textarea id="f-deskripsi">${escA(s.footer_deskripsi||'')}</textarea></div>
      <div class="field"><label>Alamat</label><input id="f-alamat" value="${escA(s.alamat||'')}"></div>
      <div class="grid2">
        <div class="field"><label>Telepon</label><input id="f-telp" value="${escA(s.telepon||'')}"></div>
        <div class="field"><label>Email</label><input id="f-email" value="${escA(s.email||'')}"></div>
      </div>
      <div class="field"><label>Teks Copyright</label><input id="f-copyright" value="${escA(s.copyright||'')}" placeholder="© 2026 Nama Sekolah. Seluruh hak cipta dilindungi."></div>
      <button class="btn" onclick="simpanFooterInfo()">Simpan Info Footer</button>
    </div>

    <div class="panel">
      <h2>Kolom Tautan Footer</h2>
      <p class="desc">Kelompokkan link berdasarkan nama kolom (mis. "Tautan", "Layanan").</p>
      <div class="grid2">
        <div class="field"><label>Nama kolom</label><input id="fl-kolom" placeholder="Tautan"></div>
        <div class="field"><label>Label link</label><input id="fl-label" placeholder="Profil"></div>
      </div>
      <div class="grid2">
        <div class="field"><label>URL</label><input id="fl-url" placeholder="profil.html"></div>
        <div class="field"><label>Urutan</label><input type="number" id="fl-urutan" value="1"></div>
      </div>
      <button class="btn" onclick="tambahFLink()">Tambah Link</button>
      <table style="margin-top:16px;"><thead><tr><th>Kolom</th><th>Label</th><th>URL</th><th>Aksi</th></tr></thead>
      <tbody>${links.map(l=>`<tr><td>${escA(l.kolom)}</td><td>${escA(l.label)}</td><td>${escA(l.url)}</td>
        <td><button class="btn btn-sm btn-danger" onclick="hapusFLink('${l.id}')">Hapus</button></td></tr>`).join('')||'<tr><td colspan="4" style="text-align:center;color:#94a3b8;">Belum ada.</td></tr>'}</tbody></table>
    </div>

    <div class="panel">
      <h2>Sosial Media</h2>
      <div class="grid2">
        <div class="field"><label>Nama</label><input id="sm-nama" placeholder="Instagram"></div>
        <div class="field"><label>URL</label><input id="sm-url" placeholder="https://instagram.com/..."></div>
      </div>
      <button class="btn" onclick="tambahSosmed()">Tambah Sosial Media</button>
      <table style="margin-top:16px;"><thead><tr><th>Nama</th><th>URL</th><th>Aksi</th></tr></thead>
      <tbody>${sosmed.map(m=>`<tr><td>${escA(m.nama)}</td><td>${escA(m.url)}</td>
        <td><button class="btn btn-sm btn-danger" onclick="hapusSosmed('${m.id}')">Hapus</button></td></tr>`).join('')||'<tr><td colspan="3" style="text-align:center;color:#94a3b8;">Belum ada.</td></tr>'}</tbody></table>
    </div>`;
}
async function simpanFooterInfo(){
  const obj={id:1,
    footer_deskripsi:document.getElementById('f-deskripsi').value.trim(),
    alamat:document.getElementById('f-alamat').value.trim(),
    telepon:document.getElementById('f-telp').value.trim(),
    email:document.getElementById('f-email').value.trim(),
    copyright:document.getElementById('f-copyright').value.trim()
  };
  const { error }=await sb.from('pengaturan').upsert(obj);
  toast(error?('Gagal: '+error.message):'Tersimpan.',!error);
}
async function tambahFLink(){
  const kolom=document.getElementById('fl-kolom').value.trim()||'Tautan';
  const label=document.getElementById('fl-label').value.trim();
  const url=document.getElementById('fl-url').value.trim();
  if(!label||!url){toast('Label & URL wajib diisi.',false);return;}
  if(await db.insert('footer_link',{kolom,label,url,urutan:parseInt(document.getElementById('fl-urutan').value)||1,active:true})) renderFooter();
}
async function hapusFLink(id){if(await db.remove('footer_link',id))renderFooter();}
async function tambahSosmed(){
  const nama=document.getElementById('sm-nama').value.trim();
  const url=document.getElementById('sm-url').value.trim();
  if(!nama||!url){toast('Nama & URL wajib diisi.',false);return;}
  if(await db.insert('sosial_media',{nama,url,urutan:1,active:true})) renderFooter();
}
async function hapusSosmed(id){if(await db.remove('sosial_media',id))renderFooter();}

// ================= PPDB (super) =================
async function renderPPDB(){
  const c=document.getElementById('content');
  const { data }=await sb.from('ppdb').select('*').eq('id',1).single();
  const p=data||{};
  c.innerHTML=`
    <div id="toast" class="msg"></div>
    <div class="panel"><h2>Pengaturan PPDB</h2>
      <p class="desc">Atur teks banner PPDB di beranda dan link pendaftaran.</p>
      <div class="field"><label>Judul</label><input id="p-judul" value="${escA(p.judul||'')}" placeholder="PPDB 2026 Dibuka"></div>
      <div class="field"><label>Deskripsi</label><textarea id="p-teks">${escA(p.teks||'')}</textarea></div>
      <div class="grid2">
        <div class="field"><label>Teks tombol</label><input id="p-btn" value="${escA(p.tombol||'Daftar Sekarang')}"></div>
        <div class="field"><label>Link pendaftaran</label><input id="p-link" value="${escA(p.link||'')}" placeholder="https://form…"></div>
      </div>
      <button class="btn" onclick="simpanPPDB()">Simpan</button>
    </div>`;
}
async function simpanPPDB(){
  const obj={id:1,judul:document.getElementById('p-judul').value.trim(),teks:document.getElementById('p-teks').value.trim(),tombol:document.getElementById('p-btn').value.trim(),link:document.getElementById('p-link').value.trim()};
  const { error }=await sb.from('ppdb').upsert(obj);
  toast(error?('Gagal: '+error.message):'Tersimpan.',!error);
}

// ================= PENGATURAN SITUS (super) =================
async function renderPengaturan(){
  const c=document.getElementById('content');
  const { data }=await sb.from('pengaturan').select('*').eq('id',1).single();
  const p=data||{};
  c.innerHTML=`
    <div id="toast" class="msg"></div>
    <div class="panel"><h2>Identitas Sekolah</h2>
      <div class="grid2">
        <div class="field"><label>Nama sekolah</label><input id="set-nama" value="${escA(p.nama_sekolah||'')}"></div>
        <div class="field"><label>Tagline</label><input id="set-tagline" value="${escA(p.tagline||'')}"></div>
      </div>
      <div class="field"><label>Eyebrow (teks kecil di atas judul hero)</label><input id="set-eyebrow" value="${escA(p.hero_eyebrow||'')}" placeholder="SMK Pusat Keunggulan · Akreditasi A"></div>
      <div class="field"><label>Judul Hero</label><input id="set-hjudul" value="${escA(p.hero_judul||'')}"></div>
      <div class="field"><label>Teks Hero</label><textarea id="set-hteks">${escA(p.hero_teks||'')}</textarea></div>
      <div class="grid2">
        <div class="field"><label>Upload logo</label><input type="file" id="set-logo-file" accept="image/*"></div>
        <div class="field"><label>URL logo</label><input id="set-logo-url" value="${escA(p.logo_url||'')}"></div>
      </div>
      <div class="grid2">
        <div class="field"><label>Upload gambar hero</label><input type="file" id="set-hero-file" accept="image/*"></div>
        <div class="field"><label>URL gambar hero</label><input id="set-hero-url" value="${escA(p.hero_gambar||'')}"></div>
      </div>

      <h2 style="margin-top:10px;">Tombol Utama</h2>
      <p class="desc">Tombol PPDB dipakai di hero <b>dan</b> di navbar sekaligus. Tombol Jurusan hanya di hero.</p>
      <div class="grid2">
        <div class="field"><label>Teks tombol PPDB</label><input id="set-btn-ppdb-teks" value="${escA(p.btn_ppdb_teks||'')}" placeholder="Daftar PPDB 2026"></div>
        <div class="field"><label>Link tombol PPDB</label><input id="set-btn-ppdb-link" value="${escA(p.btn_ppdb_link||'')}" placeholder="#ppdb atau https://form..."></div>
      </div>
      <div class="grid2">
        <div class="field"><label>Teks tombol Jurusan</label><input id="set-btn-jur-teks" value="${escA(p.btn_jurusan_teks||'')}" placeholder="Lihat Jurusan"></div>
        <div class="field"><label>Link tombol Jurusan</label><input id="set-btn-jur-link" value="${escA(p.btn_jurusan_link||'')}" placeholder="jurusan.html"></div>
      </div>

      <h2 style="margin-top:10px;">Kontak</h2>
      <div class="field"><label>Alamat</label><input id="set-alamat" value="${escA(p.alamat||'')}"></div>
      <div class="grid2">
        <div class="field"><label>Telepon</label><input id="set-telp" value="${escA(p.telepon||'')}"></div>
        <div class="field"><label>Email</label><input id="set-email" value="${escA(p.email||'')}"></div>
      </div>
      <button class="btn" onclick="simpanPengaturan()">Simpan</button>
    </div>`;
}
async function simpanPengaturan(){
  const logo=await resolveGambar('set-logo-file','set-logo-url');
  const hero=await resolveGambar('set-hero-file','set-hero-url');
  const obj={id:1,
    nama_sekolah:document.getElementById('set-nama').value.trim(),
    tagline:document.getElementById('set-tagline').value.trim(),
    hero_eyebrow:document.getElementById('set-eyebrow').value.trim(),
    hero_judul:document.getElementById('set-hjudul').value.trim(),
    hero_teks:document.getElementById('set-hteks').value.trim(),
    btn_ppdb_teks:document.getElementById('set-btn-ppdb-teks').value.trim(),
    btn_ppdb_link:document.getElementById('set-btn-ppdb-link').value.trim(),
    btn_jurusan_teks:document.getElementById('set-btn-jur-teks').value.trim(),
    btn_jurusan_link:document.getElementById('set-btn-jur-link').value.trim(),
    alamat:document.getElementById('set-alamat').value.trim(),
    telepon:document.getElementById('set-telp').value.trim(),
    email:document.getElementById('set-email').value.trim()
  };
  if(logo) obj.logo_url=logo; if(hero) obj.hero_gambar=hero;
  const { error }=await sb.from('pengaturan').upsert(obj);
  toast(error?('Gagal: '+error.message):'Tersimpan.',!error);
}

// ================= KELOLA PENGGUNA (super) =================
async function renderPengguna(){
  const c=document.getElementById('content');
  const rows=await db.list('profiles','created_at',true);
  c.innerHTML=`
    <div id="toast" class="msg"></div>
    <div class="panel">
      <h2>Daftar Pengguna</h2>
      <p class="desc">Akun dibuat lewat dashboard Supabase (Authentication → Users). Di sini Anda mengatur peran & nama.</p>
      <table><thead><tr><th>Nama</th><th>Role</th><th>Ubah Peran</th></tr></thead>
      <tbody>${rows.map(u=>`<tr>
        <td>${escA(u.nama||u.id)}</td>
        <td><span class="badge ${u.role==='super_admin'?'on':'off'}">${u.role==='super_admin'?'Super Admin':'Admin'}</span></td>
        <td class="row">
          <select id="role-${u.id}"><option value="admin"${u.role==='admin'?' selected':''}>Admin</option><option value="super_admin"${u.role==='super_admin'?' selected':''}>Super Admin</option></select>
          <button class="btn btn-sm" onclick="ubahRole('${u.id}')">Simpan</button>
        </td></tr>`).join('')||'<tr><td colspan="3" style="text-align:center;color:#94a3b8;">Belum ada profil pengguna.</td></tr>'}
      </tbody></table>
    </div>`;
}
async function ubahRole(id){
  const role=document.getElementById('role-'+id).value;
  if(await db.update('profiles',id,{role})) renderPengguna();
}

document.addEventListener('DOMContentLoaded',initDashboard);
