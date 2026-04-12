const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const ssDir = 'evidence/PE-INSIGHTS-03/screenshots';

  // Login
  await page.goto('https://dev.huminicdev.com/auth');
  await page.waitForLoadState('networkidle');
  console.log('=== LOGIN PAGE ===');
  console.log('URL:', page.url());
  
  // Fill login form
  await page.fill('input[type="email"], input[name="email"]', 'serra_honda@huminic.ai');
  await page.fill('input[type="password"], input[name="password"]', 'NexxusTest2026');
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  console.log('Post-login URL:', page.url());
  await page.screenshot({ path: `${ssDir}/01-post-login.png`, fullPage: true });

  // Navigate to Insights
  console.log('\n=== F1: INSIGHTS PAGE LOAD ===');
  await page.goto('https://dev.huminicdev.com/insights');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  console.log('Insights URL:', page.url());
  const redirected = !page.url().includes('/insights');
  console.log('Redirected away:', redirected);
  await page.screenshot({ path: `${ssDir}/02-insights-dashboard.png`, fullPage: true });
  
  // Capture page structure
  const pageText = await page.evaluate(() => document.body.innerText);
  console.log('\n=== PAGE CONTENT (first 3000 chars) ===');
  console.log(pageText.substring(0, 3000));

  // Check for tabs/navigation
  console.log('\n=== TABS/NAVIGATION ===');
  const tabs = await page.$$eval('[role="tab"], [data-tab], .tab, button:has-text("Dashboard"), button:has-text("Reports"), button:has-text("Library"), button:has-text("Activity"), button:has-text("Hunches")', 
    els => els.map(e => ({ text: e.textContent?.trim(), tag: e.tagName, class: e.className?.substring(0, 80) })));
  console.log('Tabs found:', JSON.stringify(tabs, null, 2));

  // Check for graphs/charts
  console.log('\n=== CHARTS/GRAPHS ===');
  const charts = await page.$$eval('canvas, svg, [class*="chart"], [class*="graph"], [class*="recharts"]', 
    els => els.map(e => ({ tag: e.tagName, class: e.className?.toString().substring(0, 80), width: e.offsetWidth, height: e.offsetHeight })));
  console.log('Charts found:', JSON.stringify(charts, null, 2));

  // Check for cards
  console.log('\n=== METRIC CARDS ===');
  const cards = await page.$$eval('[class*="card"], [class*="Card"], [class*="tile"], [class*="metric"]',
    els => els.map(e => ({ text: e.textContent?.trim().substring(0, 120), class: e.className?.substring(0, 60) })));
  console.log('Cards found:', cards.length);
  cards.slice(0, 20).forEach((c, i) => console.log(`Card ${i}:`, c.text?.substring(0, 100)));

  // Check for menu/dropdown
  console.log('\n=== MENU/DROPDOWN ===');
  const menuBtns = await page.$$eval('button:has-text("Menu"), button:has-text("Dashboard"), [class*="menu"], select',
    els => els.map(e => ({ text: e.textContent?.trim().substring(0, 60), tag: e.tagName })));
  console.log('Menu elements:', JSON.stringify(menuBtns.slice(0, 10), null, 2));

  // Screenshot viewport
  await page.screenshot({ path: `${ssDir}/03-insights-viewport.png` });

  // F2: Graph population - scroll to see all graphs
  console.log('\n=== F2: GRAPH POPULATION ===');
  await page.evaluate(() => window.scrollBy(0, 500));
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${ssDir}/04-insights-scrolled.png`, fullPage: true });

  // F7: Tab switching - try each tab
  console.log('\n=== F7: TAB SWITCHING ===');
  const tabNames = ['reports', 'library', 'hunches', 'activity', 'dashboard'];
  for (const tab of tabNames) {
    try {
      await page.goto(`https://dev.huminicdev.com/insights?tab=${tab}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      const url = page.url();
      const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 500));
      console.log(`\nTab: ${tab}`);
      console.log('URL:', url);
      console.log('Content preview:', bodyText.substring(0, 300));
      await page.screenshot({ path: `${ssDir}/05-tab-${tab}.png`, fullPage: true });
    } catch (e) {
      console.log(`Tab ${tab} error:`, e.message);
    }
  }

  // F5: Drill-down modals - try clicking on cards/metrics
  console.log('\n=== F5: DRILL-DOWN MODALS ===');
  await page.goto('https://dev.huminicdev.com/insights?tab=dashboard');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  // Try to find clickable metric elements
  const clickableMetrics = await page.$$eval('[class*="card"]:not([class*="card-"]) h3, [class*="Card"] h3, [class*="metric"] span, [role="button"]',
    els => els.map(e => ({ text: e.textContent?.trim().substring(0, 60), tag: e.tagName })));
  console.log('Clickable metric elements:', JSON.stringify(clickableMetrics.slice(0, 10), null, 2));

  // Try clicking "Hot Leads" or similar
  try {
    const hotLeadsLink = await page.$('text=Hot Leads');
    if (hotLeadsLink) {
      await hotLeadsLink.click();
      await page.waitForTimeout(2000);
      console.log('Clicked Hot Leads');
      await page.screenshot({ path: `${ssDir}/06-hot-leads-modal.png`, fullPage: true });
      // Close modal if open
      const closeBtn = await page.$('[class*="close"], button:has-text("Close"), button:has-text("×"), [aria-label="Close"]');
      if (closeBtn) await closeBtn.click();
      await page.waitForTimeout(500);
    } else {
      console.log('Hot Leads element not found');
    }
  } catch(e) { console.log('Hot Leads click error:', e.message); }

  // Try clicking other metric cards
  try {
    const showRate = await page.$('text=Show Rate');
    if (showRate) {
      await showRate.click();
      await page.waitForTimeout(2000);
      console.log('Clicked Show Rate');
      await page.screenshot({ path: `${ssDir}/07-show-rate-modal.png`, fullPage: true });
      const closeBtn = await page.$('[class*="close"], button:has-text("Close"), button:has-text("×"), [aria-label="Close"]');
      if (closeBtn) await closeBtn.click();
    } else {
      console.log('Show Rate element not found');
    }
  } catch(e) { console.log('Show Rate error:', e.message); }

  // F3: Report cards
  console.log('\n=== F3: REPORT CARDS ===');
  await page.goto('https://dev.huminicdev.com/insights?tab=reports');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  const reportsText = await page.evaluate(() => document.body.innerText.substring(0, 3000));
  console.log('Reports content:', reportsText.substring(0, 2000));
  await page.screenshot({ path: `${ssDir}/08-reports-tab.png`, fullPage: true });

  // F4: Library cards
  console.log('\n=== F4: LIBRARY CARDS ===');
  await page.goto('https://dev.huminicdev.com/insights?tab=library');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  const libraryText = await page.evaluate(() => document.body.innerText.substring(0, 2000));
  console.log('Library content:', libraryText.substring(0, 1500));
  await page.screenshot({ path: `${ssDir}/09-library-tab.png`, fullPage: true });

  // F8: Filters
  console.log('\n=== F8: DATE RANGE / FILTERS ===');
  await page.goto('https://dev.huminicdev.com/insights?tab=dashboard');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  const filterElements = await page.$$eval('select, [class*="filter"], [class*="Filter"], [class*="date"], input[type="date"], [class*="period"]',
    els => els.map(e => ({ tag: e.tagName, text: e.textContent?.trim().substring(0, 80), class: e.className?.substring(0, 60) })));
  console.log('Filter elements:', JSON.stringify(filterElements.slice(0, 10), null, 2));

  // F6: Contact actions
  console.log('\n=== F6: CONTACT ACTIONS ===');
  const contactActions = await page.$$eval('a[href^="tel:"], a[href^="sms:"], button:has-text("Call"), button:has-text("SMS"), button:has-text("Email"), [class*="contact"], [class*="action"]',
    els => els.map(e => ({ tag: e.tagName, text: e.textContent?.trim().substring(0, 80), href: e.getAttribute('href') })));
  console.log('Contact actions:', JSON.stringify(contactActions.slice(0, 10), null, 2));

  // Check for menu dropdown to verify activity tab routing
  console.log('\n=== MENU DROPDOWN CHECK ===');
  try {
    const menuBtn = await page.$('button:has-text("Menu"), button:has-text("Dashboard"), [class*="DropdownMenuTrigger"]');
    if (menuBtn) {
      await menuBtn.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: `${ssDir}/10-menu-dropdown.png` });
      const menuItems = await page.$$eval('[role="menuitem"], [class*="DropdownMenuItem"]',
        els => els.map(e => ({ text: e.textContent?.trim(), href: e.getAttribute('href') || e.getAttribute('data-href') })));
      console.log('Menu items:', JSON.stringify(menuItems, null, 2));
    }
  } catch(e) { console.log('Menu dropdown error:', e.message); }

  // Final full page screenshot
  await page.goto('https://dev.huminicdev.com/insights');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${ssDir}/11-final-overview.png`, fullPage: true });

  console.log('\n=== EVAL COMPLETE ===');
  await browser.close();
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
