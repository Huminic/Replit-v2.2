import { test, expect } from 'playwright/test';

test.describe('Test group', () => {
  test('seed', async ({ page }) => {
    await page.goto('https://dev.huminicdev.com/p/serra-honda', { waitUntil: 'domcontentloaded' });
  });
});
