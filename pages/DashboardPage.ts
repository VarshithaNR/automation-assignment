import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * DashboardPage – Control Room navigation
 *
 * AA CE left nav items observed: Home, Bots (Automation), Devices,
 * Activity, Insights, Bot Store, AI, Administration
 */
export class DashboardPage extends BasePage {
  // Left navigation – AA CE uses <a> tags with routerLink or href
  private readonly automationNavLink = this.page.locator([
    'a[href*="automation"]',
    'a[href*="bots"]',
    '[data-testid="nav-automation"]',
    'li.nav-item a:has-text("Automation")',
    '.side-nav a:has-text("Automation")',
    'nav a:has-text("Bots")',
    '.sidebar a:has-text("Automation")',
  ].join(', '));

  private readonly aiNavLink = this.page.locator([
    'a[href*="/ai"]',
    'a[href*="iq-bot"]',
    'li.nav-item a:has-text("AI")',
    '.side-nav a:has-text("AI")',
  ].join(', '));

  // Create button/dropdown (appears in Automation section header)
  private readonly createButton = this.page.locator([
    'button:has-text("Create")',
    '[data-testid="create-btn"]',
    '.create-button',
    'button.btn:has-text("Create")',
    '[aria-label="Create"]',
  ].join(', '));

  // Dropdown menu items
  private readonly taskBotOption = this.page.locator([
    '[role="menuitem"]:has-text("Task Bot")',
    '.dropdown-menu li:has-text("Task Bot")',
    '.dropdown-item:has-text("Task Bot")',
    'li:has-text("Task Bot") a',
    'a:has-text("Task Bot")',
  ].join(', '));

  private readonly formOption = this.page.locator([
    '[role="menuitem"]:has-text("Form")',
    '.dropdown-menu li:has-text("Form")',
    '.dropdown-item:has-text("Form")',
    'li:has-text("Form") a',
    'a:has-text("Form")',
  ].join(', '));

  constructor(page: Page) {
    super(page);
  }

  async goToAutomation(): Promise<void> {
    // Try clicking the nav link
    const link = this.automationNavLink.first();
    await link.waitFor({ state: 'visible', timeout: 20000 });
    await link.click();
    await this.page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
    await this.page.waitForTimeout(2000);
  }

  async goToAITab(): Promise<void> {
    const link = this.aiNavLink.first();
    await link.waitFor({ state: 'visible', timeout: 20000 });
    await link.click();
    await this.page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
    await this.page.waitForTimeout(2000);
  }

  async openCreateDropdown(): Promise<void> {
    const btn = this.createButton.first();
    await btn.waitFor({ state: 'visible', timeout: 20000 });
    await btn.click();
    await this.page.waitForTimeout(800);
  }

  async selectTaskBot(): Promise<void> {
    await this.openCreateDropdown();
    const option = this.taskBotOption.first();
    await option.waitFor({ state: 'visible', timeout: 10000 });
    await option.click();
    await this.page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
    await this.page.waitForTimeout(2000);
  }

  async selectForm(): Promise<void> {
    await this.openCreateDropdown();
    const option = this.formOption.first();
    await option.waitFor({ state: 'visible', timeout: 10000 });
    await option.click();
    await this.page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
    await this.page.waitForTimeout(2000);
  }

  async assertAutomationNavVisible(): Promise<void> {
    await expect(this.automationNavLink.first()).toBeVisible({ timeout: 20000 });
  }

  async assertCreateButtonVisible(): Promise<void> {
    await expect(this.createButton.first()).toBeVisible({ timeout: 20000 });
  }
}
