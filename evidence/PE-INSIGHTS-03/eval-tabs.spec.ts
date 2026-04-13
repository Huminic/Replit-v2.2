import { test } from 'playwright/test';

test('PE-INSIGHTS-03 tabs + modals', async ({ page }) => {
  test.setTimeout(180000);
  const ssDir = 'evidence/PE-INSIGHTS-03/screenshots';

  // Login
  await page.goto('https://dev.huminicdev.com/auth');
  await page.waitForLoadState('networkidle');
  await page.fill('input[type="email"], input[name="email"]', 'serra_honda@huminic.ai');
  await page.fill('input[type="password"], input[name="password"]', 'NexxusTest2026');
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  // Navigate via SPA
  await page.evaluate(() => {
    window.history.pushState({}, '', '/insights');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  await page.waitForTimeout(3000);
  console.log('On insights:', page.url());
  await page.screenshot({ path: `${ssDir}/f1-dashboard-full.png`, fullPage: true });

  // Click each tab button directly (they have role="tab")
  const tabButtons = await page.$$('[role="tab"]');
  console.log('Tab buttons found:', tabButtons.length);
  for (const tabBtn of tabButtons) {
    const tabText = await tabBtn.textContent();
    console.log('\n--- Clicking tab:', tabText);
    await tabBtn.click();
    await page.waitForTimeout(2000);
    const safeName = (tabText || 'unknown').toLowerCase().trim().replace(/[^a-z]/g, '-');
    await page.screenshot({ path: `${ssDir}/f7-tab-${safeName}.png`, fullPage: true });
    const content = await page.evaluate(() => document.body.innerText.substring(0, 1500));
    console.log(`Tab ${tabText} URL:`, page.url());
    console.log(`Tab ${tabText} content:`, content.substring(0, 800));
  }

  // Go back to Dashboard tab for modals
  const dashTab = await page.$('[role="tab"]:has-text("Dashboard")');
  if (dashTab) {
    await dashTab.click();
    await page.waitForTimeout(2000);
  }

  // F5: Drill-down modals - Click metric card headers
  console.log('\n=== F5: DRILL-DOWN MODALS ===');

  // Hot Leads
  try {
    const el = await page.$('h3:has-text("Hot Leads"), div:has-text("Hot Leads Going Cold")');
    if (el) {
      await el.click();
      await page.waitForTimeout(2000);
      const dialogOpen = await page.$('[role="dialog"]');
      if (dialogOpen) {
        console.log('Hot Leads modal opened');
        const modalText = await dialogOpen.innerText();
        console.log('Hot Leads modal content:', modalText.substring(0, 800));
        await page.screenshot({ path: `${ssDir}/f5-hot-leads-modal.png`, fullPage: true });
        // Close
        const closeBtn = await page.$('[role="dialog"] button:has-text("Close"), [role="dialog"] button:has-text("X"), button[class*="close"]');
        if (closeBtn) await closeBtn.click();
        else await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
      } else {
        console.log('Hot Leads: no dialog opened');
      }
    }
  } catch(e) { console.log('Hot Leads error:', (e as Error).message); }

  // Win Rate
  try {
    const el = await page.$('h3:has-text("Win Rate"), div:has-text("Win Rate") >> nth=0');
    if (el) {
      await el.click();
      await page.waitForTimeout(2000);
      const dialogOpen = await page.$('[role="dialog"]');
      if (dialogOpen) {
        console.log('Win Rate modal opened');
        const modalText = await dialogOpen.innerText();
        console.log('Win Rate modal content:', modalText.substring(0, 800));
        await page.screenshot({ path: `${ssDir}/f5-win-rate-modal.png`, fullPage: true });
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
      } else {
        console.log('Win Rate: no dialog opened');
      }
    }
  } catch(e) { console.log('Win Rate error:', (e as Error).message); }

  // Pipeline Health "View Details"
  try {
    const viewDetails = await page.$$('button:has-text("View Details"), a:has-text("View Details")');
    console.log('View Details buttons found:', viewDetails.length);
    if (viewDetails.length > 0) {
      await viewDetails[0].click();
      await page.waitForTimeout(2000);
      const dialogOpen = await page.$('[role="dialog"]');
      if (dialogOpen) {
        console.log('Pipeline Health detail opened');
        const modalText = await dialogOpen.innerText();
        console.log('Pipeline Health detail:', modalText.substring(0, 800));
        await page.screenshot({ path: `${ssDir}/f5-pipeline-detail.png`, fullPage: true });
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
      } else {
        console.log('Pipeline Health: no dialog, checking page change');
        console.log('URL after click:', page.url());
        await page.screenshot({ path: `${ssDir}/f5-pipeline-detail.png`, fullPage: true });
      }
    }
  } catch(e) { console.log('Pipeline Health error:', (e as Error).message); }

  // Performance Scorecard "View Details"
  try {
    const viewDetails = await page.$$('button:has-text("View Details"), a:has-text("View Details")');
    if (viewDetails.length > 1) {
      await viewDetails[1].click();
      await page.waitForTimeout(2000);
      const dialogOpen = await page.$('[role="dialog"]');
      if (dialogOpen) {
        console.log('Performance Scorecard detail opened');
        const modalText = await dialogOpen.innerText();
        console.log('Performance Scorecard detail:', modalText.substring(0, 800));
        await page.screenshot({ path: `${ssDir}/f5-scorecard-detail.png`, fullPage: true });
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
      }
    }
  } catch(e) { console.log('Scorecard error:', (e as Error).message); }

  // CSV export button
  try {
    const csvBtn = await page.$('button:has-text("CSV"), button:has-text("Export")');
    if (csvBtn) {
      console.log('CSV button found:', await csvBtn.textContent());
      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 5000 }).catch(() => null),
        csvBtn.click()
      ]);
      if (download) {
        console.log('CSV download triggered:', download.suggestedFilename());
      } else {
        console.log('CSV: no download triggered');
      }
    } else {
      console.log('No CSV/Export button found');
    }
  } catch(e) { console.log('CSV error:', (e as Error).message); }

  // F6: Contact actions on the dashboard
  console.log('\n=== F6: CONTACT ACTIONS ===');
  const contactEls = await page.$$eval('a[href^="tel:"], a[href^="sms:"], button:has-text("Call"), button:has-text("SMS"), button:has-text("Email")',
    els => els.map(e => ({ tag: e.tagName, text: e.textContent?.trim().substring(0, 60), href: (e as HTMLAnchorElement).href || '' })));
  console.log('Contact elements:', JSON.stringify(contactEls, null, 2));

  // Reports tab sub-tabs
  console.log('\n=== REPORTS SUB-TABS ===');
  const reportsTab = await page.$('[role="tab"]:has-text("Reports")');
  if (reportsTab) {
    await reportsTab.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${ssDir}/f3-reports-main.png`, fullPage: true });
    const reportContent = await page.evaluate(() => document.body.innerText.substring(0, 3000));
    console.log('Reports tab content:', reportContent.substring(0, 2000));

    // Try clicking sub-tabs
    for (const sub of ['Pipeline & Conversion', 'Loss & Quality', 'Channel Performance', 'Trend & Forecast']) {
      try {
        const btn = await page.$(`button:has-text("${sub}"), [role="tab"]:has-text("${sub}")`);
        if (btn) {
          await btn.click();
          await page.waitForTimeout(1500);
          const safeName = sub.toLowerCase().replace(/[^a-z]/g, '-');
          await page.screenshot({ path: `${ssDir}/f3-report-${safeName}.png`, fullPage: true });
          console.log(`Report ${sub}: loaded`);
          // Scroll down for more content
          await page.evaluate(() => window.scrollTo(0, 500));
          await page.waitForTimeout(500);
          await page.screenshot({ path: `${ssDir}/f3-report-${safeName}-scrolled.png`, fullPage: true });
        } else {
          console.log(`Report ${sub}: button not found`);
        }
      } catch(e) { console.log(`Report ${sub} error:`, (e as Error).message); }
    }
  }

  // Library tab detail
  console.log('\n=== LIBRARY TAB ===');
  const libTab = await page.$('[role="tab"]:has-text("Library")');
  if (libTab) {
    await libTab.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${ssDir}/f4-library-main.png`, fullPage: true });
    const libContent = await page.evaluate(() => document.body.innerText.substring(0, 2000));
    console.log('Library content:', libContent.substring(0, 1500));
  }

  // Sidebar check
  console.log('\n=== SIDEBAR CHECK ===');
  const sidebarLinks = await page.$$eval('nav a, [class*="sidebar"] a, [class*="Sidebar"] a',
    els => els.map(e => ({ text: e.textContent?.trim(), href: (e as HTMLAnchorElement).getAttribute('href') })));
  console.log('Sidebar links:', JSON.stringify(sidebarLinks, null, 2));

  // F8: Filters
  console.log('\n=== F8: FILTERS ===');
  // Go back to dashboard
  const dashTab2 = await page.$('[role="tab"]:has-text("Dashboard")');
  if (dashTab2) {
    await dashTab2.click();
    await page.waitForTimeout(2000);
  }
  const filterEls = await page.$$eval('select, [class*="filter"], [class*="Filter"], input[type="date"], [class*="date-range"], [class*="DateRange"]',
    els => els.map(e => ({ tag: e.tagName, text: e.textContent?.trim().substring(0, 60), class: e.className?.substring(0, 60) })));
  console.log('Filter elements:', JSON.stringify(filterEls.slice(0, 10), null, 2));

  console.log('\n=== EVAL COMPLETE ===');
});
