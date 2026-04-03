import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import * as path from 'path';

/**
 * FormPage – handles Form creation, drag-and-drop, and file upload flow
 */
export class FormPage extends BasePage {
  // ── Create Form dialog ──
  private readonly formNameInput = this.page.locator(
    'input[name="name"], input[placeholder*="form name" i], input[aria-label*="name" i]'
  );
  private readonly createFormButton = this.page.locator(
    'button:has-text("Create"), [data-testid="create-submit"]'
  );

  // ── Form Editor ──
  private readonly formCanvas = this.page.locator(
    '[class*="canvas"], [class*="form-editor"], [data-testid="form-canvas"]'
  );
  private readonly leftPanel = this.page.locator(
    '[class*="components-panel"], [class*="form-components"], [data-testid="components"]'
  );
  private readonly textboxComponent = this.page.locator(
    '[class*="component-item"]:has-text("Text"), .component:has-text("Textbox"), [draggable="true"]:has-text("Text")'
  );
  private readonly fileUploadComponent = this.page.locator(
    '[class*="component-item"]:has-text("File"), .component:has-text("File"), [draggable="true"]:has-text("File")'
  );

  // ── Right properties panel ──
  private readonly propertiesPanel = this.page.locator(
    '[class*="properties"], [class*="settings-panel"], [data-testid="properties"]'
  );
  private readonly labelInput = this.page.locator(
    '[class*="properties"] input[placeholder*="label" i], [class*="properties"] input[name="label"]'
  );
  private readonly placeholderInput = this.page.locator(
    '[class*="properties"] input[placeholder*="placeholder" i]'
  );
  private readonly requiredToggle = this.page.locator(
    '[class*="properties"] input[type="checkbox"], [class*="properties"] [role="switch"]'
  );

  // ── Canvas elements ──
  private readonly textboxOnCanvas = this.page.locator(
    '[class*="canvas"] input[type="text"], [class*="canvas"] input:not([type="file"])'
  );
  private readonly fileInputOnCanvas = this.page.locator(
    '[class*="canvas"] input[type="file"]'
  );

  // ── Save / submit ──
  private readonly saveButton = this.page.locator(
    'button:has-text("Save"), [data-testid="save-btn"]'
  );
  private readonly successToast = this.page.locator(
    '[class*="toast"], [class*="notification"], [role="alert"]'
  );

  constructor(page: Page) {
    super(page);
  }

  // ─── Dialog ───────────────────────────────────────────────────────────────

  async fillFormDetails(name: string): Promise<void> {
    await this.waitForVisible(this.formNameInput);
    await this.safeFill(this.formNameInput, name);
  }

  async submitCreateDialog(): Promise<void> {
    await this.safeClick(this.createFormButton.first());
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(2000);
  }

  // ─── Drag and Drop helpers ─────────────────────────────────────────────────

  /**
   * Drag a component from the left panel to the canvas using mouse events.
   * Falls back to a click-and-add mechanism if D&D fails.
   */
  async dragComponentToCanvas(
    sourceLocator: ReturnType<Page['locator']>,
    targetLocator: ReturnType<Page['locator']>
  ): Promise<void> {
    try {
      const source = await sourceLocator.first().boundingBox();
      const target = await targetLocator.boundingBox();

      if (!source || !target) {
        throw new Error('Could not get bounding boxes for drag operation');
      }

      // Use playwright's dragTo method
      await sourceLocator.first().dragTo(targetLocator, {
        force: true,
        targetPosition: {
          x: target.width / 2,
          y: target.height / 2,
        },
      });

      await this.page.waitForTimeout(1000);
    } catch {
      // Fallback: double-click to add to canvas
      await sourceLocator.first().dblclick();
      await this.page.waitForTimeout(1000);
    }
  }

  /** Add Textbox component to canvas */
  async addTextboxToCanvas(): Promise<void> {
    await this.waitForVisible(this.leftPanel.first(), 15000);
    await this.dragComponentToCanvas(this.textboxComponent, this.formCanvas);
    await this.page.waitForTimeout(1000);
  }

  /** Add File Upload component to canvas */
  async addFileUploadToCanvas(): Promise<void> {
    await this.waitForVisible(this.leftPanel.first(), 15000);
    await this.dragComponentToCanvas(this.fileUploadComponent, this.formCanvas);
    await this.page.waitForTimeout(1000);
  }

  // ─── Interactions ─────────────────────────────────────────────────────────

  /** Click the textbox on canvas and verify properties panel */
  async clickTextboxOnCanvas(): Promise<void> {
    const textbox = this.textboxOnCanvas.first();
    if (await textbox.isVisible()) {
      await textbox.click();
    } else {
      // Try to click the canvas element representing textbox
      const canvasTextbox = this.page.locator(
        '[class*="canvas"] [class*="textbox"], [class*="canvas"] [class*="text-field"]'
      );
      await this.safeClick(canvasTextbox.first());
    }
    await this.page.waitForTimeout(500);
  }

  /** Type into the textbox on canvas */
  async typeInTextbox(text: string): Promise<void> {
    const textbox = this.textboxOnCanvas.first();
    if (await textbox.isVisible()) {
      await textbox.click();
      await textbox.fill(text);
    }
  }

  /** Upload a file using the file input on canvas */
  async uploadFile(filePath: string): Promise<void> {
    const absolutePath = path.resolve(filePath);

    // Intercept file chooser
    const [fileChooser] = await Promise.all([
      this.page.waitForEvent('filechooser', { timeout: 10000 }).catch(() => null),
      this.page.locator('[class*="canvas"] [class*="file"], input[type="file"]').first().click({ force: true }),
    ]);

    if (fileChooser) {
      await fileChooser.setFiles(absolutePath);
    } else {
      // Direct file input injection
      await this.fileInputOnCanvas.setInputFiles(absolutePath);
    }

    await this.page.waitForTimeout(2000);
  }

  /** Save the form */
  async saveForm(): Promise<void> {
    await this.safeClick(this.saveButton.first());
    await this.page.waitForTimeout(2000);
  }

  // ─── Assertions ───────────────────────────────────────────────────────────

  async assertFormNameInputVisible(): Promise<void> {
    await this.assertVisible(this.formNameInput, 'Form name input');
  }

  async assertFormEditorLoaded(): Promise<void> {
    await this.assertVisible(this.formCanvas.first(), 'Form canvas');
  }

  async assertLeftPanelVisible(): Promise<void> {
    await this.assertVisible(this.leftPanel.first(), 'Components left panel');
  }

  async assertTextboxComponentVisible(): Promise<void> {
    await this.assertVisible(this.textboxComponent.first(), 'Textbox component in panel');
  }

  async assertFileUploadComponentVisible(): Promise<void> {
    await this.assertVisible(this.fileUploadComponent.first(), 'File Upload component in panel');
  }

  async assertPropertiesPanelVisible(): Promise<void> {
    await this.assertVisible(this.propertiesPanel.first(), 'Properties panel');
  }

  async assertTextboxAddedToCanvas(): Promise<void> {
    const element = this.page.locator(
      '[class*="canvas"] [class*="textbox"], [class*="canvas"] input[type="text"], [class*="canvas"] [class*="text-field"]'
    );
    await expect(element.first()).toBeVisible({ timeout: 10000 });
  }

  async assertFileUploadAddedToCanvas(): Promise<void> {
    const element = this.page.locator(
      '[class*="canvas"] [class*="file"], [class*="canvas"] input[type="file"], [class*="canvas"] [class*="upload"]'
    );
    await expect(element.first()).toBeVisible({ timeout: 10000 });
  }

  async assertFileUploaded(): Promise<void> {
    // Check for file name display, progress indicator, or success state
    const uploadSuccess = this.page.locator(
      '[class*="file-name"], [class*="upload-success"], [class*="uploaded"], [class*="file-preview"]'
    );
    await expect(uploadSuccess.first()).toBeVisible({ timeout: 15000 });
  }

  async assertFormSaved(): Promise<void> {
    await expect(this.successToast.first()).toBeVisible({ timeout: 15000 });
  }

  async assertSaveButtonVisible(): Promise<void> {
    await this.assertVisible(this.saveButton.first(), 'Save button');
  }
}
