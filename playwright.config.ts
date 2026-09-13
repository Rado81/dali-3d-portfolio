import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  retries: 1,
  use: {
    baseURL: "http://localhost:4173",
    trace: "retain-on-failure",
    launchOptions: { args: ["--use-gl=angle", "--use-angle=swiftshader", "--ignore-gpu-blocklist"] },
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] }, testIgnore: /dev\.spec\.ts/ },
    // development mode runs React's StrictMode, which the production build never does
    { name: "dev", use: { ...devices["Desktop Chrome"], baseURL: "http://localhost:5175" }, testMatch: /dev\.spec\.ts/ },
  ],
  webServer: [
    {
      command: "npm run build && npm run preview -- --port 4173 --strictPort",
      url: "http://localhost:4173",
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
    {
      command: "npm run dev -- --port 5175 --strictPort",
      url: "http://localhost:5175",
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  ],
});
