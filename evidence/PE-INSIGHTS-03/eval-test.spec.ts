import { test, expect } from 'playwright/test';

test('PE-INSIGHTS-03 full eval', async ({ page }) => {
  test.setTimeout(180000);
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

  // Navigate to Insights using client-side navigation
  console.log('\n=== F1: INSIGHTS PAGE LOAD ===');
  // Try clicking an Insights link in navigation first
  let insightsLink = await page.$('a[href="/insights"], a[href*="insights"]');
  if (insightsLink) {
    console.log('Found insights link, clicking...');
    await insightsLink.click();
    await page.waitForTimeout(3000);
  } else {
    // Use evaluate to navigate within SPA
    await page.evaluate(() => {
      window.history.pushState({}, '', '/insights');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    await page.waitForTimeout(3000);
  }

  let currentUrl = page.url();
  console.log('After SPA nav URL:', currentUrl);

  // If not on insights, try full page navigation (refresh token should handle re-auth)
  if (!currentUrl.includes('/insights')) {
    await page.goto('https://dev.huminicdev.com/insights', { waitUntil: 'networkidle' });
    await page.waitForTimeout(5000);
    currentUrl = page.url();
    console.log('After goto URL:', currentUrl);

    // If redirected to login, re-login
    if (currentUrl.includes('/login') || currentUrl.includes('/auth')) {
      console.log('Session lost - re-authenticating...');
      await page.fill('input[type="email"], input[name="email"]', 'serra_honda@huminic.ai');
      await page.fill('input[type="password"], input[name="password"]', 'NexxusTest2026');
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      // Now navigate to insights via SPA
      insightsLink = await page.$('a[href="/insights"], a[href*="insights"]');
      if (insightsLink) {
        await insightsLink.click();
      } else {
        await page.evaluate(() => {
          window.history.pushState({}, '', '/insights');
          window.dispatchEvent(new PopStateEvent('popstate'));
        });
      }
      await page.waitForTimeout(3000);
      currentUrl = page.url();
      console.log('After re-auth URL:', currentUrl);
    }
  }

  const redirected = !page.url().includes('/insights');
  console.log('Final URL:', page.url());
  console.log('Redirected away from insights:', redirected);
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

  // Screenshot viewport
  await page.screenshot({ path: `${ssDir}/03-insights-viewport.png` });

  // F2: Graph population
  console.log('\n=== F2: GRAPH POPULATION ===');
  await page.evaluate(() => window.scrollBy(0, 500));
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${ssDir}/04-insights-scrolled.png`, fullPage: true });

  // F7: Tab switching via menu dropdown
  console.log('\n=== F7: TAB SWITCHING ===');
  const menuTrigger = await page.$('[class*="DropdownMenuTrigger"], button:has-text("Dashboard"), button:has-text("Menu")');
  if (menuTrigger) {
    console.log('Found menu trigger');
    await menuTrigger.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${ssDir}/10-menu-dropdown.png` });
    const menuItemTexts = await page.$$eval('[role="menuitem"], [class*="DropdownMenuItem"]',
      els => els.map(e => e.textContent?.trim()));
    console.log('Menu items:', JSON.stringify(menuItemTexts));

    // Click Reports
    const reportsItem = await page.$('[role="menuitem"]:has-text("Reports")');
    if (reportsItem) {
      await reportsItem.click();
      await page.waitForTimeout(2000);
      console.log('Tab Reports URL:', page.url());
      await page.screenshot({ path: `${ssDir}/05-tab-reports.png`, fullPage: true });
      const reportsContent = await page.evaluate(() => document.body.innerText.substring(0, 2000));
      console.log('Reports content:', reportsContent.substring(0, 1500));

      // Check report sub-tabs
      const subTabBtns = await page.$$eval('button:has-text("Pipeline"), button:has-text("Loss"), button:has-text("Channel"), button:has-text("Trend")',
        els => els.map(e => e.textContent?.trim()));
      console.log('Report sub-tabs:', JSON.stringify(subTabBtns));

      // Click each report sub-tab
      for (const subName of ['Pipeline & Conversion', 'Loss & Quality', 'Channel Performance', 'Trend & Forecast']) {
        try {
          const btn = await page.$(`button:has-text("${subName}"), [role="tab"]:has-text("${subName}")`);
          if (btn) {
            await btn.click();
            await page.waitForTimeout(1500);
            const safeName = subName.toLowerCase().replace(/[^a-z]/g, '-');
            await page.screenshot({ path: `${ssDir}/08-report-${safeName}.png`, fullPage: true });
            console.log(`Report sub-tab ${subName}: loaded`);
          }
        } catch(e) { console.log(`Report sub-tab ${subName} error:`, e.message); }
      }
    }

    // Click Library
    const menuTrigger2 = await page.$('[class*="DropdownMenuTrigger"], button:has-text("Reports"), button:has-text("Menu")');
    if (menuTrigger2) {
      await menuTrigger2.click();
      await page.waitForTimeout(500);
    }
    const libraryItem = await page.$('[role="menuitem"]:has-text("Library")');
    if (libraryItem) {
      await libraryItem.click();
      await page.waitForTimeout(2000);
      console.log('Tab Library URL:', page.url());
      await page.screenshot({ path: `${ssDir}/05-tab-library.png`, fullPage: true });
      const libContent = await page.evaluate(() => document.body.innerText.substring(0, 1500));
      console.log('Library content:', libContent.substring(0, 1000));
    }

    // Click Hunches
    const menuTrigger3 = await page.$('[class*="DropdownMenuTrigger"], button:has-text("Library"), button:has-text("Menu")');
    if (menuTrigger3) {
      await menuTrigger3.click();
      await page.waitForTimeout(500);
    }
    const hunchesItem = await page.$('[role="menuitem"]:has-text("Hunches")');
    if (hunchesItem) {
      await hunchesItem.click();
      await page.waitForTimeout(2000);
      console.log('Tab Hunches URL:', page.url());
      await page.screenshot({ path: `${ssDir}/05-tab-hunches.png`, fullPage: true });
      const hunchContent = await page.evaluate(() => document.body.innerText.substring(0, 1000));
      console.log('Hunches content:', hunchContent.substring(0, 800));
    }

    // Click Activity
    const menuTrigger4 = await page.$('[class*="DropdownMenuTrigger"], button:has-text("Hunches"), button:has-text("Menu")');
    if (menuTrigger4) {
      await menuTrigger4.click();
      await page.waitForTimeout(500);
    }
    const activityItem = await page.$('[role="menuitem"]:has-text("Activity")');
    if (activityItem) {
      await activityItem.click();
      await page.waitForTimeout(2000);
      console.log('Tab Activity URL:', page.url());
      await page.screenshot({ path: `${ssDir}/05-tab-activity.png`, fullPage: true });
      const actContent = await page.evaluate(() => document.body.innerText.substring(0, 1000));
      console.log('Activity content:', actContent.substring(0, 800));
    }

    // Back to Dashboard
    const menuTrigger5 = await page.$('[class*="DropdownMenuTrigger"], button:has-text("Activity"), button:has-text("Menu")');
    if (menuTrigger5) {
      await menuTrigger5.click();
      await page.waitForTimeout(500);
    }
    const dashItem = await page.$('[role="menuitem"]:has-text("Dashboard")');
    if (dashItem) {
      await dashItem.click();
      await page.waitForTimeout(2000);
      console.log('Tab Dashboard URL:', page.url());
      await page.screenshot({ path: `${ssDir}/05-tab-dashboard.png`, fullPage: true });
    }
  } else {
    console.log('No menu trigger found');
  }

  // F5: Drill-down modals
  console.log('\n=== F5: DRILL-DOWN MODALS ===');
  const clickableMetrics = await page.$$eval('[class*="card"]:not([class*="card-"]) h3, [class*="Card"] h3, [class*="metric"] span, [role="button"]',
    els => els.map(e => ({ text: e.textContent?.trim().substring(0, 60), tag: e.tagName })));
  console.log('Clickable metric elements:', JSON.stringify(clickableMetrics.slice(0, 15), null, 2));

  // Click Hot Leads
  try {
    const hotLeadsLink = await page.$('text=Hot Leads');
    if (hotLeadsLink) {
      await hotLeadsLink.click();
      await page.waitForTimeout(2000);
      console.log('Clicked Hot Leads');
      await page.screenshot({ path: `${ssDir}/06-hot-leads-modal.png`, fullPage: true });
      const modalText = await page.evaluate(() => {
        const modal = document.querySelector('[role="dialog"], [class*="modal"], [class*="Modal"], [class*="Dialog"]');
        return modal ? modal.innerText.substring(0, 500) : 'NO MODAL FOUND';
      });
      console.log('Hot Leads modal content:', modalText);
      const closeBtn = await page.$('[role="dialog"] button, [class*="DialogClose"], button[aria-label="Close"]');
      if (closeBtn) await closeBtn.click();
      await page.waitForTimeout(500);
    } else {
      console.log('Hot Leads element not found');
    }
  } catch(e) { console.log('Hot Leads click error:', e.message); }

  // Click Win Rate
  try {
    const winRate = await page.$('text=Win Rate');
    if (winRate) {
      await winRate.click();
      await page.waitForTimeout(2000);
      console.log('Clicked Win Rate');
      await page.screenshot({ path: `${ssDir}/07-win-rate-modal.png`, fullPage: true });
      const modalText = await page.evaluate(() => {
        const modal = document.querySelector('[role="dialog"], [class*="modal"], [class*="Modal"], [class*="Dialog"]');
        return modal ? modal.innerText.substring(0, 500) : 'NO MODAL FOUND';
      });
      console.log('Win Rate modal content:', modalText);
      const closeBtn = await page.$('[role="dialog"] button, [class*="DialogClose"], button[aria-label="Close"]');
      if (closeBtn) await closeBtn.click();
    }
  } catch(e) { console.log('Win Rate error:', e.message); }

  // Click Show Rate
  try {
    const showRate = await page.$('text=Show Rate');
    if (showRate) {
      await showRate.click();
      await page.waitForTimeout(2000);
      console.log('Clicked Show Rate');
      await page.screenshot({ path: `${ssDir}/07b-show-rate-modal.png`, fullPage: true });
      const closeBtn = await page.$('[role="dialog"] button, [class*="DialogClose"], button[aria-label="Close"]');
      if (closeBtn) await closeBtn.click();
    }
  } catch(e) { console.log('Show Rate error:', e.message); }

  // F8: Filters
  console.log('\n=== F8: DATE RANGE / FILTERS ===');
  const filterElements = await page.$$eval('select, [class*="filter"], [class*="Filter"], input[type="date"], [class*="period"], [class*="Period"]',
    els => els.map(e => ({ tag: e.tagName, text: e.textContent?.trim().substring(0, 80), class: e.className?.substring(0, 60) })));
  console.log('Filter elements:', JSON.stringify(filterElements.slice(0, 10), null, 2));

  // CSV Export
  console.log('\n=== CSV EXPORT CHECK ===');
  const exportBtn = await page.$('button:has-text("Export"), button:has-text("CSV"), button:has-text("Download")');
  if (exportBtn) {
    console.log('Export button found:', await exportBtn.textContent());
    // Try clicking export
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 5000 }).catch(() => null),
      exportBtn.click()
    ]);
    if (download) {
      console.log('CSV download triggered:', download.suggestedFilename());
    } else {
      console.log('No download triggered from export button');
    }
  } else {
    console.log('No export button visible on dashboard');
  }

  // F6: Contact actions
  console.log('\n=== F6: CONTACT ACTIONS ===');
  const contactActions = await page.$$eval('a[href^="tel:"], a[href^="sms:"], button:has-text("Call"), button:has-text("SMS"), button:has-text("Email"), [class*="contact"], [class*="action"]',
    els => els.map(e => ({ tag: e.tagName, text: e.textContent?.trim().substring(0, 80), href: e.getAttribute('href') })));
  console.log('Contact actions:', JSON.stringify(contactActions.slice(0, 10), null, 2));

  // Sidebar Insights link check
  console.log('\n=== SIDEBAR INSIGHTS LINK CHECK ===');
  const sidebarLinks = await page.$$eval('nav a, aside a, [class*="sidebar"] a, [class*="Sidebar"] a',
    els => els.map(e => ({ text: e.textContent?.trim().substring(0, 40), href: e.getAttribute('href') })));
  console.log('Sidebar links:', JSON.stringify(sidebarLinks, null, 2));
  const hasInsightsLink = sidebarLinks.some(l => l.href?.includes('/insights') || l.text?.toLowerCase().includes('insight'));
  console.log('Has Insights sidebar link:', hasInsightsLink);

  // Final screenshot
  await page.screenshot({ path: `${ssDir}/11-final-overview.png`, fullPage: true });

  console.log('\n=== EVAL COMPLETE ===');
});
