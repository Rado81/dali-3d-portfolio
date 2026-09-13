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
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run build && npm run preview -- --port 4173 --strictPort",
    url: "http://localhost:4173",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
