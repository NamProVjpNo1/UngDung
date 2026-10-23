import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  timeout: 45000,
  use: {
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
    },
    baseURL: "http://127.0.0.1:8000",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "../.venv/bin/python ../scripts/e2e_server.py",
    url: "http://127.0.0.1:8000/api/v1/system/health",
    reuseExistingServer: false,
    timeout: 30000,
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    {
      name: "mobile",
      use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" },
    },
  ],
});
