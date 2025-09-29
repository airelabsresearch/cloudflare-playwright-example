import { test as base, Page } from "@playwright/test";
import {
  authenticateWithWorkOS,
  ensureAuthenticated,
  isAuthenticated,
} from "../utils/auth";

// Delay utility
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Extend the base test with authentication
export const test = base.extend<{
  authenticatedPage: Page;
  publicPage: Page;
}>({
  authenticatedPage: async ({ page }, use) => {
    // Set longer timeouts for authenticated pages
    page.setDefaultTimeout(40000); // 60 seconds
    page.setDefaultNavigationTimeout(40000); // 60 seconds

    // Authenticate the user before each test
    await ensureAuthenticated(page);

    // Add delay before test starts
    await delay(1000); // 1 second delay

    // Pass the authenticated page to the test
    await use(page);

    // Add delay after test completes
    await delay(1000); // 1 second delay after each test

    // Clean up page state (but keep auth)
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");
  },

  publicPage: async ({ page }, use) => {
    // Set standard timeouts for public pages
    page.setDefaultTimeout(15000); // 30 seconds
    page.setDefaultNavigationTimeout(15000); // 30 seconds

    // Ensure we're not authenticated for public page tests
    const authenticated = await isAuthenticated(page);
    if (authenticated) {
      await page.context().clearCookies();
    }

    // Add delay before test starts
    await delay(1000);

    // Pass the public page to the test
    await use(page);

    // Add delay after test completes
    await delay(1000);

    // Clean up after public page tests
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  },
});

export { expect } from "@playwright/test";
