// ============================================================
//  CRUD.JS — helper generik untuk semua tabel + upload gambar
// ============================================================

function escA(s){ return (s??'').toString().replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function tglIDa(iso){ if(!iso)return''; const b=['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];const d=new Date(iso);return `${d.getDate()} ${b[d.getMonth()]} ${d.getFullYear()}`; }
function toast(text,ok=true){
  const el=document.getElementById('toast'); if(!el){ alert(text); return; }
  el.textContent=text; el.className='msg '+(ok?'ok':'err'); el.style.display='block';
  setTimeout(()=>{ el.style.display='none'; },3500);
}

// Upload file ke Supabase Storage, kembalikan public URL
async function uploadGambar(file){
  if(!file) return null;
  const ext=file.name.split('.').pop();
  const path=`${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;
  const { error } = await sb.storage.from(STORAGE_BUCKET).upload(path,file,{ upsert:false });
  if(error){ toast('Upload gagal: '+error.message,false); return null; }
  const { data } = sb.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

// Ambil URL gambar dari input: prioritas file upload, jika kosong pakai URL manual
async function resolveGambar(fileInputId,urlInputId){
  const f=document.getElementById(fileInputId)?.files?.[0];
  if(f){ return await uploadGambar(f); }
  const u=document.getElementById(urlInputId)?.value?.trim();
  return u||null;
}

// CRUD generik
const db={
  async list(tabel,orderCol='created_at',asc=false){
    const { data,error }=await sb.from(tabel).select('*').order(orderCol,{ascending:asc});
    if(error){ toast('Gagal memuat '+tabel+': '+error.message,false); return []; }
    return data||[];
  },
  async insert(tabel,obj){
    const { error }=await sb.from(tabel).insert(obj);
    if(error){ toast('Gagal menyimpan: '+error.message,false); return false; }
    toast('Berhasil disimpan.'); return true;
  },
  async update(tabel,id,obj){
    const { error }=await sb.from(tabel).update(obj).eq('id',id);
    if(error){ toast('Gagal memperbarui: '+error.message,false); return false; }
    toast('Berhasil diperbarui.'); return true;
  },
  async remove(tabel,id){
    if(!confirm('Hapus data ini?')) return false;
    const { error }=await sb.from(tabel).delete().eq('id',id);
    if(error){ toast('Gagal menghapus: '+error.message,false); return false; }
    toast('Data dihapus.'); return true;
  }
};
