import { defineConfig } from "playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  retries: 0,
  use: {
    baseURL: "http://localhost:5000",
    headless: true,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "api",
      testMatch: /domain-(04|05|10|11|12).*\.spec\.ts/,
      use: { baseURL: "http://localhost:5000" },
    },
    {
      name: "browser",
      testMatch: /domain-(01|02|03|06|07|08|09).*\.spec\.ts/,
      use: {
        baseURL: "http://localhost:5000",
        viewport: { width: 1280, height: 720 },
      },
    },
  ],
  reporter: [
    ["list"],
    ["json", { outputFile: "evidence/test-results.json" }],
  ],
});
