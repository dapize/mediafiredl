import puppeteer, { Browser as BrowserPuppeteer, Page } from "puppeteer";
import { userAgent } from "./userAgent";

interface ILinkData {
  href: string;
  fileName: string;
}

export class Browser {
  browser: BrowserPuppeteer;
  page: Page | null;
  private static instance: Browser;

  constructor() {
    if (typeof Browser.instance === 'object') {
      return Browser.instance;
    }
    Browser.instance = this;
    this.page = null;
  }

  async init () {
    if (this.browser) return;
    this.browser = await puppeteer.launch();
  }

  async newPage () {
    if (!this.browser) {
      await this.init();
    }
    const page = await this.browser.newPage();
    await page.setExtraHTTPHeaders({
      'user-agent': userAgent,
      'custom-header': '1',
    });
    await page.setViewport({width: 1366, height: 768});
    this.page = page;
  }

  async getDataLink(url: string): Promise<ILinkData> {
    if (!this.page) {
      await this.newPage();
    }

    const page = this.page as Page;
    await page.goto(url, {
      waitUntil: "domcontentloaded",
    });
    const href = await page.evaluate(() => (document.getElementById('downloadButton') as HTMLAnchorElement).href);
    const fileName = await page.evaluate(() => (document.querySelector('.dl-btn-label') as HTMLElement).title);

    return {
      href,
      fileName
    }
  }

  async close() {
    if (!this.browser) return;
    await this.browser.close();
  }
}
