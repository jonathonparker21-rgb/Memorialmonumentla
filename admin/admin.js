
const defaultCreds = { username: 'admin', password: 'ChangeMe123!' };

function getCreds(){
  const saved = localStorage.getItem('memorialAdminCreds');
  if(saved){ try { return JSON.parse(saved); } catch(e) {} }
  return defaultCreds;
}
function isLoggedIn(){ return sessionStorage.getItem('memorialAdminAuth') === 'true'; }

async function loadSiteContent(){
  const local = localStorage.getItem('memorialSiteContent');
  if(local){ try { return JSON.parse(local); } catch(e) {} }
  const res = await fetch('../site-content.json');
  return await res.json();
}

function show(id, on=true){
  const el = document.getElementById(id);
  if(el) el.style.display = on ? '' : 'none';
}

function fillForm(data){
  const map = {
    businessName: data.businessName, tagline: data.tagline, heroHeadline: data.heroHeadline,
    heroText: data.heroText, welcomeTitle: data.welcomeTitle, welcomeText: data.welcomeText,
    aboutText: data.aboutText, mainLocName: data.mainLocation.name, mainAddr1: data.mainLocation.address1,
    mainAddr2: data.mainLocation.address2, mainPhone: data.mainLocation.phone, mainEmail: data.mainLocation.email,
    mainMap: data.mainLocation.mapsQuery, secondLocName: data.secondLocation.name, secondAddr1: data.secondLocation.address1,
    secondAddr2: data.secondLocation.address2, secondPhone: data.secondLocation.phone, secondEmail: data.secondLocation.email,
    secondMap: data.secondLocation.mapsQuery, service1: data.services[0] || '', service2: data.services[1] || '',
    service3: data.services[2] || '', service4: data.services[3] || '', service5: data.services[4] || '', service6: data.services[5] || ''
  };
  Object.entries(map).forEach(([id,val]) => { const el=document.getElementById(id); if(el) el.value = val || ''; });
}

function readForm(){
  return {
    businessName: document.getElementById('businessName').value,
    tagline: document.getElementById('tagline').value,
    heroHeadline: document.getElementById('heroHeadline').value,
    heroText: document.getElementById('heroText').value,
    welcomeTitle: document.getElementById('welcomeTitle').value,
    welcomeText: document.getElementById('welcomeText').value,
    aboutText: document.getElementById('aboutText').value,
    services: [1,2,3,4,5,6].map(i => document.getElementById('service'+i).value).filter(Boolean),
    mainLocation: {
      name: document.getElementById('mainLocName').value,
      address1: document.getElementById('mainAddr1').value,
      address2: document.getElementById('mainAddr2').value,
      phone: document.getElementById('mainPhone').value,
      email: document.getElementById('mainEmail').value,
      mapsQuery: document.getElementById('mainMap').value,
    },
    secondLocation: {
      name: document.getElementById('secondLocName').value,
      address1: document.getElementById('secondAddr1').value,
      address2: document.getElementById('secondAddr2').value,
      phone: document.getElementById('secondPhone').value,
      email: document.getElementById('secondEmail').value,
      mapsQuery: document.getElementById('secondMap').value,
    }
  };
}

document.addEventListener('DOMContentLoaded', async () => {
  const loginForm = document.getElementById('loginForm');
  const editor = document.getElementById('editor');
  const loginBox = document.getElementById('loginBox');

  async function initEditor(){
    show('loginBox', false);
    show('editor', true);
    fillForm(await loadSiteContent());
  }

  if(isLoggedIn()) initEditor();

  loginForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const creds = getCreds();
    const u = document.getElementById('username').value;
    const p = document.getElementById('password').value;
    const err = document.getElementById('loginError');
    if(u === creds.username && p === creds.password){
      sessionStorage.setItem('memorialAdminAuth', 'true');
      initEditor();
    } else {
      err.textContent = 'Incorrect username or password.';
    }
  });

  document.getElementById('saveBtn')?.addEventListener('click', () => {
    const data = readForm();
    localStorage.setItem('memorialSiteContent', JSON.stringify(data));
    const msg = document.getElementById('saveMsg');
    msg.textContent = 'Changes saved for preview. Refresh the public pages to see updates.';
  });

  document.getElementById('resetBtn')?.addEventListener('click', async () => {
    localStorage.removeItem('memorialSiteContent');
    fillForm(await loadSiteContent());
    document.getElementById('saveMsg').textContent = 'Reset to the original draft content.';
  });

  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    sessionStorage.removeItem('memorialAdminAuth');
    location.reload();
  });
});
