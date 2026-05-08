
function renderHeroPhoto(data){
  const heroPhotoEl = document.getElementById('heroPhotoImage');
  const heroPhotoBox = document.getElementById('heroPhotoBox');
  if(!heroPhotoEl || !heroPhotoBox) return;

  const hero = (data && typeof data.heroPhoto === 'string') ? data.heroPhoto.trim() : '';

  if(hero){
    heroPhotoEl.src = hero;
    heroPhotoEl.style.display = 'block';
    heroPhotoBox.classList.add('has-photo');
  } else {
    heroPhotoEl.removeAttribute('src');
    heroPhotoEl.style.display = 'none';
    heroPhotoBox.classList.remove('has-photo');
  }
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

function mergeContentWithLocal(data){
  const local = localStorage.getItem('memorialSiteContent');
  if(!local) return data;
  try{
    const localData = JSON.parse(local);
    return {
      ...data,
      ...localData,
      testimonials: mergeApprovedSamples(localData.testimonials || data.testimonials || []),
      pendingTestimonials: localData.pendingTestimonials || data.pendingTestimonials || []
    };
  } catch(e){
    return data;
  }
}


const FALLBACK_TESTIMONIALS = [
  { name: "The Walker Family", location: "Oak Grove, LA", text: "They were kind, easy to work with, and did a beautiful job. Everything turned out just right, and that meant a lot to our family.", status: "approved" },
  { name: "B. Johnson", location: "Monroe, LA", text: "We wanted something done right and built to last, and that is exactly what we got. Good people, good work, and they treated us with respect the whole way through.", status: "approved" },
  { name: "The Thomas Family", location: "North Louisiana", text: "They helped us through the process without making it feel overwhelming. If you want folks that will treat you right and take pride in what they do, I would recommend them.", status: "approved" }
];
/* FORCE_REFRESH_BUILD v1.7.1 2026-04-29 13:10:31 */
const BUILD_VERSION = 'v1.7.1';

function versionNumber(v){
  return String(v || 'v0.0.0').replace(/^v/, '').split('.').map(n => parseInt(n, 10) || 0);
}
function isOlderVersion(a, b){
  const av = versionNumber(a);
  const bv = versionNumber(b);
  for(let i=0; i<3; i++){
    if(av[i] < bv[i]) return true;
    if(av[i] > bv[i]) return false;
  }
  return false;
}

async function loadBundledContent(){
  const res = await fetch('site-content.json?v=v1.7.1', { cache: 'no-store' });
  return await res.json();
}

async function loadContent(){
  const bundled = await loadBundledContent();

  try {
    const apiRes = await fetch('/api/get-content?build=v1.7.1&t=' + Date.now(), { cache: 'no-store' });
    if (apiRes.ok) {
      const apiData = await apiRes.json();
      return { ...bundled, ...apiData, version: apiData.version || bundled.version };
    }
  } catch (e) {}

  return bundled;
}

function mapSrc(q){ return 'https://www.google.com/maps?q=' + encodeURIComponent(q) + '&output=embed'; }
function setupChat(){
  const btn = document.getElementById('chatToggle');
  const panel = document.getElementById('chatPanel');
  if(btn && panel){
    btn.addEventListener('click', () => panel.classList.toggle('active'));
  }
}
function setupNav(){
  const btn = document.getElementById('mobileNavToggle');
  const menu = document.getElementById('siteNav');
  if(btn && menu){
    btn.addEventListener('click', () => {
      menu.classList.toggle('open');
      btn.textContent = menu.classList.contains('open') ? 'Close' : 'Menu';
    });
  }
}
function setupYear(){ const y = document.getElementById('year'); if(y) y.textContent = new Date().getFullYear(); }
function applyDesign(design = {}){
  const root = document.documentElement;
  const map = {
    '--accent': design.accentColor,
    '--accent-dark': design.accentDark,
    '--bg': design.backgroundColor,
    '--surface': design.surfaceColor,
    '--text': design.textColor,
    '--muted': design.mutedColor,
    '--hero-title-size': design.heroTitleSize,
    '--section-title-size': design.sectionTitleSize,
    '--body-text-size': design.bodyTextSize,
    '--nav-text-size': design.navTextSize,
  };
  Object.entries(map).forEach(([key, value]) => { if(value) root.style.setProperty(key, value); });
}
function testimonialCard(t){
  const location = t.location ? ` <span>• ${t.location}</span>` : '';
  return `<article class="testimonial-card"><p class="testimonial-text">“${t.text}”</p><div class="testimonial-meta"><strong>${t.name}</strong>${location}</div></article>`;
}
function renderHomeTestimonials(data){
  const track = document.getElementById('testimonialTrack');
  if(!track) return;
  const items = mergeApprovedSamples((data.testimonials || []).filter(t => (t.status || 'approved') === 'approved'));
  track.innerHTML = items.concat(items).map(testimonialCard).join('');
}
function renderTestimonialsPage(data){
  const wrap = document.getElementById('allTestimonials');
  if(!wrap) return;
  const items = mergeApprovedSamples((data.testimonials || []).filter(t => (t.status || 'approved') === 'approved'));
  wrap.innerHTML = items.map(testimonialCard).join('');
}











function galleryCard(item, index){
  const afterImg = item.image || '';
  const beforeImg = item.beforeImage || '';
  const safeTitle = item.title || 'Restoration Work';

  if(!afterImg) return '';

  if(beforeImg){
    return `<article class="restoration-card restoration-card-ba">
      <div class="ba-wrap pro-ba-wrap" data-ba-wrap onclick="openRestorationLightbox(${index})" style="cursor:zoom-in;">
        <img class="ba-img ba-after" src="${afterImg}" alt="${safeTitle} after" loading="lazy">
        <div class="ba-before-layer" style="width:50%;">
          <img class="ba-img ba-before" src="${beforeImg}" alt="${safeTitle} before" loading="lazy">
        </div>
        <div class="ba-divider"></div>
        <div class="ba-label ba-label-before">Before</div>
        <div class="ba-label ba-label-after">After</div>
        <input class="ba-slider" type="range" min="0" max="100" value="50" aria-label="Before and after comparison" onclick="event.stopPropagation()">
      </div>
      <div class="restoration-copy">
        <h3>${safeTitle}</h3>
        <p>${item.description || ''}</p>
        <button class="btn btn-secondary restoration-enlarge-btn" type="button" onclick="openRestorationLightbox(${index})">View Larger</button>
      </div>
    </article>`;
  }

  return `<article class="restoration-card restoration-card-single">
    <div class="single-restoration-media" onclick="openRestorationLightbox(${index})" style="cursor:zoom-in;">
      <img src="${afterImg}" alt="${safeTitle}" loading="lazy" onerror="this.closest('.restoration-card').remove();">
      <div class="single-photo-badge">Completed Work</div>
    </div>
    <div class="restoration-copy">
      <h3>${safeTitle}</h3>
      <p>${item.description || ''}</p>
      <button class="btn btn-secondary restoration-enlarge-btn" type="button" onclick="openRestorationLightbox(${index})">View Larger</button>
    </div>
  </article>`;
}

function setupBeforeAfterSliders(){
  document.querySelectorAll('[data-ba-wrap]').forEach(wrap => {
    const slider = wrap.querySelector('.ba-slider');
    const beforeLayer = wrap.querySelector('.ba-before-layer');
    const divider = wrap.querySelector('.ba-divider');
    if(!slider || !beforeLayer || slider.dataset.ready === 'true') return;
    slider.dataset.ready = 'true';

    const update = () => {
      beforeLayer.style.width = `${slider.value}%`;
      if(divider) divider.style.left = `${slider.value}%`;
    };

    slider.addEventListener('input', update);
    update();
  });
}

function renderRestorationGallery(data){
  const track = document.getElementById('restorationTrack');
  if(!track) return;
  window.currentRestorationGallery = data.restorationGallery || [];
  track.innerHTML = (data.restorationGallery || []).map((item, index) => galleryCard(item, index)).join('');
}

window.currentRestorationGallery = window.currentRestorationGallery || [];

window.openRestorationLightbox = function(index){
  const items = window.currentRestorationGallery || [];
  const item = items[index];
  if(!item) return;

  const box = document.getElementById('restorationLightbox');
  const title = document.getElementById('restorationLightboxTitle');
  const desc = document.getElementById('restorationLightboxDescription');
  const singleWrap = document.getElementById('restorationLightboxSingle');
  const singleImg = document.getElementById('restorationLightboxSingleImage');
  const baWrap = document.getElementById('restorationLightboxBA');
  const baBeforeLayer = document.getElementById('restorationLightboxBeforeLayer');
  const baBeforeImg = document.getElementById('restorationLightboxBeforeImage');
  const baAfterImg = document.getElementById('restorationLightboxAfterImage');
  const baDivider = document.getElementById('restorationLightboxDivider');
  const baSlider = document.getElementById('restorationLightboxSlider');

  if(!box) return;

  const afterImg = item.image || '';
  const beforeImg = item.beforeImage || '';

  if(title) title.textContent = item.title || 'Restoration Work';
  if(desc) desc.textContent = item.description || '';

  if(beforeImg){
    if(singleWrap) singleWrap.style.display = 'none';
    if(baWrap) baWrap.style.display = 'block';
    if(baAfterImg) baAfterImg.src = afterImg;
    if(baBeforeImg) baBeforeImg.src = beforeImg;
    if(baBeforeLayer) baBeforeLayer.style.width = '50%';
    if(baDivider) baDivider.style.left = '50%';
    if(baSlider){
      baSlider.value = '50';
      baSlider.oninput = () => {
        if(baBeforeLayer) baBeforeLayer.style.width = `${baSlider.value}%`;
        if(baDivider) baDivider.style.left = `${baSlider.value}%`;
      };
    }
  } else {
    if(baWrap) baWrap.style.display = 'none';
    if(singleWrap) singleWrap.style.display = 'block';
    if(singleImg) singleImg.src = afterImg;
  }

  box.classList.add('active');
  document.body.classList.add('modal-open');
};

window.closeRestorationLightbox = function(){
  const box = document.getElementById('restorationLightbox');
  const singleImg = document.getElementById('restorationLightboxSingleImage');
  const baBeforeImg = document.getElementById('restorationLightboxBeforeImage');
  const baAfterImg = document.getElementById('restorationLightboxAfterImage');

  if(box) box.classList.remove('active');
  document.body.classList.remove('modal-open');
  if(singleImg) singleImg.removeAttribute('src');
  if(baBeforeImg) baBeforeImg.removeAttribute('src');
  if(baAfterImg) baAfterImg.removeAttribute('src');
};


function setupReviewForm(data){
  const form = document.getElementById('reviewForm');
  if(!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = form.querySelector('[name="review_name"]').value.trim();
    const location = form.querySelector('[name="review_location"]').value.trim();
    const text = form.querySelector('[name="review_text"]').value.trim();
    if(!name || !text) return;

    const local = localStorage.getItem('memorialSiteContent');
    let current = data;
    if(local){ try { current = JSON.parse(local); } catch(e) {} }

    current.testimonials = mergeApprovedSamples(current.testimonials || data.testimonials || []);
    current.pendingTestimonials = current.pendingTestimonials || data.pendingTestimonials || [];
    current.pendingTestimonials.unshift({ name, location, text, status: 'pending' });

    localStorage.setItem('memorialSiteContent', JSON.stringify(current));
    renderTestimonialsPage(current);
    renderHomeTestimonials(current);
    form.reset();
    const msg = document.getElementById('reviewMsg');
    if(msg) msg.textContent = 'Thank you. Your testimonial has been submitted for review.';
  });
}
document.addEventListener('DOMContentLoaded', async () => {
  setupYear();
  setupChat();
  setupNav();
  let data = await loadContent();
  data = mergeContentWithLocal(data);
  applyDesign(data.design || {});
  const versionEls = document.querySelectorAll('.siteVersion');
  if(data.version && versionEls.length){ versionEls.forEach(el => { el.textContent = data.version; }); }
  if(window.renderPage) window.renderPage(data);
  renderHeroPhoto(data);
  renderHomeTestimonials(data);
  renderTestimonialsPage(data);
  renderRestorationGallery(data);
  setupBeforeAfterSliders();
  setupReviewForm(data);
});
