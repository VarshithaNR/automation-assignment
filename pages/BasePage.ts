import { Page, Locator, expect } from '@playwright/test';

/**
 * BasePage – shared helpers for all Page Objects
 */
export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /** Navigate to a relative path */
  async navigate(path: string = '') {
    await this.page.goto(path, { waitUntil: 'domcontentloaded' });
  }

  /** Wait for element to be visible, then return it */
  async waitForVisible(locator: Locator, timeout = 30000): Promise<Locator> {
    await locator.waitFor({ state: 'visible', timeout });
    return locator;
  }

  /** Click element after ensuring it is visible */
  async safeClick(locator: Locator, timeout = 30000): Promise<void> {
    await this.waitForVisible(locator, timeout);
    await locator.click();
  }

  /** Fill input after clearing it */
  async safeFill(locator: Locator, value: string): Promise<void> {
    await this.waitForVisible(locator);
    await locator.clear();
    await locator.fill(value);
  }

  /** Assert element is visible */
  async assertVisible(locator: Locator, description?: string): Promise<void> {
    await expect(locator, description).toBeVisible();
  }

  /** Assert element contains text */
  async assertText(locator: Locator, text: string): Promise<void> {
    await expect(locator).toContainText(text);
  }

  /** Wait for page to fully load */
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  /** Take a screenshot with a descriptive name */
  async screenshot(name: string): Promise<void> {
    await this.page.screenshot({ path: `test-results/screenshots/${name}.png`, fullPage: true });
  }

  /** Get current URL */
  getCurrentUrl(): string {
    return this.page.url();
  }

  /** Wait for URL to match pattern */
  async waitForUrl(pattern: string | RegExp, timeout = 30000): Promise<void> {
    await this.page.waitForURL(pattern, { timeout });
  }

  /** Select option from dropdown by label */
  async selectOption(locator: Locator, value: string): Promise<void> {
    await this.waitForVisible(locator);
    await locator.selectOption({ label: value });
  }
}
