import { Browser, Page, BrowserContext } from "@cloudflare/playwright";

export interface CloudflarePlaywrightConfig {
  // Browser launch options
  browserOptions?: {
    headless?: boolean;
    args?: string[];
    timeout?: number;
  };

  // Page options
  pageOptions?: {
    viewport?: { width: number; height: number };
    userAgent?: string;
    timeout?: number;
  };

  // Screenshot options
  screenshotOptions?: {
    fullPage?: boolean;
    quality?: number;
    type?: "png" | "jpeg";
  };

  // PDF options
  pdfOptions?: {
    format?: "A4" | "A3" | "Letter";
    printBackground?: boolean;
    margin?: {
      top?: string;
      right?: string;
      bottom?: string;
      left?: string;
    };
  };
}

export const defaultConfig: CloudflarePlaywrightConfig = {
  browserOptions: {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--disable-gpu",
      "--disable-web-security",
      "--disable-features=VizDisplayCompositor",
    ],
    timeout: 30000,
  },

  pageOptions: {
    viewport: { width: 1280, height: 720 },
    timeout: 30000,
  },

  screenshotOptions: {
    fullPage: true,
    quality: 90,
    type: "png",
  },

  pdfOptions: {
    format: "A4",
    printBackground: true,
    margin: {
      top: "1cm",
      right: "1cm",
      bottom: "1cm",
      left: "1cm",
    },
  },
};

export class CloudflarePlaywrightManager {
  private browser: Browser | null = null;
  private config: CloudflarePlaywrightConfig;

  constructor(config: CloudflarePlaywrightConfig = defaultConfig) {
    this.config = { ...defaultConfig, ...config };
  }

  async launch(env: any): Promise<Browser> {
    this.browser = await launch(env.MYBROWSER, this.config.browserOptions);
    return this.browser;
  }

  async createPage(): Promise<Page> {
    if (!this.browser) {
      throw new Error("Browser not launched. Call launch() first.");
    }

    const page = await this.browser.newPage();

    if (this.config.pageOptions?.viewport) {
      await page.setViewportSize(this.config.pageOptions.viewport);
    }

    if (this.config.pageOptions?.userAgent) {
      await page.setUserAgent(this.config.pageOptions.userAgent);
    }

    if (this.config.pageOptions?.timeout) {
      page.setDefaultTimeout(this.config.pageOptions.timeout);
    }

    return page;
  }

  async takeScreenshot(page: Page, options?: any): Promise<Buffer> {
    const screenshotOptions = { ...this.config.screenshotOptions, ...options };
    return await page.screenshot(screenshotOptions);
  }

  async generatePDF(page: Page, options?: any): Promise<Buffer> {
    const pdfOptions = { ...this.config.pdfOptions, ...options };
    return await page.pdf(pdfOptions);
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}
