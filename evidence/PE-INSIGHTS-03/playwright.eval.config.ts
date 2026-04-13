import { defineConfig } from "playwright/test";

export default defineConfig({
  testDir: "/home/ubuntu/Claude-store/nexxus2.2_replit/evidence/PE-INSIGHTS-03",
  testMatch: /eval-tabs\.spec\.ts/,
  timeout: 180000,
  retries: 0,
  use: {
    baseURL: "https://dev.huminicdev.com",
    headless: true,
    viewport: { width: 1440, height: 900 },
  },
  projects: [
    {
      name: "eval",
      testMatch: /eval-tabs\.spec\.ts/,
    },
  ],
});
