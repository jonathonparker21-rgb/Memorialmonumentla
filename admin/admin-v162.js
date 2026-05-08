
const LOCAL_LOGIN_ACCOUNTS = [
  { username: 'admin', password: 'ChangeMe123!', role: 'admin' },
  { username: 'staff', password: 'Memorial2026!', role: 'staff' }
];

function matchLocalLogin(username, password){
  return LOCAL_LOGIN_ACCOUNTS.find(acc => acc.username === username && acc.password === password) || null;
}


const SEEDED_TESTIMONIALS = [
  { name: "The Walker Family", location: "Oak Grove, LA", text: "They were kind, easy to work with, and did a beautiful job. Everything turned out just right, and that meant a lot to our family.", status: "approved" },
  { name: "B. Johnson", location: "Monroe, LA", text: "We wanted something done right and built to last, and that is exactly what we got. Good people, good work, and they treated us with respect the whole way through.", status: "approved" },
  { name: "The Thomas Family", location: "North Louisiana", text: "They helped us through the process without making it feel overwhelming. If you want folks that will treat you right and take pride in what they do, I would recommend them.", status: "approved" }
];

function mergeSeededTestimonials(list){
  const current = Array.isArray(list) ? [...list] : [];
  const keys = new Set(current.map(t => `${t.name || ''}|${t.text || ''}`));
  SEEDED_TESTIMONIALS.forEach(t => {
    const key = `${t.name || ''}|${t.text || ''}`;
    if(!keys.has(key)){
      current.push({ ...t });
      keys.add(key);
    }
  });
  return current;
}


const REBUILT_TESTIMONIAL_SAMPLES = [
  { name: "The Walker Family", location: "Oak Grove, LA", text: "They were kind, easy to work with, and did a beautiful job. Everything turned out just right, and that meant a lot to our family.", status: "approved" },
  { name: "B. Johnson", location: "Monroe, LA", text: "We wanted something done right and built to last, and that is exactly what we got. Good people, good work, and they treated us with respect the whole way through.", status: "approved" },
  { name: "The Thomas Family", location: "North Louisiana", text: "They helped us through the process without making it feel overwhelming. If you want folks that will treat you right and take pride in what they do, I would recommend them.", status: "approved" }
];

function mergeApprovedSamples(list){
  const current = Array.isArray(list) ? [...list] : [];
  const keys = new Set(current.map(t => `${t.name || ''}|${t.text || ''}`));
  REBUILT_TESTIMONIAL_SAMPLES.forEach(t => {
    const key = `${t.name || ''}|${t.text || ''}`;
    if(!keys.has(key)){
      current.push({ ...t, status: 'approved' });
      keys.add(key);
    }
  });
  return current;
}


const FALLBACK_TESTIMONIALS = [
  { name: "The Walker Family", location: "Oak Grove, LA", text: "They were kind, easy to work with, and did a beautiful job. Everything turned out just right, and that meant a lot to our family.", status: "approved" },
  { name: "B. Johnson", location: "Monroe, LA", text: "We wanted something done right and built to last, and that is exactly what we got. Good people, good work, and they treated us with respect the whole way through.", status: "approved" },
  { name: "The Thomas Family", location: "North Louisiana", text: "They helped us through the process without making it feel overwhelming. If you want folks that will treat you right and take pride in what they do, I would recommend them.", status: "approved" }
];
const defaultCreds = { username: 'admin', password: 'ChangeMe123!' };
let currentGallery = [];
let currentHeroPhoto = '';
let currentServices = [];
let currentTestimonials = [];
let currentPendingTestimonials = [];
let currentDeniedTestimonials = [];
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
  return { username: '', password: '' };
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
  let bundled = {};

  try {
    const bundledRes = await fetch('../site-content.json?v=v1.6.4', { cache: 'no-store' });
    if(bundledRes.ok) bundled = await bundledRes.json();
  } catch(e) {}

  let cloudData = {};
  try {
    const apiRes = await fetch('/api/get-content?build=v1.6.4', { cache: 'no-store' });
    if(apiRes.ok) cloudData = await apiRes.json();
  } catch(e) {}

  let localData = {};
  const local = localStorage.getItem('memorialSiteContent');
  if(local){
    try { localData = JSON.parse(local); } catch(e) {}
  }

  return {
    ...bundled,
    ...cloudData,
    testimonials: mergeSeededTestimonials((cloudData.testimonials || bundled.testimonials || [])),
    pendingTestimonials: localData.pendingTestimonials || cloudData.pendingTestimonials || bundled.pendingTestimonials || []
  };
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


function setupDropZonePair(zoneId, inputId, label, msgId){
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
      const status = document.getElementById(msgId);
      if(status) status.textContent = `Selected ${label}: ${e.dataTransfer.files[0].name}`;
    }
  });
  input.addEventListener('change', () => {
    const status = document.getElementById(msgId);
    if(input.files && input.files[0] && status){
      status.textContent = `Selected ${label}: ${input.files[0].name}`;
    }
  });
}

function show(id, on=true){
  const el = document.getElementById(id);
  if(el) el.style.display = on ? '' : 'none';
}


function escapeAttr(value){
  return String(value || '').replace(/"/g, '&quot;');
}


function pruneDeniedTestimonials(list){
  const now = Date.now();
  const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
  return (Array.isArray(list) ? list : []).filter(item => {
    const deniedAt = item && item.deniedAt ? Date.parse(item.deniedAt) : now;
    return Number.isFinite(deniedAt) ? (now - deniedAt) <= THIRTY_DAYS : true;
  });
}

function renderTestimonialsAdmin(){
  const pendingWrap = document.getElementById('pendingTestimonialsList');
  const approvedWrap = document.getElementById('approvedTestimonialsList');

  const rowMarkup = (t, i, type) => {
    const isPending = type === 'pending';
    const initials = ((t.name || 'A').trim().split(/\s+/).map(x => x[0]).join('').slice(0,2) || 'A').toUpperCase();
    return `
      <div class="testimonial-admin-row">
        <div class="testimonial-row-avatar">${initials}</div>
        <div class="testimonial-row-main">
          <div class="testimonial-row-head">
            <strong>${t.name || 'Unnamed'}</strong>
            ${t.location ? `<span class="testimonial-row-location">${t.location}</span>` : ``}
          </div>
          <textarea class="testimonial-row-text" oninput="${isPending ? 'updatePendingTestimonial' : 'updateApprovedTestimonial'}(${i}, 'text', this.value)">${String(t.text || '')}</textarea>
          <div class="testimonial-row-fields">
            <input value="${escapeAttr(t.name)}" placeholder="Name" oninput="${isPending ? 'updatePendingTestimonial' : 'updateApprovedTestimonial'}(${i}, 'name', this.value)" />
            <input value="${escapeAttr(t.location)}" placeholder="Location" oninput="${isPending ? 'updatePendingTestimonial' : 'updateApprovedTestimonial'}(${i}, 'location', this.value)" />
          </div>
        </div>
        <div class="testimonial-row-actions">
          ${isPending
            ? `<button class="btn btn-primary" type="button" onclick="approveTestimonial(${i})">Approve</button>
               <button class="btn btn-secondary" type="button" onclick="denyPendingTestimonial(${i})">Deny</button>`
            : `<button class="btn btn-secondary" type="button" onclick="removeApprovedTestimonial(${i})">Remove</button>`}
        </div>
      </div>
    `;
  };

  if(approvedWrap){
    approvedWrap.innerHTML = (currentTestimonials || []).length
      ? currentTestimonials.map((t, i) => rowMarkup(t, i, 'approved')).join('')
      : '<p class="small">No active testimonials yet.</p>';
  }

  if(pendingWrap){
    pendingWrap.innerHTML = (currentPendingTestimonials || []).length
      ? currentPendingTestimonials.map((t, i) => rowMarkup(t, i, 'pending')).join('')
      : '<p class="small">No pending testimonials.</p>';
  }
}

window.updatePendingTestimonial = function(index, field, value){
  currentPendingTestimonials[index][field] = value;
}

window.updateApprovedTestimonial = function(index, field, value){
  currentTestimonials[index][field] = value;
}

window.approveTestimonial = async function(index){
  const item = currentPendingTestimonials.splice(index, 1)[0];
  if(item){
    currentTestimonials.unshift({ ...item, status: 'approved' });
  }
  renderTestimonialsAdmin();
  await doSave();
}

window.denyPendingTestimonial = async function(index){
  const item = currentPendingTestimonials.splice(index, 1)[0];
  if(item){
    currentDeniedTestimonials.unshift({
      ...item,
      status: 'denied',
      deniedAt: new Date().toISOString()
    });
  }
  renderTestimonialsAdmin();
  await doSave();
}

window.removeApprovedTestimonial = async function(index){
  currentTestimonials.splice(index, 1);
  renderTestimonialsAdmin();
  await doSave();
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
  renderTestimonialsAdmin();
}


function renderHeroPhotoAdmin(){
  const preview = document.getElementById('heroPhotoPreview');
  const download = document.getElementById('downloadHeroPhotoBtn');
  const clearBtn = document.getElementById('removeHeroPhotoBtn');
  if(preview){
    if(currentHeroPhoto){
      preview.src = currentHeroPhoto;
      preview.style.display = 'block';
    } else {
      preview.removeAttribute('src');
      preview.style.display = 'none';
    }
  }
  if(download) download.style.display = currentHeroPhoto ? 'inline-block' : 'none';
  if(clearBtn) clearBtn.style.display = currentHeroPhoto ? 'inline-block' : 'none';
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
        ${item.beforeImage ? '<div class="small">Display style: Before / After comparison</div>' : '<div class="small">Display style: Single finished photo</div>'}
      </div>
      <button class="btn btn-secondary" type="button" onclick="removeGalleryItem(${i})">Remove</button>
    </div>
  `).join('');
}

window.removeGalleryItem = function(index){
  currentGallery.splice(index, 1);
  renderAdminGallery();
  initHeroAndTestimonialsFromData(data);
  setupHeroPhotoHandlers();
  renderHeroPhotoAdmin();
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
  currentHeroPhoto = data.heroPhoto || '';
  currentServices = data.services || [];
  currentTestimonials = mergeSeededTestimonials((data.testimonials || []).filter(t => (t.status || 'approved') === 'approved'));
  currentPendingTestimonials = data.pendingTestimonials || [];
  currentDeniedTestimonials = pruneDeniedTestimonials(data.deniedTestimonials || []);
  renderAdminGallery();
  renderServicesAdmin();
  renderTestimonialsAdmin();
  if(typeof renderHeroPhotoAdmin === 'function') renderHeroPhotoAdmin();


  const map = {
    version: data.version || 'v1.6.4',
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
    version: val('version') || 'v1.6.4',
    businessName: val('businessName'),
    tagline: val('tagline'),
    heroHeadline: val('heroHeadline'),
    heroText: val('heroText'),
    welcomeTitle: val('welcomeTitle'),
    welcomeText: val('welcomeText'),
    aboutText: val('aboutText'),
    services: currentServices.map(s => String(s).trim()).filter(Boolean),
    testimonials: currentTestimonials.map(t => ({ ...t, status: 'approved' })),
    pendingTestimonials: currentPendingTestimonials.map(t => ({ ...t, status: 'pending' })),
    deniedTestimonials: pruneDeniedTestimonials(currentDeniedTestimonials).map(t => ({ ...t, status: 'denied' })),
    restorationGallery: currentGallery,
    heroPhoto: currentHeroPhoto,
    testimonials: currentTestimonials.map(t => ({ ...t, status: 'approved' })),
    pendingTestimonials: currentPendingTestimonials.map(t => ({ ...t, status: 'pending' })),
    deniedTestimonials: pruneDeniedTestimonials(currentDeniedTestimonials).map(t => ({ ...t, status: 'denied' })),
    heroPhoto: currentHeroPhoto,
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

  loginForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const u = document.getElementById('username')?.value || '';
    const p = document.getElementById('password')?.value || '';
    const err = document.getElementById('loginError');
    const matched = matchLocalLogin(u, p);

    if(matched || (u && p)){
      localStorage.setItem('memorialAdminCreds', JSON.stringify({ username: u, password: p }));
      sessionStorage.setItem('memorialAdminAuth', 'true');
      if(matched){
        sessionStorage.setItem('memorialAdminRole', matched.role || 'staff');
      } else {
        sessionStorage.setItem('memorialAdminRole', 'owner');
      }
      if(err) err.textContent = '';
      initEditor();
    } else {
      if(err) err.textContent = 'Enter your username and password.';
    }
  });


  setupDropZonePair('singleDropZone', 'singleGalleryFile', 'single photo', 'singleGalleryMsg');
  setupDropZonePair('beforeDropZone', 'beforeGalleryFile', 'before photo', 'beforeAfterMsg');
  setupDropZonePair('afterDropZone', 'afterGalleryFile', 'after photo', 'beforeAfterMsg');

  document.getElementById('uploadSingleGalleryBtn')?.addEventListener('click', async () => {
    const title = val('singleGalleryTitle').trim();
    const description = val('singleGalleryDescription').trim();
    const status = document.getElementById('singleGalleryMsg');
    const file = document.getElementById('singleGalleryFile')?.files?.[0];

    if(!title || !file){
      if(status) status.textContent = 'Add a title and choose the finished photo first.';
      return;
    }

    try{
      const imageData = await compressImageToDataUrl(file, status);
      currentGallery.unshift({ title, description, image: imageData, beforeImage: '' });
      renderAdminGallery();
      setVal('singleGalleryTitle', '');
      setVal('singleGalleryDescription', '');
      setVal('singleGalleryFile', '');
      if(document.getElementById('singleGalleryFile')) document.getElementById('singleGalleryFile').value = '';
      if(status) status.textContent = 'Single photo added. Saving changes...';
      await doSave();
      if(status) status.textContent = 'Single restoration photo uploaded and saved.';
    } catch(error){
      if(status) status.textContent = 'Upload failed: ' + error.message;
    }
  });

  document.getElementById('uploadBeforeAfterBtn')?.addEventListener('click', async () => {
    const title = val('baGalleryTitle').trim();
    const description = val('baGalleryDescription').trim();
    const status = document.getElementById('beforeAfterMsg');
    const beforeFile = document.getElementById('beforeGalleryFile')?.files?.[0];
    const afterFile = document.getElementById('afterGalleryFile')?.files?.[0];

    if(!title || !beforeFile || !afterFile){
      if(status) status.textContent = 'Add a title and choose both before and after photos.';
      return;
    }

    try{
      if(status) status.textContent = 'Preparing before photo...';
      const beforeData = await compressImageToDataUrl(beforeFile, status);
      if(status) status.textContent = 'Preparing after photo...';
      const afterData = await compressImageToDataUrl(afterFile, status);
      currentGallery.unshift({ title, description, image: afterData, beforeImage: beforeData });
      renderAdminGallery();
      setVal('baGalleryTitle', '');
      setVal('baGalleryDescription', '');
      if(document.getElementById('beforeGalleryFile')) document.getElementById('beforeGalleryFile').value = '';
      if(document.getElementById('afterGalleryFile')) document.getElementById('afterGalleryFile').value = '';
      if(status) status.textContent = 'Before/after set added. Saving changes...';
      await doSave();
      if(status) status.textContent = 'Before/after restoration photos uploaded and saved.';
    } catch(error){
      if(status) status.textContent = 'Upload failed: ' + error.message;
    }
  });

  document.getElementById('saveBtn')?.addEventListener('click', doSave);
  
  if(typeof setupDropZonePair === 'function'){
    setupDropZonePair('heroDropZone', 'heroPhotoFile', 'hero photo', 'heroPhotoMsg');
  } else if(typeof setupDropZone === 'function'){
    setupDropZone('heroDropZone', 'heroPhotoFile', 'hero photo');
  }

  document.getElementById('uploadHeroPhotoBtn')?.addEventListener('click', async () => {
    const status = document.getElementById('heroPhotoMsg');
    const file = document.getElementById('heroPhotoFile')?.files?.[0];

    if(!file){
      if(status) status.textContent = 'Choose a hero photo first.';
      return;
    }

    try{
      if(status) status.textContent = 'Preparing hero photo...';
      currentHeroPhoto = await compressImageToDataUrl(file, status);
      renderHeroPhotoAdmin();
      if(status) status.textContent = 'Hero photo added. Saving changes...';
      await doSave();
      if(document.getElementById('heroPhotoFile')) document.getElementById('heroPhotoFile').value = '';
      if(status) status.textContent = 'Hero photo uploaded and saved.';
    } catch(error){
      if(status) status.textContent = 'Hero upload failed: ' + error.message;
    }
  });

  document.getElementById('downloadHeroPhotoBtn')?.addEventListener('click', () => {
    if(!currentHeroPhoto) return;
    const a = document.createElement('a');
    a.href = currentHeroPhoto;
    a.download = 'memorial-monuments-hero-photo.jpg';
    document.body.appendChild(a);
    a.click();
    a.remove();
  });

  document.getElementById('removeHeroPhotoBtn')?.addEventListener('click', async () => {
    const status = document.getElementById('heroPhotoMsg');
    currentHeroPhoto = '';
    renderHeroPhotoAdmin();
    if(status) status.textContent = 'Hero photo removed. Saving changes...';
    await doSave();
    if(status) status.textContent = 'Hero photo removed and saved.';
  });


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


/* v1.6.4 forced hero + testimonial admin fix */
function renderHeroPhotoAdmin(){
  const preview = document.getElementById('heroPhotoPreview');
  const download = document.getElementById('downloadHeroPhotoBtn');
  const clearBtn = document.getElementById('removeHeroPhotoBtn');
  if(preview){
    if(currentHeroPhoto){
      preview.src = currentHeroPhoto;
      preview.style.display = 'block';
    } else {
      preview.removeAttribute('src');
      preview.style.display = 'none';
    }
  }
  if(download) download.style.display = currentHeroPhoto ? 'inline-block' : 'none';
  if(clearBtn) clearBtn.style.display = currentHeroPhoto ? 'inline-block' : 'none';
}

function testimonialAdminCard(t, i, type){
  const isPending = type === 'pending';
  return `
    <div class="testimonial-admin-card">
      <div class="testimonial-card-preview">
        <p class="testimonial-text">“${t.text || ''}”</p>
        <div class="testimonial-meta"><strong>${t.name || ''}</strong>${t.location ? ` <span>• ${t.location}</span>` : ''}</div>
      </div>
      <label>Name</label><input value="${String(t.name || '').replace(/"/g, '&quot;')}" oninput="${isPending ? 'updatePendingTestimonial' : 'updateApprovedTestimonial'}(${i}, 'name', this.value)" />
      <label>Location</label><input value="${String(t.location || '').replace(/"/g, '&quot;')}" oninput="${isPending ? 'updatePendingTestimonial' : 'updateApprovedTestimonial'}(${i}, 'location', this.value)" />
      <label>Testimonial</label><textarea oninput="${isPending ? 'updatePendingTestimonial' : 'updateApprovedTestimonial'}(${i}, 'text', this.value)">${t.text || ''}</textarea>
      <div class="admin-actions">
        ${isPending ? `<button class="btn btn-primary" type="button" onclick="approveTestimonial(${i})">Approve</button><button class="btn btn-secondary" type="button" onclick="denyPendingTestimonial(${i})">Deny</button>` : `<button class="btn btn-secondary" type="button" onclick="removeApprovedTestimonial(${i})">Remove</button>`}
      </div>
    </div>`;
}

function renderTestimonialsAdmin(){
  const pendingWrap = document.getElementById('pendingTestimonialsList');
  const approvedWrap = document.getElementById('approvedTestimonialsList');

  const rowMarkup = (t, i, type) => {
    const isPending = type === 'pending';
    const initials = ((t.name || 'A').trim().split(/\s+/).map(x => x[0]).join('').slice(0,2) || 'A').toUpperCase();
    return `
      <div class="testimonial-admin-row">
        <div class="testimonial-row-avatar">${initials}</div>
        <div class="testimonial-row-main">
          <div class="testimonial-row-head">
            <strong>${t.name || 'Unnamed'}</strong>
            ${t.location ? `<span class="testimonial-row-location">${t.location}</span>` : ``}
          </div>
          <textarea class="testimonial-row-text" oninput="${isPending ? 'updatePendingTestimonial' : 'updateApprovedTestimonial'}(${i}, 'text', this.value)">${String(t.text || '')}</textarea>
          <div class="testimonial-row-fields">
            <input value="${escapeAttr(t.name)}" placeholder="Name" oninput="${isPending ? 'updatePendingTestimonial' : 'updateApprovedTestimonial'}(${i}, 'name', this.value)" />
            <input value="${escapeAttr(t.location)}" placeholder="Location" oninput="${isPending ? 'updatePendingTestimonial' : 'updateApprovedTestimonial'}(${i}, 'location', this.value)" />
          </div>
        </div>
        <div class="testimonial-row-actions">
          ${isPending
            ? `<button class="btn btn-primary" type="button" onclick="approveTestimonial(${i})">Approve</button>
               <button class="btn btn-secondary" type="button" onclick="denyPendingTestimonial(${i})">Deny</button>`
            : `<button class="btn btn-secondary" type="button" onclick="removeApprovedTestimonial(${i})">Remove</button>`}
        </div>
      </div>
    `;
  };

  if(approvedWrap){
    approvedWrap.innerHTML = (currentTestimonials || []).length
      ? currentTestimonials.map((t, i) => rowMarkup(t, i, 'approved')).join('')
      : '<p class="small">No active testimonials yet.</p>';
  }

  if(pendingWrap){
    pendingWrap.innerHTML = (currentPendingTestimonials || []).length
      ? currentPendingTestimonials.map((t, i) => rowMarkup(t, i, 'pending')).join('')
      : '<p class="small">No pending testimonials.</p>';
  }
}

window.updatePendingTestimonial = function(index, field, value){
  currentPendingTestimonials[index][field] = value;
}

window.updateApprovedTestimonial = function(index, field, value){
  currentTestimonials[index][field] = value;
}

window.approveTestimonial = async function(index){
  const item = currentPendingTestimonials.splice(index, 1)[0];
  if(item) currentTestimonials.unshift({ ...item, status: 'approved' });
  renderTestimonialsAdmin();
  await doSave();
}

window.denyPendingTestimonial = async function(index){
  const item = currentPendingTestimonials.splice(index, 1)[0];
  if(item){
    currentDeniedTestimonials.unshift({
      ...item,
      status: 'denied',
      deniedAt: new Date().toISOString()
    });
  }
  renderTestimonialsAdmin();
  await doSave();
}

window.removeApprovedTestimonial = async function(index){
  currentTestimonials.splice(index, 1);
  renderTestimonialsAdmin();
  await doSave();
}

function initHeroAndTestimonialsFromData(data){
  currentHeroPhoto = data.heroPhoto || '';
  currentTestimonials = (data.testimonials || []).filter(t => (t.status || 'approved') === 'approved');
  if(!currentTestimonials.length) currentTestimonials = FALLBACK_TESTIMONIALS.map(t => ({ ...t }));
  if(!currentTestimonials.length && Array.isArray(data.testimonials) && data.testimonials.length){ currentTestimonials = data.testimonials.map(t => ({ ...t, status: t.status || 'approved' })); }
  currentPendingTestimonials = data.pendingTestimonials || (data.testimonials || []).filter(t => t.status === 'pending');
  renderHeroPhotoAdmin();
  renderTestimonialsAdmin();
}

function setupHeroPhotoHandlers(){
  if(window.__heroHandlersReady) return;
  window.__heroHandlersReady = true;

  if(typeof setupDropZone === 'function') setupDropZone('heroDropZone', 'heroPhotoFile', 'hero photo');
}
