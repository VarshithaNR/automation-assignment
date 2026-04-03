import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config({ path: './.env' });

export default defineConfig({
  testDir: '../tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1,
  reporter: [
    ['html', { outputFolder: '../playwright-report', open: 'never' }],
    ['list'],
    ['json', { outputFile: '../test-results/results.json' }],
  ],
  use: {
    baseURL: process.env.BASE_URL || 'https://community.cloud.automationanywhere.digital',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    headless: true,
    viewport: { width: 1440, height: 900 },
    actionTimeout: 30000,
    navigationTimeout: 60000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  timeout: 120000,
  expect: {
    timeout: 15000,
  },
});
