async function loadContent(){
  const local = localStorage.getItem('memorialSiteContent');
  if(local){ try { return JSON.parse(local); } catch(e) {} }
  const res = await fetch('site-content.json');
  return await res.json();
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
  const items = data.testimonials || [];
  track.innerHTML = items.concat(items).map(testimonialCard).join('');
}
function renderTestimonialsPage(data){
  const wrap = document.getElementById('allTestimonials');
  if(!wrap) return;
  wrap.innerHTML = (data.testimonials || []).map(testimonialCard).join('');
}
function galleryCard(item){
  return `<article class="restoration-card"><img src="${item.image}" alt="${item.title}"><div class="restoration-copy"><h3>${item.title}</h3><p>${item.description || ''}</p></div></article>`;
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
    current.testimonials.unshift({ name, location, text });
    localStorage.setItem('memorialSiteContent', JSON.stringify(current));
    renderTestimonialsPage(current);
    renderHomeTestimonials(current);
    form.reset();
    const msg = document.getElementById('reviewMsg');
    if(msg) msg.textContent = 'Thank you. Your review was added to this preview.';
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
  renderHomeTestimonials(data);
  renderTestimonialsPage(data);
  renderRestorationGallery(data);
  setupReviewForm(data);
});
