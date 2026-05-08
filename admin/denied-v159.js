
const SEEDED_TESTIMONIALS = [
  { name: "The Walker Family", location: "Oak Grove, LA", text: "They were kind, easy to work with, and did a beautiful job. Everything turned out just right, and that meant a lot to our family.", status: "approved" },
  { name: "B. Johnson", location: "Monroe, LA", text: "We wanted something done right and built to last, and that is exactly what we got. Good people, good work, and they treated us with respect the whole way through.", status: "approved" },
  { name: "The Thomas Family", location: "North Louisiana", text: "They helped us through the process without making it feel overwhelming. If you want folks that will treat you right and take pride in what they do, I would recommend them.", status: "approved" }
];

let cachedContent = null;
let currentDeniedTestimonials = [];

function byId(id){ return document.getElementById(id); }
function val(id){ const el = byId(id); return el ? el.value : ''; }
function setVal(id, value){ const el = byId(id); if(el) el.value = value || ''; }

function getCreds(){
  const saved = localStorage.getItem('memorialAdminCreds');
  if(saved){ try { return JSON.parse(saved); } catch(e) {} }
  return { username: '', password: '' };
}
function setCreds(username, password){
  localStorage.setItem('memorialAdminCreds', JSON.stringify({ username, password }));
}
function applyCredsToFields(){
  const creds = getCreds();
  setVal('ownerUsername', creds.username || '');
  setVal('ownerPassword', creds.password || '');
}
function getAuthHeader(){
  const uiUser = val('ownerUsername');
  const uiPass = val('ownerPassword');
  const stored = getCreds();
  const username = uiUser || stored.username || '';
  const password = uiPass || stored.password || '';
  return 'Basic ' + btoa(`${username}:${password}`);
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

async function loadSiteContent(){
  let bundled = {};
  try {
    const bundledRes = await fetch('../site-content.json?v=v1.6.0', { cache: 'no-store' });
    if(bundledRes.ok) bundled = await bundledRes.json();
  } catch(e) {}

  let cloudData = {};
  try {
    const apiRes = await fetch('/api/get-content?build=v1.6.0', { cache: 'no-store' });
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
    deniedTestimonials: pruneDeniedTestimonials(localData.deniedTestimonials || cloudData.deniedTestimonials || bundled.deniedTestimonials || []),
    testimonials: cloudData.testimonials || bundled.testimonials || SEEDED_TESTIMONIALS,
    pendingTestimonials: localData.pendingTestimonials || cloudData.pendingTestimonials || bundled.pendingTestimonials || []
  };
}

function fillDenied(data){
  cachedContent = data;
  currentDeniedTestimonials = pruneDeniedTestimonials(data.deniedTestimonials || []);
  renderDeniedTestimonials();
  const saveMsg = byId('saveMsg');
  if(saveMsg) saveMsg.textContent = 'Denied testimonials loaded.';
}

function readContent(){
  return {
    ...(cachedContent || {}),
    testimonials: cachedContent?.testimonials || SEEDED_TESTIMONIALS,
    pendingTestimonials: cachedContent?.pendingTestimonials || [],
    deniedTestimonials: pruneDeniedTestimonials(currentDeniedTestimonials).map(t => ({ ...t, status: 'denied' }))
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
  const data = readContent();
  const saveMsg = byId('saveMsg');
  try {
    await saveContentToApi(data);
    localStorage.removeItem('memorialSiteContent');
    cachedContent = data;
    if(saveMsg) saveMsg.textContent = 'Changes saved to Cloudflare.';
  } catch(error) {
    const local = localStorage.getItem('memorialSiteContent');
    let current = {};
    if(local){ try { current = JSON.parse(local); } catch(e) {} }
    current = { ...current, ...data };
    localStorage.setItem('memorialSiteContent', JSON.stringify(current));
    if(saveMsg) saveMsg.textContent = 'Saved locally only. Cloudflare save failed: ' + error.message;
  }
}

window.updateDeniedTestimonial = function(index, field, value){
  currentDeniedTestimonials[index][field] = value;
}

window.restoreDeniedToPending = async function(index){
  const item = currentDeniedTestimonials.splice(index, 1)[0];
  if(item){
    cachedContent.pendingTestimonials = cachedContent.pendingTestimonials || [];
    cachedContent.pendingTestimonials.unshift({
      name: item.name || '',
      location: item.location || '',
      text: item.text || '',
      status: 'pending'
    });
  }
  renderDeniedTestimonials();
  await doSave();
}

window.approveDeniedTestimonial = async function(index){
  const item = currentDeniedTestimonials.splice(index, 1)[0];
  if(item){
    cachedContent.testimonials = cachedContent.testimonials || SEEDED_TESTIMONIALS.slice();
    cachedContent.testimonials.unshift({
      name: item.name || '',
      location: item.location || '',
      text: item.text || '',
      status: 'approved'
    });
  }
  renderDeniedTestimonials();
  await doSave();
}

window.deleteDeniedNow = async function(index){
  currentDeniedTestimonials.splice(index, 1);
  renderDeniedTestimonials();
  await doSave();
}

function renderDeniedTestimonials(){
  const wrap = byId('deniedTestimonialsList');
  if(!wrap) return;
  if(!currentDeniedTestimonials.length){
    wrap.innerHTML = '<p class="small">No denied testimonials stored right now.</p>';
    return;
  }

  wrap.innerHTML = currentDeniedTestimonials.map((t, i) => {
    const initials = ((t.name || 'A').trim().split(/\s+/).map(x => x[0]).join('').slice(0,2) || 'A').toUpperCase();
    const deniedDate = t.deniedAt ? new Date(t.deniedAt).toLocaleDateString() : '';
    return `
      <div class="testimonial-admin-row">
        <div class="testimonial-row-avatar">${initials}</div>
        <div class="testimonial-row-main">
          <div class="testimonial-row-head">
            <strong>${t.name || 'Unnamed'}</strong>
            ${t.location ? `<span class="testimonial-row-location">${t.location}</span>` : ``}
            ${deniedDate ? `<span class="testimonial-row-location">Denied: ${deniedDate}</span>` : ``}
          </div>
          <textarea class="testimonial-row-text" oninput="updateDeniedTestimonial(${i}, 'text', this.value)">${String(t.text || '')}</textarea>
          <div class="testimonial-row-fields">
            <input value="${escapeAttr(t.name)}" placeholder="Name" oninput="updateDeniedTestimonial(${i}, 'name', this.value)" />
            <input value="${escapeAttr(t.location)}" placeholder="Location" oninput="updateDeniedTestimonial(${i}, 'location', this.value)" />
          </div>
        </div>
        <div class="testimonial-row-actions">
          <button class="btn btn-primary" type="button" onclick="restoreDeniedToPending(${i})">Restore to Pending</button>
          <button class="btn btn-secondary" type="button" onclick="approveDeniedTestimonial(${i})">Approve</button>
          <button class="btn btn-secondary" type="button" onclick="deleteDeniedNow(${i})">Delete</button>
        </div>
      </div>
    `;
  }).join('');
}

document.addEventListener('DOMContentLoaded', async () => {
  applyCredsToFields();
  const loaded = await loadSiteContent();
  fillDenied(loaded);

  byId('saveCredentialsBtn')?.addEventListener('click', () => {
    const username = val('ownerUsername');
    const password = val('ownerPassword');
    const msg = byId('authMsg');
    if(!username || !password){
      if(msg) msg.textContent = 'Enter both the owner username and password first.';
      return;
    }
    setCreds(username, password);
    if(msg) msg.textContent = 'Credentials saved in this browser.';
  });
});
