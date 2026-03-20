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
      name: "seed",
      testMatch: /seed\.spec\.ts/,
      use: {
        baseURL: "http://localhost:5000",
        viewport: { width: 1280, height: 720 },
      },
    },
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
    {
      name: "catalog",
      testMatch: /usability-audit\.spec\.ts/,
      use: {
        baseURL: "http://localhost:5000",
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: "comms",
      testMatch: /live-comms\.spec\.ts/,
      use: { baseURL: "http://localhost:5000" },
    },
    {
      name: "e2e",
      testMatch: /e2e-flows\.spec\.ts/,
      use: { baseURL: "http://localhost:5000" },
    },
    {
      name: "real-integrations",
      testMatch: /real-integrations\.spec\.ts/,
      use: { baseURL: "http://localhost:5000" },
      timeout: 120_000,
    },
    {
      name: "deep-coverage",
      testMatch: /deep-coverage\.spec\.ts/,
      use: { baseURL: "http://localhost:5000" },
      timeout: 120_000,
    },
    {
      name: "generated",
      testMatch: /generated-coverage\.spec\.ts/,
      use: {
        baseURL: "http://localhost:5000",
        viewport: { width: 1280, height: 720 },
      },
      timeout: 120_000,
    },
    {
      name: "visual",
      testMatch: /visual-components\.spec\.ts/,
      use: {
        baseURL: "http://localhost:5000",
        viewport: { width: 1280, height: 720 },
      },
      timeout: 180_000,
    },
  ],
  reporter: [
    ["list"],
    ["json", { outputFile: "evidence/T-2/test-results.json" }],
  ],
});
