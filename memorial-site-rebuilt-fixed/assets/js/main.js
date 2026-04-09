
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
document.addEventListener('DOMContentLoaded', async () => {
  setupYear();
  setupChat();
  const data = await loadContent();
  applyDesign(data.design || {});
  const versionEls = document.querySelectorAll('.siteVersion');
  if(data.version && versionEls.length){ versionEls.forEach(el => { el.textContent = data.version; }); }
  if(window.renderPage) window.renderPage(data);
});
