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

  // Navigate to Insights using client-side navigation (preserves in-memory auth token)
  console.log('\n=== F1: INSIGHTS PAGE LOAD ===');
  // Use evaluate to trigger React Router navigation
  await page.evaluate(() => {
    window.history.pushState({}, '', '/insights');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  await page.waitForTimeout(3000);

  // If that doesn't work, try clicking a link or using the URL bar approach
  let currentUrl = page.url();
  console.log('After pushState URL:', currentUrl);

  if (!currentUrl.includes('/insights')) {
    // Try direct navigation - the app might handle refresh token
    await page.goto('https://dev.huminicdev.com/insights');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    currentUrl = page.url();
    console.log('After goto URL:', currentUrl);
  }

  // If still on login, the refresh token should work - wait for redirect
  if (currentUrl.includes('/login')) {
    console.log('Redirected to login - checking if refresh token works...');
    await page.waitForTimeout(5000);
    currentUrl = page.url();
    console.log('After wait URL:', currentUrl);
  }

  const redirected = !page.url().includes('/insights');
  console.log('Final URL:', page.url());
  console.log('Redirected away from insights:', redirected);
  await page.screenshot({ path: `${ssDir}/02-insights-dashboard.png`, fullPage: true });

  // If we're still on login, try a different approach: login via API then navigate
  if (redirected) {
    console.log('\n=== ALTERNATIVE AUTH: API login + navigate ===');
    // Go back to main page and use sidebar navigation
    await page.goto('https://dev.huminicdev.com/auth');
    await page.waitForLoadState('networkidle');
    await page.fill('input[type="email"], input[name="email"]', 'serra_honda@huminic.ai');
    await page.fill('input[type="password"], input[name="password"]', 'NexxusTest2026');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    console.log('Re-login URL:', page.url());

    // Now try to navigate via the app's own navigation
    // Look for sidebar links or use address bar within the SPA
    const insightsLink = await page.$('a[href="/insights"], a[href*="insights"]');
    if (insightsLink) {
      console.log('Found insights link in DOM, clicking...');
      await insightsLink.click();
      await page.waitForTimeout(3000);
    } else {
      console.log('No insights link in sidebar, using URL hash approach...');
      // Navigate using evaluate to change location via React Router
      await page.evaluate(() => {
        // Try finding the router and navigating
        const link = document.querySelector('a[href="/insights"]');
        if (link) { link.click(); return; }
        // Fallback: direct location change (will trigger refresh token flow)
        window.location.href = '/insights';
      });
      await page.waitForTimeout(5000);
    }

    currentUrl = page.url();
    console.log('After SPA navigation URL:', currentUrl);
    await page.screenshot({ path: `${ssDir}/02b-insights-attempt2.png`, fullPage: true });
  }

  // Capture page structure regardless of where we ended up
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

  // F2: Graph population
  console.log('\n=== F2: GRAPH POPULATION ===');
  await page.evaluate(() => window.scrollBy(0, 500));
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${ssDir}/04-insights-scrolled.png`, fullPage: true });

  // F7: Tab switching - use SPA navigation by clicking tab elements
  console.log('\n=== F7: TAB SWITCHING ===');
  // First check if we have a menu/tab dropdown
  const menuTrigger = await page.$('[class*="DropdownMenuTrigger"], button:has-text("Dashboard"), button:has-text("Menu")');
  if (menuTrigger) {
    console.log('Found menu trigger, clicking...');
    await menuTrigger.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${ssDir}/10-menu-dropdown.png` });
    const menuItems = await page.$$eval('[role="menuitem"], [class*="DropdownMenuItem"]',
      els => els.map(e => ({ text: e.textContent?.trim() })));
    console.log('Menu items:', JSON.stringify(menuItems, null, 2));

    // Click Reports
    const reportsItem = await page.$('[role="menuitem"]:has-text("Reports"), [class*="DropdownMenuItem"]:has-text("Reports")');
    if (reportsItem) {
      await reportsItem.click();
      await page.waitForTimeout(2000);
      console.log('Switched to Reports tab, URL:', page.url());
      await page.screenshot({ path: `${ssDir}/05-tab-reports.png`, fullPage: true });
      const reportsText = await page.evaluate(() => document.body.innerText.substring(0, 2000));
      console.log('Reports content:', reportsText.substring(0, 1000));
    }

    // Click Library
    if (menuTrigger) await menuTrigger.click();
    await page.waitForTimeout(500);
    const libraryItem = await page.$('[role="menuitem"]:has-text("Library"), [class*="DropdownMenuItem"]:has-text("Library")');
    if (libraryItem) {
      await libraryItem.click();
      await page.waitForTimeout(2000);
      console.log('Switched to Library tab, URL:', page.url());
      await page.screenshot({ path: `${ssDir}/05-tab-library.png`, fullPage: true });
      const libraryText = await page.evaluate(() => document.body.innerText.substring(0, 1500));
      console.log('Library content:', libraryText.substring(0, 1000));
    }

    // Click Hunches
    if (menuTrigger) await menuTrigger.click();
    await page.waitForTimeout(500);
    const hunchesItem = await page.$('[role="menuitem"]:has-text("Hunches"), [class*="DropdownMenuItem"]:has-text("Hunches")');
    if (hunchesItem) {
      await hunchesItem.click();
      await page.waitForTimeout(2000);
      console.log('Switched to Hunches tab, URL:', page.url());
      await page.screenshot({ path: `${ssDir}/05-tab-hunches.png`, fullPage: true });
      const hunchesText = await page.evaluate(() => document.body.innerText.substring(0, 1000));
      console.log('Hunches content:', hunchesText.substring(0, 800));
    }

    // Click Activity
    if (menuTrigger) await menuTrigger.click();
    await page.waitForTimeout(500);
    const activityItem = await page.$('[role="menuitem"]:has-text("Activity"), [class*="DropdownMenuItem"]:has-text("Activity")');
    if (activityItem) {
      await activityItem.click();
      await page.waitForTimeout(2000);
      console.log('Switched to Activity tab, URL:', page.url());
      await page.screenshot({ path: `${ssDir}/05-tab-activity.png`, fullPage: true });
    }

    // Click Dashboard
    if (menuTrigger) {
      await menuTrigger.click();
      await page.waitForTimeout(500);
    }
    const dashItem = await page.$('[role="menuitem"]:has-text("Dashboard"), [class*="DropdownMenuItem"]:has-text("Dashboard")');
    if (dashItem) {
      await dashItem.click();
      await page.waitForTimeout(2000);
      console.log('Switched to Dashboard tab, URL:', page.url());
      await page.screenshot({ path: `${ssDir}/05-tab-dashboard.png`, fullPage: true });
    }
  } else {
    console.log('No menu trigger found - trying direct URL navigation');
    // Navigate with query params which may trigger refresh token flow
    const tabNames = ['reports', 'library', 'hunches', 'activity', 'dashboard'];
    for (const tab of tabNames) {
      try {
        await page.evaluate((t) => {
          const url = new URL(window.location.href);
          url.pathname = '/insights';
          url.searchParams.set('tab', t);
          window.history.pushState({}, '', url.toString());
          window.dispatchEvent(new PopStateEvent('popstate'));
        }, tab);
        await page.waitForTimeout(2000);
        console.log(`\nTab: ${tab}, URL: ${page.url()}`);
        await page.screenshot({ path: `${ssDir}/05-tab-${tab}.png`, fullPage: true });
      } catch (e) {
        console.log(`Tab ${tab} error:`, e.message);
      }
    }
  }

  // F5: Drill-down modals
  console.log('\n=== F5: DRILL-DOWN MODALS ===');
  const clickableMetrics = await page.$$eval('[class*="card"]:not([class*="card-"]) h3, [class*="Card"] h3, [class*="metric"] span, [role="button"]',
    els => els.map(e => ({ text: e.textContent?.trim().substring(0, 60), tag: e.tagName })));
  console.log('Clickable metric elements:', JSON.stringify(clickableMetrics.slice(0, 10), null, 2));

  // Try clicking "Hot Leads"
  try {
    const hotLeadsLink = await page.$('text=Hot Leads');
    if (hotLeadsLink) {
      await hotLeadsLink.click();
      await page.waitForTimeout(2000);
      console.log('Clicked Hot Leads');
      await page.screenshot({ path: `${ssDir}/06-hot-leads-modal.png`, fullPage: true });
      // Check modal content
      const modalText = await page.evaluate(() => {
        const modal = document.querySelector('[role="dialog"], [class*="modal"], [class*="Modal"]');
        return modal ? modal.innerText.substring(0, 500) : 'NO MODAL FOUND';
      });
      console.log('Hot Leads modal content:', modalText);
      const closeBtn = await page.$('[role="dialog"] button:has-text("Close"), [class*="close"], button[aria-label="Close"], [role="dialog"] button:first-child');
      if (closeBtn) await closeBtn.click();
      await page.waitForTimeout(500);
    } else {
      console.log('Hot Leads element not found');
    }
  } catch(e) { console.log('Hot Leads click error:', e.message); }

  // Try Win Rate
  try {
    const winRate = await page.$('text=Win Rate');
    if (winRate) {
      await winRate.click();
      await page.waitForTimeout(2000);
      console.log('Clicked Win Rate');
      await page.screenshot({ path: `${ssDir}/07-win-rate-modal.png`, fullPage: true });
      const modalText = await page.evaluate(() => {
        const modal = document.querySelector('[role="dialog"], [class*="modal"], [class*="Modal"]');
        return modal ? modal.innerText.substring(0, 500) : 'NO MODAL FOUND';
      });
      console.log('Win Rate modal content:', modalText);
      const closeBtn = await page.$('[role="dialog"] button:has-text("Close"), [class*="close"], button[aria-label="Close"]');
      if (closeBtn) await closeBtn.click();
    }
  } catch(e) { console.log('Win Rate error:', e.message); }

  // Try Show Rate
  try {
    const showRate = await page.$('text=Show Rate');
    if (showRate) {
      await showRate.click();
      await page.waitForTimeout(2000);
      console.log('Clicked Show Rate');
      await page.screenshot({ path: `${ssDir}/07b-show-rate-modal.png`, fullPage: true });
      const closeBtn = await page.$('[role="dialog"] button:has-text("Close"), [class*="close"], button[aria-label="Close"]');
      if (closeBtn) await closeBtn.click();
    }
  } catch(e) { console.log('Show Rate error:', e.message); }

  // F8: Filters
  console.log('\n=== F8: DATE RANGE / FILTERS ===');
  const filterElements = await page.$$eval('select, [class*="filter"], [class*="Filter"], [class*="date"], input[type="date"], [class*="period"], [class*="Period"]',
    els => els.map(e => ({ tag: e.tagName, text: e.textContent?.trim().substring(0, 80), class: e.className?.substring(0, 60) })));
  console.log('Filter elements:', JSON.stringify(filterElements.slice(0, 10), null, 2));

  // CSV Export check
  console.log('\n=== CSV EXPORT CHECK ===');
  try {
    const exportBtn = await page.$('button:has-text("Export"), button:has-text("CSV"), button:has-text("Download")');
    if (exportBtn) {
      console.log('Export button found:', await exportBtn.textContent());
    } else {
      console.log('No export button visible on dashboard');
    }
  } catch(e) { console.log('Export check error:', e.message); }

  // F6: Contact actions
  console.log('\n=== F6: CONTACT ACTIONS ===');
  const contactActions = await page.$$eval('a[href^="tel:"], a[href^="sms:"], button:has-text("Call"), button:has-text("SMS"), button:has-text("Email"), [class*="contact"], [class*="action"]',
    els => els.map(e => ({ tag: e.tagName, text: e.textContent?.trim().substring(0, 80), href: e.getAttribute('href') })));
  console.log('Contact actions:', JSON.stringify(contactActions.slice(0, 10), null, 2));

  // Check sidebar for Insights link
  console.log('\n=== SIDEBAR INSIGHTS LINK CHECK ===');
  const sidebarLinks = await page.$$eval('nav a, aside a, [class*="sidebar"] a, [class*="Sidebar"] a',
    els => els.map(e => ({ text: e.textContent?.trim().substring(0, 40), href: e.getAttribute('href') })));
  console.log('Sidebar links:', JSON.stringify(sidebarLinks, null, 2));

  // Final screenshot
  await page.screenshot({ path: `${ssDir}/11-final-overview.png`, fullPage: true });

  console.log('\n=== EVAL COMPLETE ===');
  await browser.close();
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
