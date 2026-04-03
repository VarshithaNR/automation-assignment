import { test, expect } from '@playwright/test';
import { LoginPage }     from '../../pages/LoginPage';
import { DashboardPage } from '../../pages/DashboardPage';
import { TaskBotPage }   from '../../pages/TaskBotPage';
import { credentials, uniqueName } from '../../utils/testData';

/**
 * Use Case 1: Message Box Task (UI Automation)
 * ─────────────────────────────────────────────
 * 1. Log in to the application.
 * 2. Navigate to Automation from the left-hand menu.
 * 3. Click on the Create dropdown and select Task Bot.
 * 4. Fill in all mandatory details and click the Create button.
 * 5. In the Actions panel, search for "Message Box" and double-click to add.
 * 6. On the right panel, verify every UI element interaction.
 * 7. Save the configuration.
 */
test.describe('Use Case 1 – Message Box Task Bot', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;
  let taskBotPage: TaskBotPage;

  const BOT_NAME = uniqueName('MsgBox_Bot');

  test.beforeEach(async ({ page }) => {
    loginPage     = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    taskBotPage   = new TaskBotPage(page);
  });

  // ── Test 1.1 – Login ────────────────────────────────────────────────────
  test('1.1 Should display all login form elements and authenticate', async ({ page }) => {
    await loginPage.open();

    // Assert login form elements are visible
    await loginPage.assertAllLoginElementsVisible();

    // Perform login
    await loginPage.login(credentials.username, credentials.password);

    // Assert successful login
    await loginPage.assertLoginSuccess();

    await page.screenshot({ path: 'test-results/screenshots/1.1-login-success.png' });
  });

  // ── Test 1.2 – Navigation ───────────────────────────────────────────────
  test('1.2 Should navigate to Automation section', async ({ page }) => {
    await loginPage.login(credentials.username, credentials.password);
    await loginPage.assertLoginSuccess();

    // Assert Automation nav link is visible
    await dashboardPage.assertAutomationNavVisible();

    // Navigate to Automation
    await dashboardPage.goToAutomation();

    // Assert Create button is visible after navigation
    await dashboardPage.assertCreateButtonVisible();

    await page.screenshot({ path: 'test-results/screenshots/1.2-automation-nav.png' });
  });

  // ── Test 1.3 – Create Task Bot Dialog ─────────────────────────────────
  test('1.3 Should open Task Bot creation dialog with all elements', async ({ page }) => {
    await loginPage.login(credentials.username, credentials.password);
    await loginPage.assertLoginSuccess();
    await dashboardPage.goToAutomation();

    // Click Create → Task Bot
    await dashboardPage.selectTaskBot();

    // Assert dialog/form fields are visible
    await taskBotPage.assertBotNameInputVisible();
    await taskBotPage.assertCreateButtonVisible();

    await page.screenshot({ path: 'test-results/screenshots/1.3-task-bot-dialog.png' });
  });

  // ── Test 1.4 – Fill Details & Create ──────────────────────────────────
  test('1.4 Should fill mandatory fields and create Task Bot', async ({ page }) => {
    await loginPage.login(credentials.username, credentials.password);
    await loginPage.assertLoginSuccess();
    await dashboardPage.goToAutomation();
    await dashboardPage.selectTaskBot();

    // Fill bot details
    await taskBotPage.fillBotDetails(BOT_NAME, 'Automated task bot for message box testing');

    // Submit
    await taskBotPage.submitCreateDialog();

    // Assert editor is loaded
    await taskBotPage.assertEditorLoaded();

    await page.screenshot({ path: 'test-results/screenshots/1.4-bot-editor-loaded.png' });
  });

  // ── Test 1.5 – Search & Add Message Box ───────────────────────────────
  test('1.5 Should search for Message Box action and add to canvas', async ({ page }) => {
    await loginPage.login(credentials.username, credentials.password);
    await loginPage.assertLoginSuccess();
    await dashboardPage.goToAutomation();
    await dashboardPage.selectTaskBot();
    await taskBotPage.fillBotDetails(BOT_NAME, 'Automated test bot');
    await taskBotPage.submitCreateDialog();
    await taskBotPage.assertEditorLoaded();

    // Assert actions panel is visible
    await taskBotPage.assertActionsPanelVisible();

    // Search for Message Box
    await taskBotPage.searchAction('Message box');

    // Double-click to add
    await taskBotPage.addMessageBoxAction();

    // Verify it was added to canvas
    await taskBotPage.assertMessageBoxInCanvas();

    await page.screenshot({ path: 'test-results/screenshots/1.5-message-box-added.png' });
  });

  // ── Test 1.6 – Right Panel UI Verification ────────────────────────────
  test('1.6 Should verify right panel UI elements after adding Message Box', async ({ page }) => {
    await loginPage.login(credentials.username, credentials.password);
    await loginPage.assertLoginSuccess();
    await dashboardPage.goToAutomation();
    await dashboardPage.selectTaskBot();
    await taskBotPage.fillBotDetails(BOT_NAME, 'Automated test bot');
    await taskBotPage.submitCreateDialog();
    await taskBotPage.assertEditorLoaded();
    await taskBotPage.searchAction('Message box');
    await taskBotPage.addMessageBoxAction();

    // Fill Message Box properties on the right panel
    await taskBotPage.fillMessageBoxProperties({
      title: 'Automation Test',
      message: 'Hello from Playwright automation!',
      closeButtonText: 'OK',
    });

    // Assert save button is visible
    await taskBotPage.assertSaveButtonVisible();

    await page.screenshot({ path: 'test-results/screenshots/1.6-message-box-properties.png' });
  });

  // ── Test 1.7 – Save Configuration ─────────────────────────────────────
  test('1.7 Should save the Task Bot configuration', async ({ page }) => {
    await loginPage.login(credentials.username, credentials.password);
    await loginPage.assertLoginSuccess();
    await dashboardPage.goToAutomation();
    await dashboardPage.selectTaskBot();
    await taskBotPage.fillBotDetails(BOT_NAME, 'Automated test bot');
    await taskBotPage.submitCreateDialog();
    await taskBotPage.assertEditorLoaded();
    await taskBotPage.searchAction('Message box');
    await taskBotPage.addMessageBoxAction();
    await taskBotPage.fillMessageBoxProperties({
      title: 'Automation Test',
      message: 'Hello from Playwright automation!',
    });

    // Save bot
    await taskBotPage.saveBot();

    // Assert success
    await taskBotPage.assertSuccessSaved();

    await page.screenshot({ path: 'test-results/screenshots/1.7-bot-saved.png' });
  });

  // ── Test 1.8 – Full End-to-End Flow ────────────────────────────────────
  test('1.8 Full flow: Login → Navigate → Create Bot → Add Message Box → Save', async ({ page }) => {
    // Step 1: Login
    await loginPage.open();
    await loginPage.assertAllLoginElementsVisible();
    await loginPage.login(credentials.username, credentials.password);
    await loginPage.assertLoginSuccess();

    // Step 2: Navigate to Automation
    await dashboardPage.goToAutomation();
    await dashboardPage.assertCreateButtonVisible();

    // Step 3: Create Task Bot
    await dashboardPage.selectTaskBot();
    await taskBotPage.assertBotNameInputVisible();

    // Step 4: Fill details
    const e2eBotName = uniqueName('E2E_MsgBot');
    await taskBotPage.fillBotDetails(e2eBotName, 'End-to-end test bot');
    await taskBotPage.submitCreateDialog();
    await taskBotPage.assertEditorLoaded();

    // Step 5: Search and add Message Box
    await taskBotPage.searchAction('Message box');
    await taskBotPage.addMessageBoxAction();
    await taskBotPage.assertMessageBoxInCanvas();

    // Step 6: Verify right panel and fill properties
    await taskBotPage.fillMessageBoxProperties({
      title: 'E2E Test Message',
      message: 'This message box was created via Playwright automation.',
      closeButtonText: 'Close',
    });

    // Step 7: Save
    await taskBotPage.saveBot();
    await taskBotPage.assertSuccessSaved();

    await page.screenshot({ path: 'test-results/screenshots/1.8-e2e-complete.png' });
  });
});
