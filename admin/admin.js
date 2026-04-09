
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
  const d = data.design || {};
  const map = {
    version: data.version || 'v1.0.5',
    businessName: data.businessName, tagline: data.tagline, heroHeadline: data.heroHeadline,
    heroText: data.heroText, welcomeTitle: data.welcomeTitle, welcomeText: data.welcomeText,
    aboutText: data.aboutText, mainLocName: data.mainLocation.name, mainAddr1: data.mainLocation.address1,
    mainAddr2: data.mainLocation.address2, mainPhone: data.mainLocation.phone, mainEmail: data.mainLocation.email,
    mainMap: data.mainLocation.mapsQuery, secondLocName: data.secondLocation.name, secondAddr1: data.secondLocation.address1,
    secondAddr2: data.secondLocation.address2, secondPhone: data.secondLocation.phone, secondEmail: data.secondLocation.email,
    secondMap: data.secondLocation.mapsQuery, service1: data.services[0] || '', service2: data.services[1] || '',
    service3: data.services[2] || '', service4: data.services[3] || '', service5: data.services[4] || '', service6: data.services[5] || '',
    accentColor: d.accentColor || '#8c694a', accentDark: d.accentDark || '#6e5239',
    backgroundColor: d.backgroundColor || '#f7f2eb', surfaceColor: d.surfaceColor || '#ffffff',
    textColor: d.textColor || '#1f2933', mutedColor: d.mutedColor || '#5d6770',
    heroTitleSize: d.heroTitleSize || '4.5rem', sectionTitleSize: d.sectionTitleSize || '2.8rem',
    bodyTextSize: d.bodyTextSize || '1.08rem', navTextSize: d.navTextSize || '1rem'
  };
  Object.entries(map).forEach(([id,val]) => { const el=document.getElementById(id); if(el) el.value = val || ''; });
}
function readForm(){
  return {
    version: document.getElementById('version').value,
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
    },
    design: {
      accentColor: document.getElementById('accentColor').value,
      accentDark: document.getElementById('accentDark').value,
      backgroundColor: document.getElementById('backgroundColor').value,
      surfaceColor: document.getElementById('surfaceColor').value,
      textColor: document.getElementById('textColor').value,
      mutedColor: document.getElementById('mutedColor').value,
      heroTitleSize: document.getElementById('heroTitleSize').value,
      sectionTitleSize: document.getElementById('sectionTitleSize').value,
      bodyTextSize: document.getElementById('bodyTextSize').value,
      navTextSize: document.getElementById('navTextSize').value,
    }
  };
}
document.addEventListener('DOMContentLoaded', async () => {
  const loginForm = document.getElementById('loginForm');
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
    document.getElementById('saveMsg').textContent = 'Changes saved for preview. Refresh the public pages to see updates.';
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
