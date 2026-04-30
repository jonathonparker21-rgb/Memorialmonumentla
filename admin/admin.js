const defaultCreds = { username: 'admin', password: 'ChangeMe123!' };
let currentGallery = [];
let cachedContent = null;

function normalizeImageUrl(url){
  if(!url) return '';
  return url
    .replace('/api/image/restoration%2F', '/api/image/restoration/')
    .replace('/api/image/restoration%2f', '/api/image/restoration/');
}




function isHeicFile(file){
  const name = (file?.name || '').toLowerCase();
  const type = (file?.type || '').toLowerCase();
  return name.endsWith('.heic') || name.endsWith('.heif') || type.includes('heic') || type.includes('heif');
}

async function prepareUploadFile(file, status){
  if(!file) return file;

  if(isHeicFile(file)){
    if(status) status.textContent = 'Converting HEIC photo to JPEG...';

    if(typeof heic2any === 'undefined'){
      throw new Error('HEIC converter did not load. Convert the photo to JPG first, then upload again.');
    }

    const converted = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.9
    });

    const blob = Array.isArray(converted) ? converted[0] : converted;
    const newName = (file.name || 'photo.heic').replace(/\.(heic|heif)$/i, '.jpg');

    return new File([blob], newName, { type: 'image/jpeg' });
  }

  return file;
}


function getCreds(){
  const saved = localStorage.getItem('memorialAdminCreds');
  if(saved){ try { return JSON.parse(saved); } catch(e) {} }
  return defaultCreds;
}
function getAuthHeader() {
  const creds = getCreds();
  return 'Basic ' + btoa(`${creds.username}:${creds.password}`);
}
function isLoggedIn(){ return sessionStorage.getItem('memorialAdminAuth') === 'true'; }

async function loadSiteContent(){
  const local = localStorage.getItem('memorialSiteContent');
  if(local){ try { return JSON.parse(local); } catch(e) {} }

  try {
    const res = await fetch('/api/get-content', { cache: 'no-store' });
    if (res.ok) return await res.json();
  } catch (e) {}

  const res = await fetch('../site-content.json', { cache: 'no-store' });
  return await res.json();
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
    if(!d.RESTORATION_IMAGES) missing.push('RESTORATION_IMAGES');
    if(!d.OWNER_USERNAME) missing.push('OWNER_USERNAME');
    if(!d.OWNER_PASSWORD) missing.push('OWNER_PASSWORD');

    if(missing.length){
      out.textContent = 'Missing or inactive: ' + missing.join(', ') + '. Add bindings/variables and redeploy.';
    } else {
      out.textContent = 'Cloudflare bindings look ready.';
    }
  } catch(error) {
    out.textContent = 'Diagnostics endpoint not available. Make sure the functions folder is deployed at the project root.';
  }
}

function show(id, on=true){
  const el = document.getElementById(id);
  if(el) el.style.display = on ? '' : 'none';
}

function renderAdminGallery(){
  const wrap = document.getElementById('adminGalleryList');
  if(!wrap) return;
  wrap.innerHTML = (currentGallery || []).map((item, i) => `
    <div class="admin-gallery-item">
      <img src="${normalizeImageUrl(item.image)}" alt="${item.title}">
      <div>
        <strong>${item.title}</strong>
        <div class="small">${item.description || ''}</div>
      </div>
      <button class="btn btn-secondary" type="button" onclick="removeGalleryItem(${i})">Remove</button>
    </div>
  `).join('');
}

window.removeGalleryItem = async function(index){
  const item = currentGallery[index];
  if (!item) return;
  if (item.key) {
    try {
      await fetch('/api/delete-image', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'authorization': getAuthHeader()
        },
        body: JSON.stringify({ key: item.key })
      });
    } catch (e) {}
  }
  currentGallery.splice(index, 1);
  renderAdminGallery();
}

function fillForm(data){
  cachedContent = data;
  const d = data.design || {};
  currentGallery = data.restorationGallery || [];
  renderAdminGallery();

  const map = {
    version: data.version || 'v1.2.6',
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
    service1: data.services?.[0] || '',
    service2: data.services?.[1] || '',
    service3: data.services?.[2] || '',
    service4: data.services?.[3] || '',
    service5: data.services?.[4] || '',
    service6: data.services?.[5] || '',
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

  Object.entries(map).forEach(([id,val]) => {
    const el = document.getElementById(id);
    if(el) el.value = val;
  });
}

function readForm(){
  return {
    ...(cachedContent || {}),
    version: document.getElementById('version').value || 'v1.2.6',
    businessName: document.getElementById('businessName').value,
    tagline: document.getElementById('tagline').value,
    heroHeadline: document.getElementById('heroHeadline').value,
    heroText: document.getElementById('heroText').value,
    welcomeTitle: document.getElementById('welcomeTitle').value,
    welcomeText: document.getElementById('welcomeText').value,
    aboutText: document.getElementById('aboutText').value,
    services: [1,2,3,4,5,6].map(i => document.getElementById('service'+i).value).filter(Boolean),
    restorationGallery: currentGallery,
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

async function saveContentToApi(data) {
  const res = await fetch('/api/save-content', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'authorization': getAuthHeader()
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
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

document.addEventListener('DOMContentLoaded', async () => {
  const loginForm = document.getElementById('loginForm');

  async function initEditor(){
    show('loginBox', false);
    show('editor', true);
    fillForm(await loadSiteContent());
    checkDiagnostics();
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

  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('galleryFile');

  if(dropZone && fileInput){
    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
      if(e.dataTransfer.files.length){
        fileInput.files = e.dataTransfer.files;
        const status = document.getElementById('galleryUploadMsg');
        if(status) status.textContent = `Selected: ${e.dataTransfer.files[0].name}`;
      }
    });

    fileInput.addEventListener('change', () => {
      const status = document.getElementById('galleryUploadMsg');
      if(fileInput.files && fileInput.files[0] && status){
        status.textContent = `Selected: ${fileInput.files[0].name}`;
      }
    });
  }

  document.getElementById('uploadGalleryBtn')?.addEventListener('click', async () => {
    const title = document.getElementById('galleryTitle').value.trim();
    const description = document.getElementById('galleryDescription').value.trim();
    const status = document.getElementById('galleryUploadMsg');
    let file = document.getElementById('galleryFile')?.files?.[0];

    if(!title || !file){
      status.textContent = 'Add a title and choose a photo first.';
      return;
    }

    status.textContent = 'Uploading...';
    file = await prepareUploadFile(file, status);

    const form = new FormData();
    form.append('file', file);

    try {
      const res = await fetch('/api/upload-image', {
        method: 'POST',
        headers: { 'authorization': getAuthHeader() },
        body: form
      });
      const payload = await res.json().catch(() => ({ error: 'Upload returned non-JSON response.' }));
      if(!res.ok || !payload.url) throw new Error(payload.error || `Upload failed with status ${res.status}`);

      currentGallery.unshift({
        title,
        description,
        image: normalizeImageUrl(payload.url),
        key: payload.key
      });
      renderAdminGallery();

      document.getElementById('galleryTitle').value = '';
      document.getElementById('galleryDescription').value = '';
      document.getElementById('galleryFile').value = '';
      status.textContent = 'Photo uploaded. Click Save Changes to publish it. HEIC photos are converted to JPEG automatically.';
    } catch(error) {
      status.textContent = 'Upload failed: ' + error.message;
      checkDiagnostics();
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
