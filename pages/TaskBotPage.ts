import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * TaskBotPage – covers Task Bot creation dialog + Bot Editor
 */
export class TaskBotPage extends BasePage {
  // ── Create Bot dialog ──
  private readonly botNameInput = this.page.locator(
    'input[name="name"], input[placeholder*="name" i], input[placeholder*="bot name" i], input[aria-label*="name" i]'
  );
  private readonly folderSelector = this.page.locator(
    '[class*="folder"], [data-testid*="folder"], .folder-select'
  );
  private readonly descriptionInput = this.page.locator(
    'textarea[name="description"], input[name="description"], textarea[placeholder*="description" i]'
  );
  private readonly createBotButton = this.page.locator(
    'button:has-text("Create"), [data-testid="create-submit"]'
  );
  private readonly cancelButton = this.page.locator('button:has-text("Cancel")');

  // ── Bot Editor ──
  private readonly actionsSearchInput = this.page.locator(
    'input[placeholder*="Search" i], input[aria-label*="search actions" i], [data-testid="actions-search"]'
  );
  private readonly actionsPanel = this.page.locator(
    '[class*="actions-panel"], [class*="action-list"], .actions, [data-testid="actions"]'
  );
  private readonly saveButton = this.page.locator(
    'button:has-text("Save"), [data-testid="save-btn"], .save-button'
  );
  private readonly editorCanvas = this.page.locator(
    '[class*="canvas"], [class*="editor-canvas"], [data-testid="bot-canvas"]'
  );
  private readonly successToast = this.page.locator(
    '[class*="toast"], [class*="notification"], [class*="success"], [role="alert"]'
  );

  // ── Message Box action ──
  private readonly messageBoxAction = this.page.locator(
    '[class*="action-item"]:has-text("Message box"), .action:has-text("Message box"), [data-action-name*="message" i]'
  );
  private readonly messageBoxTitle = this.page.locator(
    '[class*="properties"] input[placeholder*="title" i], [class*="config"] input[aria-label*="title" i]'
  );
  private readonly messageBoxBody = this.page.locator(
    '[class*="properties"] textarea, [class*="config"] textarea, [aria-label*="message" i]'
  );
  private readonly messageBoxCloseButton = this.page.locator(
    '[class*="properties"] input[aria-label*="button" i], [class*="close-button-text"]'
  );
  private readonly messageBoxTypeDropdown = this.page.locator(
    '[class*="properties"] select, [class*="message-type"] select'
  );

  constructor(page: Page) {
    super(page);
  }

  // ─── Dialog ───────────────────────────────────────────────────────────────

  /** Fill in the Task Bot creation form */
  async fillBotDetails(name: string, description?: string): Promise<void> {
    await this.waitForVisible(this.botNameInput);
    await this.safeFill(this.botNameInput, name);

    if (description) {
      const desc = this.descriptionInput;
      if (await desc.isVisible()) {
        await this.safeFill(desc, description);
      }
    }
  }

  /** Click the Create button in the dialog */
  async submitCreateDialog(): Promise<void> {
    await this.safeClick(this.createBotButton.first());
    // Wait for editor to load
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(2000);
  }

  // ─── Bot Editor ───────────────────────────────────────────────────────────

  /** Search for an action in the Actions panel */
  async searchAction(actionName: string): Promise<void> {
    await this.waitForVisible(this.actionsSearchInput);
    await this.safeFill(this.actionsSearchInput, actionName);
    await this.page.waitForTimeout(1000);
  }

  /** Double-click the Message Box action to add it to canvas */
  async addMessageBoxAction(): Promise<void> {
    await this.waitForVisible(this.messageBoxAction.first());
    await this.messageBoxAction.first().dblclick();
    await this.page.waitForTimeout(1500);
  }

  /** Fill Message Box properties in right panel */
  async fillMessageBoxProperties(options: {
    title?: string;
    message?: string;
    closeButtonText?: string;
  }): Promise<void> {
    if (options.title) {
      const titleInput = this.messageBoxTitle;
      if (await titleInput.isVisible()) {
        await this.safeFill(titleInput, options.title);
      }
    }
    if (options.message) {
      const bodyInput = this.messageBoxBody;
      if (await bodyInput.isVisible()) {
        await this.safeFill(bodyInput, options.message);
      }
    }
    if (options.closeButtonText) {
      const closeBtn = this.messageBoxCloseButton;
      if (await closeBtn.isVisible()) {
        await this.safeFill(closeBtn, options.closeButtonText);
      }
    }
  }

  /** Save the bot */
  async saveBot(): Promise<void> {
    await this.safeClick(this.saveButton.first());
    await this.page.waitForTimeout(2000);
  }

  // ─── Assertions ───────────────────────────────────────────────────────────

  async assertBotNameInputVisible(): Promise<void> {
    await this.assertVisible(this.botNameInput, 'Bot name input');
  }

  async assertCreateButtonVisible(): Promise<void> {
    await this.assertVisible(this.createBotButton.first(), 'Create button in dialog');
  }

  async assertEditorLoaded(): Promise<void> {
    await this.assertVisible(this.actionsPanel.first(), 'Actions panel');
    await this.assertVisible(this.actionsSearchInput, 'Actions search');
  }

  async assertActionsPanelVisible(): Promise<void> {
    await this.assertVisible(this.actionsPanel.first(), 'Actions panel is visible');
  }

  async assertSaveButtonVisible(): Promise<void> {
    await this.assertVisible(this.saveButton.first(), 'Save button is visible');
  }

  async assertMessageBoxInCanvas(): Promise<void> {
    // The canvas should contain the message box step
    const canvasItem = this.page.locator(
      '[class*="canvas"] [class*="step"], [class*="canvas"] [class*="action"]'
    );
    await expect(canvasItem.first()).toBeVisible({ timeout: 10000 });
  }

  async assertSuccessSaved(): Promise<void> {
    // Toast / notification after save
    const successIndicators = this.page.locator(
      '[class*="toast"], [class*="success"], [class*="notification"], [role="alert"]'
    );
    await expect(successIndicators.first()).toBeVisible({ timeout: 15000 });
  }
}
