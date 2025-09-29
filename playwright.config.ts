import { defineConfig, devices } from "@playwright/test";

/**
 * Cloudflare Playwright Configuration
 * This config is optimized for Cloudflare Workers with Browser Rendering
 */
export default defineConfig({
  testDir: "./src",
  /* Run tests in files in parallel */
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: "html",
  /* Shared settings for all the projects below. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: "https://cloudflare-playwright-example.airelabs.workers.dev/",

    /* Collect trace when retrying the failed test. */
    trace: "on-first-retry",

    /* Timeout settings optimized for Cloudflare Workers */
    actionTimeout: 30000, // 30 seconds for individual actions
    navigationTimeout: 60000, // 60 seconds for navigation

    /* Screenshot settings */
    screenshot: "only-on-failure",

    /* Video settings */
    video: "retain-on-failure",
  },

  /* Global test timeout */
  timeout: 120000, // 2 minutes for entire test

  /* Configure projects for Cloudflare Browser Rendering */
  projects: [
    {
      name: "cloudflare-chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Cloudflare-specific browser settings
        launchOptions: {
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-accelerated-2d-canvas",
            "--no-first-run",
            "--no-zygote",
            "--disable-gpu",
          ],
        },
      },
    },
  ],

  /* Web server configuration for local development */
  webServer: {
    command: "wrangler dev",
    url: "http://localhost:8787",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
