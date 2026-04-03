import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * LoginPage – handles Automation Anywhere CE login
 *
 * AA CE login page: https://community.cloud.automationanywhere.digital/#/login
 * The page uses an Angular SPA. After submitting credentials the app
 * redirects to /#/index (home dashboard).
 *
 * IMPORTANT: Set USERNAME and PASSWORD in your .env file before running.
 */
export class LoginPage extends BasePage {
  // Selectors observed in AA CE login page HTML
  private readonly usernameInput = this.page.locator(
    'input[name="username"], input[id="username"], input[placeholder*="username" i], input[placeholder*="email" i], input[type="email"], input[formcontrolname="username"]'
  );
  private readonly passwordInput = this.page.locator(
    'input[name="password"], input[id="password"], input[type="password"], input[formcontrolname="password"]'
  );
  private readonly loginButton = this.page.locator(
    'button[type="submit"], button:has-text("Log in"), button:has-text("Login"), button:has-text("Sign in"), input[type="submit"]'
  );
  private readonly errorMessage = this.page.locator(
    '.alert, .error, [class*="error-message"], [class*="alert-danger"], [role="alert"]'
  );

  constructor(page: Page) {
    super(page);
  }

  /** Open the login page directly */
  async open(): Promise<void> {
    await this.page.goto('https://community.cloud.automationanywhere.digital/', {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    // Wait for the SPA to resolve to the login route
    await this.page.waitForTimeout(3000);
  }

  /**
   * Full login flow.
   * The app redirects to /#/login on first load; after auth it goes to /#/index.
   */
  async login(username: string, password: string): Promise<void> {
    await this.open();

    // Wait for username field to appear (SPA may take a moment)
    try {
      await this.usernameInput.first().waitFor({ state: 'visible', timeout: 30000 });
    } catch {
      // Try navigating directly to the login hash route
      await this.page.goto('https://community.cloud.automationanywhere.digital/#/login', {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });
      await this.usernameInput.first().waitFor({ state: 'visible', timeout: 20000 });
    }

    // Fill username
    await this.usernameInput.first().clear();
    await this.usernameInput.first().fill(username);
    await this.page.waitForTimeout(500);

    // Fill password
    await this.passwordInput.first().clear();
    await this.passwordInput.first().fill(password);
    await this.page.waitForTimeout(500);

    // Submit
    await this.loginButton.first().click();

    // Wait for navigation away from login — AA CE goes to /#/index
    await this.page.waitForTimeout(3000);
    await this.page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
  }

  /** Assert login succeeded by checking URL no longer contains /login */
  async assertLoginSuccess(): Promise<void> {
    // AA CE redirects to /#/index after successful login
    try {
      await this.page.waitForURL(
        url => !url.toString().includes('/login'),
        { timeout: 20000 }
      );
    } catch {
      const url = this.page.url();
      const pageContent = await this.page.content();
      throw new Error(
        `Login failed – still on login page.\nURL: ${url}\n` +
        `Hint: Check USERNAME/PASSWORD in your .env file.\n` +
        `Page title: ${await this.page.title()}`
      );
    }
  }

  async assertUsernameFieldVisible(): Promise<void> {
    await expect(this.usernameInput.first()).toBeVisible({ timeout: 15000 });
  }

  async assertPasswordFieldVisible(): Promise<void> {
    await expect(this.passwordInput.first()).toBeVisible({ timeout: 15000 });
  }

  async assertLoginButtonVisible(): Promise<void> {
    await expect(this.loginButton.first()).toBeVisible({ timeout: 15000 });
  }

  async assertAllLoginElementsVisible(): Promise<void> {
    await this.assertUsernameFieldVisible();
    await this.assertPasswordFieldVisible();
    await this.assertLoginButtonVisible();
  }
}
