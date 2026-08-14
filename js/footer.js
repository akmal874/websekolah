// ============================================================
//  FOOTER.JS — render footer dinamis (dipakai semua halaman publik)
// ============================================================
function escF(s){ return (s??'').toString().replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

async function renderFooterPublik(){
  const grid=document.getElementById('footer-grid'); if(!grid) return;
  const { data:s } = await sb.from('pengaturan').select('*').eq('id',1).single();
  const { data:links } = await sb.from('footer_link').select('*').eq('active',true).order('urutan');
  const { data:sosmed } = await sb.from('sosial_media').select('*').eq('active',true).order('urutan');

  const nama=s?.nama_sekolah||'SMK Negeri';
  // kolom pertama: identitas + deskripsi/kontak
  let html=`<div>
    <h5>${escF(nama)}</h5>
    <p>${s?.footer_deskripsi?escF(s.footer_deskripsi)+'<br><br>':''}${escF(s?.alamat||'')}<br>Telp: ${escF(s?.telepon||'-')}<br>Email: ${escF(s?.email||'-')}</p>
  </div>`;

  // kelompokkan link berdasarkan kolom
  const grup={};
  (links||[]).forEach(l=>{ (grup[l.kolom]=grup[l.kolom]||[]).push(l); });
  Object.entries(grup).forEach(([kolom,items])=>{
    html+=`<div><h5>${escF(kolom)}</h5><ul>${items.map(i=>`<li><a href="${escF(i.url)}">${escF(i.label)}</a></li>`).join('')}</ul></div>`;
  });

  // sosial media
  if(sosmed&&sosmed.length){
    html+=`<div><h5>Ikuti Kami</h5><ul>${sosmed.map(m=>`<li><a href="${escF(m.url)}" target="_blank">${escF(m.nama)}</a></li>`).join('')}</ul></div>`;
  }
  grid.innerHTML=html;

  // copyright
  const cp=document.getElementById('footer-copyright');
  if(cp) cp.textContent = s?.copyright || `© ${new Date().getFullYear()} ${nama}. Seluruh hak cipta dilindungi.`;
}
