import { defineConfig } from "playwright/test";
import dotenv from "dotenv";
dotenv.config();

export default defineConfig({
  testDir: "./tests/agents/generated",
  timeout: 60_000,
  retries: 0,
  use: {
    baseURL: process.env.BASE_URL || "https://dev.huminicdev.com",
    headless: true,
    screenshot: "only-on-failure",
    viewport: { width: 1280, height: 720 },
  },
  reporter: [["list"]],
});
