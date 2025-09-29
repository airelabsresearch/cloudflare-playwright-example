import { launch } from "@cloudflare/playwright";
import { expect } from "@cloudflare/playwright/test";
import {
  CloudflarePlaywrightManager,
  defaultConfig,
} from "./playwright-config";

// Example 1: Basic screenshot test
export async function basicScreenshotTest(env: any, url: string) {
  const browser = await launch(env.MYBROWSER);
  const page = await browser.newPage();

  try {
    await page.goto(url);
    const screenshot = await page.screenshot({ fullPage: true });
    await browser.close();

    return new Response(screenshot, {
      headers: { "Content-Type": "image/png" },
    });
  } catch (error) {
    await browser.close();
    throw error;
  }
}

// Example 2: Advanced configuration with custom settings
export async function advancedScreenshotTest(env: any, url: string) {
  const config = {
    ...defaultConfig,
    pageOptions: {
      viewport: { width: 1920, height: 1080 },
      userAgent: "Mozilla/5.0 (compatible; Cloudflare-Playwright/1.0)",
      timeout: 60000,
    },
    screenshotOptions: {
      fullPage: true,
      quality: 95,
      type: "png" as const,
    },
  };

  const manager = new CloudflarePlaywrightManager(config);

  try {
    await manager.launch(env);
    const page = await manager.createPage();

    await page.goto(url);
    const screenshot = await manager.takeScreenshot(page);

    return new Response(screenshot, {
      headers: { "Content-Type": "image/png" },
    });
  } finally {
    await manager.close();
  }
}

// Example 3: PDF generation test
export async function pdfGenerationTest(env: any, url: string) {
  const browser = await launch(env.MYBROWSER);
  const page = await browser.newPage();

  try {
    await page.goto(url);
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "1cm",
        right: "1cm",
        bottom: "1cm",
        left: "1cm",
      },
    });
    await browser.close();

    return new Response(pdf, {
      headers: { "Content-Type": "application/pdf" },
    });
  } catch (error) {
    await browser.close();
    throw error;
  }
}

// Example 4: Form interaction test
export async function formInteractionTest(
  env: any,
  url: string,
  formData: Record<string, string>
) {
  const browser = await launch(env.MYBROWSER);
  const page = await browser.newPage();

  try {
    await page.goto(url);

    // Fill form fields
    for (const [selector, value] of Object.entries(formData)) {
      await page.fill(selector, value);
    }

    // Take screenshot of filled form
    const screenshot = await page.screenshot({ fullPage: true });

    await browser.close();

    return new Response(screenshot, {
      headers: { "Content-Type": "image/png" },
    });
  } catch (error) {
    await browser.close();
    throw error;
  }
}

// Example 5: Performance testing with tracing
export async function performanceTest(env: any, url: string) {
  const browser = await launch(env.MYBROWSER);
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Start tracing
    await context.tracing.start({
      screenshots: true,
      snapshots: true,
      sources: true,
    });

    // Navigate and perform actions
    await page.goto(url);

    // Simulate user interactions
    await page.click("body"); // Click to ensure page is interactive
    await page.waitForLoadState("networkidle");

    // Stop tracing
    await context.tracing.stop({ path: "/tmp/trace.zip" });

    // Read trace file
    const fs = await import("fs");
    const traceData = await fs.promises.readFile("/tmp/trace.zip");

    await browser.close();

    return new Response(traceData, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="trace.zip"',
      },
    });
  } catch (error) {
    await browser.close();
    throw error;
  }
}
