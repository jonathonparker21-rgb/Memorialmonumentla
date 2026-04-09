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
function renderTestimonials(data){
  const wrap = document.getElementById('testimonialsList');
  if(!wrap) return;
  const items = data.testimonials || [];
  wrap.innerHTML = items.map(t => `
    <article class="testimonial-card">
      <p class="testimonial-text">“${t.text}”</p>
      <div class="testimonial-meta"><strong>${t.name}</strong>${t.location ? ` <span>• ${t.location}</span>` : ''}</div>
    </article>
  `).join('');
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
    if(local){
      try { current = JSON.parse(local); } catch(e) {}
    }
    current.testimonials = current.testimonials || [];
    current.testimonials.unshift({ name, location, text });
    localStorage.setItem('memorialSiteContent', JSON.stringify(current));
    renderTestimonials(current);
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
  renderTestimonials(data);
  setupReviewForm(data);
});
