import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:5000';

const routes = [
  { path: '/', name: '01-home-main' },
  { path: '/agents', name: '02-agents' },
  { path: '/agents/create', name: '03-agents-create' },
  { path: '/drive', name: '04-drive' },
  { path: '/insights', name: '05-insights' },
  { path: '/work-center', name: '06-work-center' },
  { path: '/activity', name: '07-activity' },
  { path: '/settings/system', name: '08-settings' },
  { path: '/profile', name: '09-profile' },
  { path: '/profile/preferences', name: '10-profile-preferences' },
  { path: '/profile/billing', name: '11-profile-billing' },
  { path: '/w/demo', name: '12-widget-landing' },
];

async function takeScreenshots() {
  const browser = await chromium.launch({ headless: true });

  // Desktop screenshots
  const desktopContext = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });
  const desktopPage = await desktopContext.newPage();

  for (const route of routes) {
    try {
      await desktopPage.goto(`${BASE_URL}${route.path}`, { waitUntil: 'networkidle', timeout: 15000 });
      await desktopPage.waitForTimeout(1500);
      await desktopPage.screenshot({
        path: `screenshots/${route.name}-desktop.png`,
        fullPage: true,
      });
      console.log(`✓ Desktop: ${route.name}`);
    } catch (e) {
      console.log(`✗ Desktop: ${route.name} - ${(e as Error).message}`);
    }
  }
  await desktopContext.close();

  // Mobile screenshots
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
  });
  const mobilePage = await mobileContext.newPage();

  for (const route of routes) {
    try {
      await mobilePage.goto(`${BASE_URL}${route.path}`, { waitUntil: 'networkidle', timeout: 15000 });
      await mobilePage.waitForTimeout(1500);
      await mobilePage.screenshot({
        path: `screenshots/${route.name}-mobile.png`,
        fullPage: true,
      });
      console.log(`✓ Mobile: ${route.name}`);
    } catch (e) {
      console.log(`✗ Mobile: ${route.name} - ${(e as Error).message}`);
    }
  }
  await mobileContext.close();

  // Dark mode desktop screenshots
  const darkContext = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    colorScheme: 'dark',
  });
  const darkPage = await darkContext.newPage();

  for (const route of routes) {
    try {
      await darkPage.goto(`${BASE_URL}${route.path}`, { waitUntil: 'networkidle', timeout: 15000 });
      await darkPage.waitForTimeout(1500);
      await darkPage.screenshot({
        path: `screenshots/${route.name}-dark.png`,
        fullPage: true,
      });
      console.log(`✓ Dark: ${route.name}`);
    } catch (e) {
      console.log(`✗ Dark: ${route.name} - ${(e as Error).message}`);
    }
  }
  await darkContext.close();

  await browser.close();
  console.log('\nDone! Screenshots saved to screenshots/');
}

takeScreenshots().catch(console.error);
