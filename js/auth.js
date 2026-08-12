// ============================================================
//  AUTH.JS — login, cek sesi, cek role
// ============================================================

// Ambil profil (role) user yang sedang login
async function getProfil(){
  const { data:{ user } } = await sb.auth.getUser();
  if(!user) return null;
  const { data } = await sb.from('profiles').select('*').eq('id',user.id).single();
  return data ? { ...data, email:user.email } : { id:user.id, email:user.email, role:'admin', nama:user.email };
}

// Wajib login. Jika belum, lempar ke halaman login.
async function requireAuth(){
  const { data:{ session } } = await sb.auth.getSession();
  if(!session){ location.href='index.html'; return null; }
  const profil = await getProfil();
  if(!profil){ location.href='index.html'; return null; }
  return profil;
}

// Logout
async function logout(){
  await sb.auth.signOut();
  location.href='index.html';
}

// Login (dipakai di halaman login)
async function doLogin(e){
  e.preventDefault();
  const email=document.getElementById('email').value.trim();
  const pass=document.getElementById('password').value;
  const msg=document.getElementById('msg');
  const btn=document.getElementById('loginBtn');
  msg.className='msg'; btn.disabled=true; btn.textContent='Memproses…';

  const { error } = await sb.auth.signInWithPassword({ email, password:pass });
  if(error){
    msg.className='msg err'; msg.textContent='Login gagal: '+error.message;
    btn.disabled=false; btn.textContent='Masuk';
    return;
  }
  location.href='dashboard.html';
}

// Cek apakah user super admin
function isSuper(profil){ return profil && profil.role==='super_admin'; }
