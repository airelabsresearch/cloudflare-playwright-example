import { test, expect } from "./fixtures/shared";
import { navigateToPageOnly } from "./utils/auth";
import { proformaPage } from "./utils/paths";
import { Page } from "@playwright/test";

test.describe("Proforma Page Scenarios", () => {
  test.beforeEach(
    async ({ authenticatedPage }: { authenticatedPage: Page }) => {
      await navigateToPageOnly(authenticatedPage, proformaPage);
    }
  );

  test("should access proforma page when authenticated", async ({
    authenticatedPage,
  }: {
    authenticatedPage: Page;
  }) => {
    // Verify we're on the proforma page
    await expect(authenticatedPage).toHaveURL(proformaPage);
    // Add specific proforma page assertions here
    const viewsHeading = authenticatedPage.getByText("Proforma").nth(1);
    await expect(viewsHeading).toBeVisible();
  });

  test("should redirect to login when not authenticated", async ({
    publicPage,
  }: {
    publicPage: Page;
  }) => {
    await publicPage.goto(proformaPage);

    // Should be redirected to login or home page
    await expect(publicPage).toHaveTitle("Sign in");
  });
});
