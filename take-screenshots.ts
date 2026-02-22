import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

const BASE_URL = 'http://localhost:5000';
const OUT_DIR = 'client/public/screenshots';

const roles = ['super_admin', 'partner_admin', 'org_admin', 'org_staff'] as const;

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

async function takeScreenshots() {
  const browser = await chromium.launch({ headless: true });
  const results: { file: string; page: string; role: string; mode: string; viewport: string }[] = [];

  for (const role of roles) {
    console.log(`\n=== Role: ${role} ===`);

    const desktopCtx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
    const desktopPage = await desktopCtx.newPage();

    for (const route of routes) {
      const url = `${BASE_URL}${route.path}?role=${role}`;
      const filename = `${role}--${route.name}--desktop-light.png`;
      try {
        await desktopPage.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
        await desktopPage.waitForTimeout(1500);
        await desktopPage.screenshot({ path: `${OUT_DIR}/${filename}`, fullPage: true });
        results.push({ file: filename, page: route.name, role, mode: 'light', viewport: 'desktop' });
        console.log(`  OK ${filename}`);
      } catch (e) {
        console.log(`  FAIL ${filename} - ${(e as Error).message.slice(0, 80)}`);
      }
    }
    await desktopCtx.close();

    const darkCtx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, colorScheme: 'dark' });
    const darkPage = await darkCtx.newPage();

    for (const route of routes) {
      const url = `${BASE_URL}${route.path}?role=${role}`;
      const filename = `${role}--${route.name}--desktop-dark.png`;
      try {
        await darkPage.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
        await darkPage.waitForTimeout(1500);
        await darkPage.screenshot({ path: `${OUT_DIR}/${filename}`, fullPage: true });
        results.push({ file: filename, page: route.name, role, mode: 'dark', viewport: 'desktop' });
        console.log(`  OK ${filename}`);
      } catch (e) {
        console.log(`  FAIL ${filename} - ${(e as Error).message.slice(0, 80)}`);
      }
    }
    await darkCtx.close();

    const mobileCtx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
    const mobilePage = await mobileCtx.newPage();

    for (const route of routes) {
      const url = `${BASE_URL}${route.path}?role=${role}`;
      const filename = `${role}--${route.name}--mobile-light.png`;
      try {
        await mobilePage.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
        await mobilePage.waitForTimeout(1500);
        await mobilePage.screenshot({ path: `${OUT_DIR}/${filename}`, fullPage: true });
        results.push({ file: filename, page: route.name, role, mode: 'light', viewport: 'mobile' });
        console.log(`  OK ${filename}`);
      } catch (e) {
        console.log(`  FAIL ${filename} - ${(e as Error).message.slice(0, 80)}`);
      }
    }
    await mobileCtx.close();
  }

  await browser.close();

  // Generate HTML index
  const roleLabels: Record<string, string> = {
    super_admin: 'Super Admin',
    partner_admin: 'Partner Admin',
    org_admin: 'Org Admin',
    org_staff: 'Staff',
  };

  let html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Nexxus V2 - UI Screenshots</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f0f14; color: #e0e0e0; padding: 2rem; }
  h1 { font-size: 1.8rem; margin-bottom: 0.5rem; color: #fff; }
  .subtitle { color: #888; margin-bottom: 2rem; font-size: 0.95rem; }
  .filters { display: flex; gap: 0.5rem; margin-bottom: 2rem; flex-wrap: wrap; }
  .filter-btn { padding: 0.5rem 1rem; border: 1px solid #333; background: #1a1a24; color: #ccc; border-radius: 6px; cursor: pointer; font-size: 0.85rem; transition: all 0.2s; }
  .filter-btn:hover, .filter-btn.active { background: #6c5ce7; border-color: #6c5ce7; color: #fff; }
  .role-section { margin-bottom: 3rem; }
  .role-title { font-size: 1.3rem; margin-bottom: 1rem; color: #a29bfe; border-bottom: 1px solid #2a2a3a; padding-bottom: 0.5rem; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 1.5rem; }
  .card { background: #1a1a24; border: 1px solid #2a2a3a; border-radius: 10px; overflow: hidden; transition: transform 0.2s, box-shadow 0.2s; }
  .card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.4); }
  .card img { width: 100%; height: auto; display: block; cursor: pointer; }
  .card-info { padding: 0.75rem 1rem; display: flex; justify-content: space-between; align-items: center; }
  .card-name { font-weight: 600; font-size: 0.9rem; }
  .card-tags { display: flex; gap: 0.4rem; }
  .tag { font-size: 0.7rem; padding: 0.2rem 0.5rem; border-radius: 4px; background: #2a2a3a; color: #aaa; }
  .tag.dark { background: #2d2b55; color: #a29bfe; }
  .tag.mobile { background: #1e3a2f; color: #55efc4; }
  .tag.desktop { background: #2a2a3a; color: #ccc; }
  .modal { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 1000; justify-content: center; align-items: center; cursor: zoom-out; }
  .modal.show { display: flex; }
  .modal img { max-width: 95%; max-height: 95%; object-fit: contain; }
  .stats { color: #666; font-size: 0.85rem; margin-bottom: 1.5rem; }
</style>
</head>
<body>
<h1>Nexxus V2 — UI Screenshots</h1>
<p class="subtitle">Full-page captures of every page across all 4 roles, light/dark modes, desktop/mobile viewports</p>
<p class="stats">${results.length} screenshots captured</p>

<div class="filters">
  <button class="filter-btn active" onclick="filterAll()">All</button>
  <button class="filter-btn" onclick="filterBy('viewport','desktop')">Desktop</button>
  <button class="filter-btn" onclick="filterBy('viewport','mobile')">Mobile</button>
  <button class="filter-btn" onclick="filterBy('mode','light')">Light</button>
  <button class="filter-btn" onclick="filterBy('mode','dark')">Dark</button>
</div>
`;

  for (const role of roles) {
    const roleResults = results.filter(r => r.role === role);
    html += `<div class="role-section">
<h2 class="role-title">${roleLabels[role]}</h2>
<div class="grid">
`;
    for (const r of roleResults) {
      html += `<div class="card" data-role="${r.role}" data-mode="${r.mode}" data-viewport="${r.viewport}">
  <img src="/screenshots/${r.file}" alt="${r.page} - ${r.role}" loading="lazy" onclick="openModal(this.src)" />
  <div class="card-info">
    <span class="card-name">${r.page}</span>
    <div class="card-tags">
      <span class="tag ${r.viewport}">${r.viewport}</span>
      <span class="tag ${r.mode}">${r.mode}</span>
    </div>
  </div>
</div>
`;
    }
    html += `</div></div>\n`;
  }

  html += `
<div class="modal" id="modal" onclick="closeModal()">
  <img id="modal-img" src="" alt="Full size" />
</div>
<script>
function openModal(src) { document.getElementById('modal').classList.add('show'); document.getElementById('modal-img').src = src; }
function closeModal() { document.getElementById('modal').classList.remove('show'); }
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
function filterAll() {
  document.querySelectorAll('.card').forEach(c => c.style.display = '');
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('.filter-btn').classList.add('active');
}
function filterBy(attr, val) {
  document.querySelectorAll('.card').forEach(c => {
    c.style.display = c.dataset[attr] === val ? '' : 'none';
  });
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
}
</script>
</body></html>`;

  writeFileSync(`${OUT_DIR}/index.html`, html);
  console.log(`\nDone! ${results.length} screenshots saved.`);
  console.log('Browse at: /screenshots/index.html');
}

takeScreenshots().catch(console.error);
