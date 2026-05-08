const defaultCreds = { username: 'admin', password: 'ChangeMe123!' };
let currentGallery = [];
let currentServices = [];
let cachedContent = null;
function byId(id){
  return document.getElementById(id);
}
function val(id){
  const el = byId(id);
  return el ? el.value : '';
}
function setVal(id, value){
  const el = byId(id);
  if(el) el.value = value || '';
}


function getCreds(){
  const saved = localStorage.getItem('memorialAdminCreds');
  if(saved){ try { return JSON.parse(saved); } catch(e) {} }
  return defaultCreds;
}

function getAuthHeader(){
  const creds = getCreds();
  return 'Basic ' + btoa(`${creds.username}:${creds.password}`);
}

function isLoggedIn(){ return sessionStorage.getItem('memorialAdminAuth') === 'true'; }

function adminVersionNumber(v){
  return String(v || 'v0.0.0').replace(/^v/, '').split('.').map(n => parseInt(n, 10) || 0);
}

function isOlderAdminVersion(a, b){
  const av = adminVersionNumber(a);
  const bv = adminVersionNumber(b);
  for(let i=0; i<3; i++){
    if(av[i] < bv[i]) return true;
    if(av[i] > bv[i]) return false;
  }
  return false;
}

async function loadSiteContent(){
  try {
    const res = await fetch('/api/get-content?build=v1.6.9', { cache: 'no-store' });
    if(res.ok){
      const data = await res.json();
      const bundledRes = await fetch('../site-content.json?v=v1.6.9', { cache: 'no-store' });
      const bundled = await bundledRes.json();
      if(data.version && isOlderAdminVersion(data.version, bundled.version)) return bundled;
      return { ...bundled, ...data, version: data.version || bundled.version };
    }
  } catch(e) {}

  try {
    const res = await fetch('../site-content.json?v=v1.6.9', { cache: 'no-store' });
    return await res.json();
  } catch(e) {}

  const local = localStorage.getItem('memorialSiteContent');
  if(local){ try { return JSON.parse(local); } catch(e) {} }
  return {};
}

async function checkDiagnostics(){
  const out = document.getElementById('diagnosticsText');
  if(!out) return;
  try {
    const res = await fetch('/api/diagnostics', { cache:'no-store' });
    if(!res.ok) throw new Error('diagnostics endpoint returned ' + res.status);
    const d = await res.json();
    const missing = [];
    if(!d.SITE_CONTENT) missing.push('SITE_CONTENT');
    if(!d.OWNER_USERNAME) missing.push('OWNER_USERNAME');
    if(!d.OWNER_PASSWORD) missing.push('OWNER_PASSWORD');
    out.textContent = missing.length ? 'Missing or inactive: ' + missing.join(', ') + '. Add variables/bindings and redeploy.' : 'Cloudflare bindings look ready.';
  } catch(error) {
    out.textContent = 'Diagnostics endpoint not available. Functions may not be deployed.';
  }
}

function show(id, on=true){
  const el = document.getElementById(id);
  if(el) el.style.display = on ? '' : 'none';
}

function renderServicesAdmin(){
  const wrap = document.getElementById('servicesAdminList');
  if(!wrap) return;
  wrap.innerHTML = currentServices.map((service, i) => `
    <div class="service-admin-item">
      <input value="${String(service).replace(/"/g, '&quot;')}" oninput="updateServiceItem(${i}, this.value)" />
      <button class="btn btn-secondary" type="button" onclick="removeServiceItem(${i})">Remove</button>
    </div>
  `).join('');
}

window.updateServiceItem = function(index, value){
  currentServices[index] = value;
}

window.removeServiceItem = function(index){
  currentServices.splice(index, 1);
  renderServicesAdmin();
}

function renderAdminGallery(){
  const wrap = document.getElementById('adminGalleryList');
  if(!wrap) return;
  wrap.innerHTML = (currentGallery || []).map((item, i) => `
    <div class="admin-gallery-item">
      <img src="${item.image}" alt="${item.title}">
      <div>
        <strong>${item.title}</strong>
        <div class="small">${item.description || ''}</div>
        ${item.beforeImage ? '<div class="small">Before/after enabled</div>' : '<div class="small">After photo only</div>'}
      </div>
      <button class="btn btn-secondary" type="button" onclick="removeGalleryItem(${i})">Remove</button>
    </div>
  `).join('');
}

window.removeGalleryItem = function(index){
  currentGallery.splice(index, 1);
  renderAdminGallery();
}

function isHeicFile(file){
  const name = (file?.name || '').toLowerCase();
  const type = (file?.type || '').toLowerCase();
  return name.endsWith('.heic') || name.endsWith('.heif') || type.includes('heic') || type.includes('heif');
}

async function maybeConvertHeic(file, status){
  if(!file || !isHeicFile(file)) return file;
  if(status) status.textContent = 'Converting HEIC photo to JPEG...';
  if(typeof heic2any === 'undefined') throw new Error('HEIC converter did not load. Convert to JPG first and try again.');
  const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 });
  const blob = Array.isArray(converted) ? converted[0] : converted;
  const newName = (file.name || 'photo.heic').replace(/\.(heic|heif)$/i, '.jpg');
  return new File([blob], newName, { type: 'image/jpeg' });
}

function fileToImage(file){
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read selected image.')); };
    img.src = url;
  });
}

async function compressImageToDataUrl(file, status){
  file = await maybeConvertHeic(file, status);
  if(status) status.textContent = 'Preparing photo for gallery...';
  const img = await fileToImage(file);
  const maxWidth = 1400;
  const maxHeight = 1000;
  let width = img.width;
  let height = img.height;
  const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
  width = Math.round(width * ratio);
  height = Math.round(height * ratio);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', 0.82);
}

function fillForm(data){
  cachedContent = data;
  const d = data.design || {};
  currentGallery = data.restorationGallery || [];
  currentServices = data.services || [];
  renderAdminGallery();
  renderServicesAdmin();

  const map = {
    version: data.version || 'v1.6.9',
    businessName: data.businessName || '',
    tagline: data.tagline || '',
    heroHeadline: data.heroHeadline || '',
    heroText: data.heroText || '',
    welcomeTitle: data.welcomeTitle || '',
    welcomeText: data.welcomeText || '',
    aboutText: data.aboutText || '',
    mainLocName: data.mainLocation?.name || '',
    mainAddr1: data.mainLocation?.address1 || '',
    mainAddr2: data.mainLocation?.address2 || '',
    mainPhone: data.mainLocation?.phone || '',
    mainEmail: data.mainLocation?.email || '',
    mainMap: data.mainLocation?.mapsQuery || '',
    secondLocName: data.secondLocation?.name || '',
    secondAddr1: data.secondLocation?.address1 || '',
    secondAddr2: data.secondLocation?.address2 || '',
    secondPhone: data.secondLocation?.phone || '',
    secondEmail: data.secondLocation?.email || '',
    secondMap: data.secondLocation?.mapsQuery || '',
    accentColor: d.accentColor || '#c84e22',
    accentDark: d.accentDark || '#8d2a16',
    backgroundColor: d.backgroundColor || '#12080a',
    surfaceColor: d.surfaceColor || '#1a1012',
    textColor: d.textColor || '#f1e8d2',
    mutedColor: d.mutedColor || '#c8b59a',
    heroTitleSize: d.heroTitleSize || '4.5rem',
    sectionTitleSize: d.sectionTitleSize || '2.8rem',
    bodyTextSize: d.bodyTextSize || '1.08rem',
    navTextSize: d.navTextSize || '1rem'
  };

  Object.entries(map).forEach(([id,value]) => setVal(id, value));
}

function val(id){
  const el = document.getElementById(id);
  return el ? el.value : '';
}

function readForm(){
  return {
    ...(cachedContent || {}),
    version: val('version') || 'v1.6.9',
    businessName: val('businessName'),
    tagline: val('tagline'),
    heroHeadline: val('heroHeadline'),
    heroText: val('heroText'),
    welcomeTitle: val('welcomeTitle'),
    welcomeText: val('welcomeText'),
    aboutText: val('aboutText'),
    services: currentServices.map(s => String(s).trim()).filter(Boolean),
    restorationGallery: currentGallery,
    mainLocation: {
      name: val('mainLocName'),
      address1: val('mainAddr1'),
      address2: val('mainAddr2'),
      phone: val('mainPhone'),
      email: val('mainEmail'),
      mapsQuery: val('mainMap')
    },
    secondLocation: {
      name: val('secondLocName'),
      address1: val('secondAddr1'),
      address2: val('secondAddr2'),
      phone: val('secondPhone'),
      email: val('secondEmail'),
      mapsQuery: val('secondMap')
    },
    design: {
      accentColor: val('accentColor'),
      accentDark: val('accentDark'),
      backgroundColor: val('backgroundColor'),
      surfaceColor: val('surfaceColor'),
      textColor: val('textColor'),
      mutedColor: val('mutedColor'),
      heroTitleSize: val('heroTitleSize'),
      sectionTitleSize: val('sectionTitleSize'),
      bodyTextSize: val('bodyTextSize'),
      navTextSize: val('navTextSize')
    }
  };
}

async function saveContentToApi(data){
  const res = await fetch('/api/save-content', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'authorization': getAuthHeader()
    },
    body: JSON.stringify(data)
  });
  if(!res.ok){
    const payload = await res.json().catch(() => ({}));
    throw new Error(payload.error || 'Save failed');
  }
}

async function doSave(){
  const data = readForm();
  const saveMsg = document.getElementById('saveMsg');
  try {
    await saveContentToApi(data);
    localStorage.removeItem('memorialSiteContent');
    cachedContent = data;
    if(saveMsg) saveMsg.textContent = 'Changes saved to Cloudflare.';
  } catch(error) {
    localStorage.setItem('memorialSiteContent', JSON.stringify(data));
    if(saveMsg) saveMsg.textContent = 'Saved locally only. Cloudflare save failed: ' + error.message;
  }
}

function setupDropZone(zoneId, inputId, label){
  const zone = document.getElementById(zoneId);
  const input = document.getElementById(inputId);
  if(!zone || !input) return;
  zone.addEventListener('click', () => input.click());
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('dragover'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('dragover');
    if(e.dataTransfer.files.length){
      input.files = e.dataTransfer.files;
      const status = document.getElementById('galleryUploadMsg');
      if(status) status.textContent = `Selected ${label}: ${e.dataTransfer.files[0].name}`;
    }
  });
  input.addEventListener('change', () => {
    const status = document.getElementById('galleryUploadMsg');
    if(input.files && input.files[0] && status){
      status.textContent = `Selected ${label}: ${input.files[0].name}`;
    }
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  const loginForm = document.getElementById('loginForm');

  async function initEditor(){
    show('loginBox', false);
    show('editor', true);
    fillForm(await loadSiteContent());
    checkDiagnostics();
  }

  if(isLoggedIn()) initEditor();

  loginForm?.addEventListener('submit', e => {
    e.preventDefault();
    const creds = getCreds();
    const u = val('username');
    const p = val('password');
    const err = document.getElementById('loginError');
    if(u === creds.username && p === creds.password){
      sessionStorage.setItem('memorialAdminAuth', 'true');
      initEditor();
    } else {
      err.textContent = 'Incorrect username or password.';
    }
  });

  setupDropZone('dropZone', 'galleryFile', 'finished photo');
  setupDropZone('beforeDropZone', 'beforeGalleryFile', 'before photo');

  document.getElementById('addServiceBtn')?.addEventListener('click', () => {
    const input = document.getElementById('newServiceInput');
    const value = input.value.trim();
    if(!value) return;
    currentServices.push(value);
    input.value = '';
    renderServicesAdmin();
  });

  document.getElementById('uploadGalleryBtn')?.addEventListener('click', async () => {
    const title = val('galleryTitle').trim();
    const description = val('galleryDescription').trim();
    const status = document.getElementById('galleryUploadMsg');
    const afterFile = document.getElementById('galleryFile')?.files?.[0];
    const beforeFile = document.getElementById('beforeGalleryFile')?.files?.[0];

    if(!title || !afterFile){
      status.textContent = 'Add a title and choose the finished photo first.';
      return;
    }

    try {
      status.textContent = 'Preparing finished photo...';
      const afterData = await compressImageToDataUrl(afterFile, status);
      let beforeData = '';
      if(beforeFile){
        status.textContent = 'Preparing before photo...';
        beforeData = await compressImageToDataUrl(beforeFile, status);
      }

      currentGallery.unshift({
        title,
        description,
        image: afterData,
        beforeImage: beforeData
      });

      renderAdminGallery();

      setVal('galleryTitle', '');
      setVal('galleryDescription', '');
      setVal('galleryFile', '');
      setVal('beforeGalleryFile', '');

      status.textContent = 'Photo added. Saving changes...';
      await doSave();
      status.textContent = 'Photo uploaded and saved.';
    } catch(error) {
      status.textContent = 'Upload failed: ' + error.message;
    }
  });

  document.getElementById('saveBtn')?.addEventListener('click', doSave);
  document.getElementById('saveBtnBottom')?.addEventListener('click', doSave);
  document.getElementById('resetBtn')?.addEventListener('click', async () => {
    localStorage.removeItem('memorialSiteContent');
    fillForm(await loadSiteContent());
    const saveMsg = document.getElementById('saveMsg');
    if(saveMsg) saveMsg.textContent = 'Reset to current Cloudflare content.';
  });
  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    sessionStorage.removeItem('memorialAdminAuth');
    location.reload();
  });
});
