import { Page, expect } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { organization_url } from "./paths";

// Get the directory name equivalent to __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to store the authentication state
const AUTH_STATE_PATH = path.join(__dirname, "../.auth/user.json");

/**
 * Helper function to check if user is currently authenticated on the page
 * @param page - The Playwright page object
 * @returns Promise that resolves to true if authenticated, false otherwise
 */
async function checkCurrentAuthState(page: Page): Promise<boolean> {
  try {
    // Check for sign-in button - if it's visible, user is not authenticated
    const signInButton = page.getByRole("button", { name: "Sign In" });
    const isSignInVisible = await signInButton.isVisible().catch(() => true);

    // Also check if we're on the organization URL as additional verification
    const currentUrl = await page.url();
    const isOnOrgUrl = currentUrl.includes("/o/");

    // User is authenticated if sign-in button is not visible OR if we're on org URL
    return !isSignInVisible || isOnOrgUrl;
  } catch (error) {
    console.error("Error checking current authentication state:", error);
    return false;
  }
}

/**
 * Helper function to authenticate a user using WorkOS credentials
 * @param page - The Playwright page object
 * @param forceLogin - Whether to force a new login even if auth state exists
 * @returns Promise that resolves when authentication is complete
 */
export async function authenticateWithWorkOS(
  page: Page,
  forceLogin = false
): Promise<void> {
  // Check if we have a stored authentication state

  if (!forceLogin && fs.existsSync(AUTH_STATE_PATH)) {
    try {
      // Load the stored authentication state
      await page
        .context()
        .addCookies(JSON.parse(fs.readFileSync(AUTH_STATE_PATH, "utf8")));

      // Navigate to the page to verify authentication state
      // await page.goto("/");
      // await page.waitForLoadState("networkidle", { timeout: 10000 });

      // Check if we're still authenticated
      const isAuthenticated = await checkCurrentAuthState(page);

      // If we're still authenticated, return early
      if (isAuthenticated) {
        console.log("User is already authenticated with stored cookies");
        return;
      }
      // Otherwise, continue with the login process
    } catch (error) {
      console.error("Error loading authentication state:", error);
      // Continue with the login process if there was an error
    }
  }

  // Ensure the auth directory exists
  const authDir = path.dirname(AUTH_STATE_PATH);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  // Check that the page has loaded
  await expect(page).toHaveTitle(/Falcon/);

  // Check if we're already authenticated
  const isAlreadyAuthenticated = await checkCurrentAuthState(page);
  if (isAlreadyAuthenticated) {
    console.log(
      "Already authenticated - on organization URL or no sign-in button visible"
    );
    return;
  }

  // Click the Sign In button
  const signInButton = page.getByRole("button", { name: "Sign In" });
  await expect(signInButton).toBeVisible();
  await signInButton.click();

  // We should be redirected to the WorkOS login page
  // Wait for the email input to be visible
  // await page.waitForLoadState("networkidle", { timeout: 30000 });

  await page.waitForLoadState("networkidle", { timeout: 30000 });

  // Wait for redirection to complete - either to WorkOS login or back to organization
  await page.waitForURL(
    (url) =>
      url.href.includes("workos.com") ||
      url.href.includes(organization_url) ||
      url.href.includes("auth") ||
      url.href.includes("login"),
    { timeout: 30000 }
  );

  if ((await page.url()).includes(organization_url)) {
    console.log("Already authenticated");
    return;
  }

  const emailInput = page.locator('[name="email"]');
  await expect(emailInput).toBeVisible({ timeout: 10000 });

  // Enter email
  await emailInput.fill(process.env.WORKOS_TEST_EMAIL || "ai@airelabs.com");

  // Click the Continue button after entering email
  const continueButton = page.getByRole("button", { name: "Continue" });
  await expect(continueButton).toBeVisible();
  await continueButton.click();

  // Wait for redirection to password page
  const passwordInput = page.locator('[name="password"]');
  await expect(passwordInput).toBeVisible({ timeout: 15000 });

  // Enter password
  await passwordInput.fill(
    process.env.WORKOS_TEST_PASSWORD || "AIreLabsBeNDER"
  );

  // Click the Submit button using form [type="submit"] selector
  const submitButton = page.locator('form [value="password"]');
  await expect(submitButton).toBeVisible();
  await submitButton.click();

  // We should be redirected to the dashboard page
  // Wait for the dashboard to load with increased timeout
  //await page.waitForURL(organization_url, { timeout: 60000 });
  await page.waitForLoadState("networkidle", { timeout: 30000 });
  await expect(page).toHaveURL(organization_url);

  // Save the authentication state for future use
  const cookies = await page.context().cookies();
  fs.writeFileSync(AUTH_STATE_PATH, JSON.stringify(cookies, null, 2));
}

/**
 * Helper function to check if user is authenticated
 * @param page - The Playwright page object
 * @returns Promise that resolves to true if authenticated, false otherwise
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  try {
    await page.goto("/");
    await page.waitForLoadState("networkidle", { timeout: 5000 });

    return await checkCurrentAuthState(page);
  } catch (error) {
    console.error("Error checking authentication status:", error);
    return false;
  }
}

/**
 * Helper function to navigate to a specific page and verify authentication
 * @param page - The Playwright page object
 * @param path - The path to navigate to
 * @param requireAuth - Whether authentication is required for this page
 * @returns Promise that resolves when navigation is complete
 */
export async function navigateToPage(
  page: Page,
  path: string,
  requireAuth: boolean = true
): Promise<void> {
  if (requireAuth) {
    await ensureAuthenticated(page);
  }

  await page.goto(path);
  await expect(page).toHaveURL(
    new RegExp(path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
  );
}

/**
 * Helper function to navigate to a specific page without authentication checks
 * Use this when the page is already authenticated via fixtures
 * @param page - The Playwright page object
 * @param path - The path to navigate to
 * @returns Promise that resolves when navigation is complete
 */
export async function navigateToPageOnly(
  page: Page,
  path: string
): Promise<void> {
  await page.goto(path);
  await expect(page).toHaveURL(
    new RegExp(path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
  );
}

export async function ensureAuthenticated(page: Page): Promise<void> {
  // Quick check if we're already authenticated
  if (await isAuthenticated(page)) {
    return;
  }

  // Only authenticate if not already authenticated
  await authenticateWithWorkOS(page);
}

/**
 * Helper function to clear authentication state
 * @param page - The Playwright page object
 */
export async function clearAuthState(page: Page | null): Promise<void> {
  if (page) {
    await page.context().clearCookies();
  }
  if (fs.existsSync(AUTH_STATE_PATH)) {
    fs.unlinkSync(AUTH_STATE_PATH);
  }
}

/**
 * Helper function to debug authentication state
 * @param page - The Playwright page object
 * @returns Promise that resolves to debug information
 */
export async function debugAuthState(page: Page): Promise<{
  url: string;
  hasSignInButton: boolean;
  isOnOrgUrl: boolean;
  cookies: any[];
  isAuthenticated: boolean;
}> {
  const url = page.url();
  const signInButton = page.getByRole("button", { name: "Sign In" });
  const hasSignInButton = await signInButton.isVisible().catch(() => false);
  const isOnOrgUrl = url.includes("/o/");
  const cookies = await page.context().cookies();
  const isAuthenticated = await checkCurrentAuthState(page);

  return {
    url,
    hasSignInButton,
    isOnOrgUrl,
    cookies,
    isAuthenticated,
  };
}

// In tests/e2e-tests/utils/auth.ts
export async function resetPageState(page: Page): Promise<void> {
  // Clear page state but keep authentication
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
    // Clear any form data
    document.querySelectorAll("form").forEach((form) => form.reset());
  });

  // Navigate to home page to reset any page-specific state
  await page.goto("/");
  await page.waitForLoadState("networkidle");
}
