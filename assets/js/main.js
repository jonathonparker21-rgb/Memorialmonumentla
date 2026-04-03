
async function loadContent(){
  const local = localStorage.getItem('memorialSiteContent');
  if(local){
    try { return JSON.parse(local); } catch(e) {}
  }
  const res = await fetch('site-content.json');
  return await res.json();
}
function mapSrc(q){ return 'https://www.google.com/maps?q=' + encodeURIComponent(q) + '&output=embed'; }
function setText(id, value){ const el = document.getElementById(id); if(el) el.textContent = value || ''; }
function setHTML(id, value){ const el = document.getElementById(id); if(el) el.innerHTML = value || ''; }
function setupChat(){
  const btn = document.getElementById('chatToggle');
  const panel = document.getElementById('chatPanel');
  if(btn && panel){
    btn.addEventListener('click', () => panel.classList.toggle('active'));
  }
}
function setupYear(){ const y = document.getElementById('year'); if(y) y.textContent = new Date().getFullYear(); }
document.addEventListener('DOMContentLoaded', async () => {
  setupYear(); setupChat();
  const data = await loadContent();
  if(window.renderPage) window.renderPage(data);
});
