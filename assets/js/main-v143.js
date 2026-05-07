/* FORCE_REFRESH_BUILD v1.4.6 2026-04-29 13:10:31 */
const BUILD_VERSION = 'v1.4.6';

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
  const res = await fetch('site-content.json?v=v1.4.6', { cache: 'no-store' });
  return await res.json();
}

async function loadContent(){
  const bundled = await loadBundledContent();

  try {
    const apiRes = await fetch('/api/get-content?build=v1.4.6', { cache: 'no-store' });
    if (apiRes.ok) {
      const apiData = await apiRes.json();

      // If Cloudflare KV still has an older saved copy, do not let it override this build.
      if(apiData.version && isOlderVersion(apiData.version, bundled.version)){
        return bundled;
      }

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
  const items = (data.testimonials || []).filter(t => (t.status || 'approved') === 'approved');
  track.innerHTML = items.concat(items).map(testimonialCard).join('');
}
function renderTestimonialsPage(data){
  const wrap = document.getElementById('allTestimonials');
  if(!wrap) return;
  wrap.innerHTML = (data.testimonials || []).map(testimonialCard).join('');
}











function galleryCard(item){
  const afterImg = item.image || '';
  const beforeImg = item.beforeImage || '';

  if(!afterImg) return '';

  if(beforeImg){
    return `<article class="restoration-card restoration-card-ba">
      <div class="ba-wrap pro-ba-wrap" data-ba-wrap>
        <img class="ba-img ba-after" src="${afterImg}" alt="${item.title} after" loading="lazy">
        <div class="ba-before-layer" style="width:50%;">
          <img class="ba-img ba-before" src="${beforeImg}" alt="${item.title} before" loading="lazy">
        </div>
        <div class="ba-divider"></div>
        <div class="ba-label ba-label-before">Before</div>
        <div class="ba-label ba-label-after">After</div>
        <input class="ba-slider" type="range" min="0" max="100" value="50" aria-label="Before and after comparison">
      </div>
      <div class="restoration-copy">
        <h3>${item.title}</h3>
        <p>${item.description || ''}</p>
      </div>
    </article>`;
  }

  return `<article class="restoration-card restoration-card-single">
    <div class="single-restoration-media">
      <img src="${afterImg}" alt="${item.title}" loading="lazy" onerror="this.closest('.restoration-card').remove();">
      <div class="single-photo-badge">Completed Work</div>
    </div>
    <div class="restoration-copy">
      <h3>${item.title}</h3>
      <p>${item.description || ''}</p>
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
  track.innerHTML = (data.restorationGallery || []).map(galleryCard).join('');
}
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
    current.testimonials = current.testimonials || [];
    current.pendingTestimonials = current.pendingTestimonials || [];
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
  const data = await loadContent();
  applyDesign(data.design || {});
  const versionEls = document.querySelectorAll('.siteVersion');
  if(data.version && versionEls.length){ versionEls.forEach(el => { el.textContent = data.version; }); }
  if(window.renderPage) window.renderPage(data);
  const heroPhotoEl = document.getElementById('heroPhotoImage');
  const heroPhotoBox = document.getElementById('heroPhotoBox');
  if(heroPhotoEl && heroPhotoBox && data.heroPhoto){ heroPhotoEl.src = data.heroPhoto; heroPhotoBox.classList.add('has-photo'); }
  renderHomeTestimonials(data);
  renderTestimonialsPage(data);
  renderRestorationGallery(data);
  setupBeforeAfterSliders();
  setupBeforeAfterSliders();
  setupReviewForm(data);
});
