import { chromium } from 'playwright';
import { writeFileSync, readdirSync } from 'fs';

const BASE_URL = 'http://localhost:5000';
const OUT_DIR = 'client/public/screenshots';

const roles = ['org_admin', 'org_staff'] as const;

const routes = [
  { path: '/', name: 'home' },
  { path: '/agents', name: 'agents' },
  { path: '/agents/create', name: 'agents-create' },
  { path: '/drive', name: 'drive' },
  { path: '/insights', name: 'insights' },
  { path: '/work-center', name: 'work-center' },
  { path: '/activity', name: 'activity' },
  { path: '/settings/system', name: 'settings' },
  { path: '/profile', name: 'profile' },
  { path: '/profile/preferences', name: 'profile-preferences' },
  { path: '/profile/billing', name: 'profile-billing' },
  { path: '/w/demo', name: 'widget-landing' },
];

async function run() {
  const browser = await chromium.launch({ headless: true });

  for (const role of roles) {
    console.log(`\n=== ${role} ===`);

    const ctx1 = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
    const p1 = await ctx1.newPage();
    for (const r of routes) {
      try {
        await p1.goto(`${BASE_URL}${r.path}?role=${role}`, { waitUntil: 'networkidle', timeout: 12000 });
        await p1.waitForTimeout(1000);
        await p1.screenshot({ path: `${OUT_DIR}/${role}--${r.name}--desktop-light.png`, fullPage: true });
        console.log(`  OK desktop-light ${r.name}`);
      } catch (e) { console.log(`  FAIL desktop-light ${r.name}`); }
    }
    await ctx1.close();

    const ctx2 = await browser.newContext({ viewport: { width: 1920, height: 1080 }, colorScheme: 'dark' });
    const p2 = await ctx2.newPage();
    for (const r of routes) {
      try {
        await p2.goto(`${BASE_URL}${r.path}?role=${role}`, { waitUntil: 'networkidle', timeout: 12000 });
        await p2.waitForTimeout(1000);
        await p2.screenshot({ path: `${OUT_DIR}/${role}--${r.name}--desktop-dark.png`, fullPage: true });
        console.log(`  OK desktop-dark ${r.name}`);
      } catch (e) { console.log(`  FAIL desktop-dark ${r.name}`); }
    }
    await ctx2.close();

    const ctx3 = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
    const p3 = await ctx3.newPage();
    for (const r of routes) {
      try {
        await p3.goto(`${BASE_URL}${r.path}?role=${role}`, { waitUntil: 'networkidle', timeout: 12000 });
        await p3.waitForTimeout(1000);
        await p3.screenshot({ path: `${OUT_DIR}/${role}--${r.name}--mobile-light.png`, fullPage: true });
        console.log(`  OK mobile-light ${r.name}`);
      } catch (e) { console.log(`  FAIL mobile-light ${r.name}`); }
    }
    await ctx3.close();
  }

  await browser.close();
  console.log('\nRemaining roles done. Generating index...');
  generateIndex();
}

function generateIndex() {
  const files = readdirSync(OUT_DIR).filter(f => f.endsWith('.png'));
  const allRoles = ['super_admin', 'partner_admin', 'org_admin', 'org_staff'];
  const roleLabels: Record<string, string> = { super_admin: 'Super Admin', partner_admin: 'Partner Admin', org_admin: 'Org Admin', org_staff: 'Staff' };

  const items = files.map(f => {
    const parts = f.replace('.png', '').split('--');
    return { file: f, role: parts[0], page: parts[1], variant: parts[2] || '' };
  });

  let html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Nexxus V2 - UI Screenshots</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0f0f14;color:#e0e0e0;padding:2rem}
h1{font-size:1.8rem;margin-bottom:0.5rem;color:#fff}
.subtitle{color:#888;margin-bottom:0.5rem;font-size:0.95rem}
.stats{color:#666;font-size:0.85rem;margin-bottom:1.5rem}
.filters{display:flex;gap:0.5rem;margin-bottom:2rem;flex-wrap:wrap}
.fb{padding:0.5rem 1rem;border:1px solid #333;background:#1a1a24;color:#ccc;border-radius:6px;cursor:pointer;font-size:0.85rem;transition:all 0.2s}
.fb:hover,.fb.active{background:#6c5ce7;border-color:#6c5ce7;color:#fff}
.role-section{margin-bottom:3rem}
.role-title{font-size:1.3rem;margin-bottom:1rem;color:#a29bfe;border-bottom:1px solid #2a2a3a;padding-bottom:0.5rem}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(400px,1fr));gap:1.5rem}
.card{background:#1a1a24;border:1px solid #2a2a3a;border-radius:10px;overflow:hidden;transition:transform 0.2s,box-shadow 0.2s}
.card:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,0.4)}
.card img{width:100%;height:auto;display:block;cursor:pointer}
.card-info{padding:0.75rem 1rem;display:flex;justify-content:space-between;align-items:center}
.card-name{font-weight:600;font-size:0.9rem}
.card-tags{display:flex;gap:0.4rem}
.tag{font-size:0.7rem;padding:0.2rem 0.5rem;border-radius:4px;background:#2a2a3a;color:#aaa}
.tag.dark{background:#2d2b55;color:#a29bfe}.tag.mobile-light{background:#1e3a2f;color:#55efc4}.tag.desktop-light{background:#2a2a3a;color:#ccc}.tag.desktop-dark{background:#2d2b55;color:#a29bfe}
.modal{display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.92);z-index:1000;justify-content:center;align-items:center;cursor:zoom-out}
.modal.show{display:flex}
.modal img{max-width:95%;max-height:95%;object-fit:contain}
</style></head><body>
<h1>Nexxus V2 — UI Screenshots</h1>
<p class="subtitle">Full-page captures across all 4 roles, light/dark modes, desktop/mobile</p>
<p class="stats">${items.length} screenshots</p>
<div class="filters">
<button class="fb active" onclick="fa()">All</button>
<button class="fb" onclick="fv('desktop-light')">Desktop Light</button>
<button class="fb" onclick="fv('desktop-dark')">Desktop Dark</button>
<button class="fb" onclick="fv('mobile-light')">Mobile</button>
</div>`;

  for (const role of allRoles) {
    const roleItems = items.filter(i => i.role === role);
    if (roleItems.length === 0) continue;
    html += `<div class="role-section"><h2 class="role-title">${roleLabels[role] || role}</h2><div class="grid">`;
    for (const item of roleItems) {
      html += `<div class="card" data-v="${item.variant}">
<img src="/screenshots/${item.file}" alt="${item.page}" loading="lazy" onclick="om(this.src)"/>
<div class="card-info"><span class="card-name">${item.page}</span><div class="card-tags"><span class="tag ${item.variant}">${item.variant.replace('-', ' ')}</span></div></div></div>`;
    }
    html += `</div></div>`;
  }

  html += `<div class="modal" id="m" onclick="cm()"><img id="mi" src="" alt="Full"/></div>
<script>
function om(s){document.getElementById('m').classList.add('show');document.getElementById('mi').src=s}
function cm(){document.getElementById('m').classList.remove('show')}
document.addEventListener('keydown',e=>{if(e.key==='Escape')cm()});
function fa(){document.querySelectorAll('.card').forEach(c=>c.style.display='');document.querySelectorAll('.fb').forEach(b=>b.classList.remove('active'));document.querySelectorAll('.fb')[0].classList.add('active')}
function fv(v){document.querySelectorAll('.card').forEach(c=>{c.style.display=c.dataset.v===v?'':'none'});document.querySelectorAll('.fb').forEach(b=>b.classList.remove('active'));event.target.classList.add('active')}
</script></body></html>`;

  writeFileSync(`${OUT_DIR}/index.html`, html);
  console.log(`Index generated with ${items.length} screenshots.`);
}

run().catch(console.error);
