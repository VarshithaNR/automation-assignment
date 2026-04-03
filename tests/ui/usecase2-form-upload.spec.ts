import { test, expect } from '@playwright/test';
import { LoginPage }     from '../../pages/LoginPage';
import { DashboardPage } from '../../pages/DashboardPage';
import { FormPage }      from '../../pages/FormPage';
import { credentials, uniqueName, ensureUploadFile } from '../../utils/testData';

/**
 * Use Case 2: Form with Upload Flow (UI Automation)
 * ──────────────────────────────────────────────────
 * 1. Log in to the application.
 * 2. Navigate to Automation from the left-hand menu.
 * 3. Click on the Create dropdown and select Form.
 * 4. Fill in all mandatory details and click the Create button.
 * 5. From the left menu, drag and drop the Textbox and Select File elements onto the canvas.
 * 6. Click on each element and verify all UI interactions in the right panel.
 * 7. Enter text in the textbox and upload a document from your shared folder.
 * 8. Save the form and verify whether the document is uploaded successfully.
 */
test.describe('Use Case 2 – Form with Upload Flow', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;
  let formPage: FormPage;

  const FORM_NAME  = uniqueName('Upload_Form');
  let uploadFilePath: string;

  test.beforeAll(async () => {
    // Create the sample upload file once
    uploadFilePath = ensureUploadFile('sample-upload.txt');
  });

  test.beforeEach(async ({ page }) => {
    loginPage     = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    formPage      = new FormPage(page);
  });

  // ── Test 2.1 – Login & Navigate ─────────────────────────────────────────
  test('2.1 Should login and navigate to Automation', async ({ page }) => {
    await loginPage.open();
    await loginPage.assertAllLoginElementsVisible();
    await loginPage.login(credentials.username, credentials.password);
    await loginPage.assertLoginSuccess();
    await dashboardPage.assertAutomationNavVisible();
    await dashboardPage.goToAutomation();
    await dashboardPage.assertCreateButtonVisible();

    await page.screenshot({ path: 'test-results/screenshots/2.1-navigate-automation.png' });
  });

  // ── Test 2.2 – Create Form Dialog ───────────────────────────────────────
  test('2.2 Should open Form creation dialog', async ({ page }) => {
    await loginPage.login(credentials.username, credentials.password);
    await loginPage.assertLoginSuccess();
    await dashboardPage.goToAutomation();
    await dashboardPage.selectForm();

    // Assert form creation dialog elements
    await formPage.assertFormNameInputVisible();

    await page.screenshot({ path: 'test-results/screenshots/2.2-form-dialog.png' });
  });

  // ── Test 2.3 – Fill Details & Open Editor ───────────────────────────────
  test('2.3 Should fill form details and open editor', async ({ page }) => {
    await loginPage.login(credentials.username, credentials.password);
    await loginPage.assertLoginSuccess();
    await dashboardPage.goToAutomation();
    await dashboardPage.selectForm();

    await formPage.fillFormDetails(FORM_NAME);
    await formPage.submitCreateDialog();

    // Assert form editor is loaded
    await formPage.assertFormEditorLoaded();

    await page.screenshot({ path: 'test-results/screenshots/2.3-form-editor-loaded.png' });
  });

  // ── Test 2.4 – Left Panel Components Visible ────────────────────────────
  test('2.4 Should display Textbox and File Upload components in left panel', async ({ page }) => {
    await loginPage.login(credentials.username, credentials.password);
    await loginPage.assertLoginSuccess();
    await dashboardPage.goToAutomation();
    await dashboardPage.selectForm();
    await formPage.fillFormDetails(FORM_NAME);
    await formPage.submitCreateDialog();
    await formPage.assertFormEditorLoaded();

    // Assert component panel and components are visible
    await formPage.assertLeftPanelVisible();
    await formPage.assertTextboxComponentVisible();
    await formPage.assertFileUploadComponentVisible();

    await page.screenshot({ path: 'test-results/screenshots/2.4-components-panel.png' });
  });

  // ── Test 2.5 – Drag Textbox to Canvas ───────────────────────────────────
  test('2.5 Should drag and drop Textbox onto canvas', async ({ page }) => {
    await loginPage.login(credentials.username, credentials.password);
    await loginPage.assertLoginSuccess();
    await dashboardPage.goToAutomation();
    await dashboardPage.selectForm();
    await formPage.fillFormDetails(FORM_NAME);
    await formPage.submitCreateDialog();
    await formPage.assertFormEditorLoaded();

    // Drag textbox
    await formPage.addTextboxToCanvas();
    await formPage.assertTextboxAddedToCanvas();

    await page.screenshot({ path: 'test-results/screenshots/2.5-textbox-on-canvas.png' });
  });

  // ── Test 2.6 – Drag File Upload to Canvas ───────────────────────────────
  test('2.6 Should drag and drop File Upload element onto canvas', async ({ page }) => {
    await loginPage.login(credentials.username, credentials.password);
    await loginPage.assertLoginSuccess();
    await dashboardPage.goToAutomation();
    await dashboardPage.selectForm();
    await formPage.fillFormDetails(FORM_NAME);
    await formPage.submitCreateDialog();
    await formPage.assertFormEditorLoaded();

    // Drag textbox first
    await formPage.addTextboxToCanvas();
    await formPage.assertTextboxAddedToCanvas();

    // Then drag file upload
    await formPage.addFileUploadToCanvas();
    await formPage.assertFileUploadAddedToCanvas();

    await page.screenshot({ path: 'test-results/screenshots/2.6-file-upload-on-canvas.png' });
  });

  // ── Test 2.7 – Click Elements & Verify Right Panel ──────────────────────
  test('2.7 Should click canvas elements and verify right properties panel', async ({ page }) => {
    await loginPage.login(credentials.username, credentials.password);
    await loginPage.assertLoginSuccess();
    await dashboardPage.goToAutomation();
    await dashboardPage.selectForm();
    await formPage.fillFormDetails(FORM_NAME);
    await formPage.submitCreateDialog();
    await formPage.assertFormEditorLoaded();
    await formPage.addTextboxToCanvas();
    await formPage.addFileUploadToCanvas();

    // Click on textbox and verify properties
    await formPage.clickTextboxOnCanvas();
    await formPage.assertPropertiesPanelVisible();

    await page.screenshot({ path: 'test-results/screenshots/2.7-properties-panel.png' });
  });

  // ── Test 2.8 – Text Input Interaction ───────────────────────────────────
  test('2.8 Should enter text in the textbox on canvas', async ({ page }) => {
    await loginPage.login(credentials.username, credentials.password);
    await loginPage.assertLoginSuccess();
    await dashboardPage.goToAutomation();
    await dashboardPage.selectForm();
    await formPage.fillFormDetails(FORM_NAME);
    await formPage.submitCreateDialog();
    await formPage.assertFormEditorLoaded();
    await formPage.addTextboxToCanvas();

    // Type into the textbox
    await formPage.typeInTextbox('Playwright Automation Test Input');

    // Verify the value was entered
    const textbox = page.locator('[class*="canvas"] input[type="text"]').first();
    if (await textbox.isVisible()) {
      const value = await textbox.inputValue();
      expect(value).toContain('Playwright');
    }

    await page.screenshot({ path: 'test-results/screenshots/2.8-text-entered.png' });
  });

  // ── Test 2.9 – File Upload ───────────────────────────────────────────────
  test('2.9 Should upload a file via the File Upload component', async ({ page }) => {
    await loginPage.login(credentials.username, credentials.password);
    await loginPage.assertLoginSuccess();
    await dashboardPage.goToAutomation();
    await dashboardPage.selectForm();
    await formPage.fillFormDetails(FORM_NAME);
    await formPage.submitCreateDialog();
    await formPage.assertFormEditorLoaded();
    await formPage.addTextboxToCanvas();
    await formPage.addFileUploadToCanvas();

    // Upload file
    await formPage.uploadFile(uploadFilePath);

    // Assert upload success
    await formPage.assertFileUploaded();

    await page.screenshot({ path: 'test-results/screenshots/2.9-file-uploaded.png' });
  });

  // ── Test 2.10 – Save Form ────────────────────────────────────────────────
  test('2.10 Should save the form and show confirmation', async ({ page }) => {
    await loginPage.login(credentials.username, credentials.password);
    await loginPage.assertLoginSuccess();
    await dashboardPage.goToAutomation();
    await dashboardPage.selectForm();
    await formPage.fillFormDetails(FORM_NAME);
    await formPage.submitCreateDialog();
    await formPage.assertFormEditorLoaded();
    await formPage.addTextboxToCanvas();
    await formPage.addFileUploadToCanvas();
    await formPage.typeInTextbox('Test text data');

    // Save
    await formPage.assertSaveButtonVisible();
    await formPage.saveForm();
    await formPage.assertFormSaved();

    await page.screenshot({ path: 'test-results/screenshots/2.10-form-saved.png' });
  });

  // ── Test 2.11 – Full End-to-End Flow ────────────────────────────────────
  test('2.11 Full flow: Login → Navigate → Create Form → Drag Components → Upload File → Save', async ({ page }) => {
    const e2eFormName = uniqueName('E2E_Upload_Form');

    // Step 1 & 2: Login and navigate
    await loginPage.open();
    await loginPage.assertAllLoginElementsVisible();
    await loginPage.login(credentials.username, credentials.password);
    await loginPage.assertLoginSuccess();
    await dashboardPage.goToAutomation();

    // Step 3 & 4: Create Form
    await dashboardPage.selectForm();
    await formPage.assertFormNameInputVisible();
    await formPage.fillFormDetails(e2eFormName);
    await formPage.submitCreateDialog();
    await formPage.assertFormEditorLoaded();

    // Step 5: Verify components and drag to canvas
    await formPage.assertLeftPanelVisible();
    await formPage.assertTextboxComponentVisible();
    await formPage.assertFileUploadComponentVisible();
    await formPage.addTextboxToCanvas();
    await formPage.assertTextboxAddedToCanvas();
    await formPage.addFileUploadToCanvas();
    await formPage.assertFileUploadAddedToCanvas();

    // Step 6: Click elements and verify right panel
    await formPage.clickTextboxOnCanvas();
    await formPage.assertPropertiesPanelVisible();

    // Step 7: Enter text and upload file
    await formPage.typeInTextbox('E2E Automation Test Data');
    await formPage.uploadFile(uploadFilePath);

    // Step 8: Save and verify
    await formPage.saveForm();
    await formPage.assertFormSaved();

    await page.screenshot({ path: 'test-results/screenshots/2.11-e2e-form-complete.png' });
  });
});
