import { test as base, chromium, expect } from '@playwright/test';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const extensionPath = path.resolve(__dirname, '..', '..');

// Export extension path for use in tests
export const EXTENSION_PATH = extensionPath;

const test = base.extend({
  // Launch a persistent context with the extension loaded so background service workers stay alive
  context: async (_params, use) => {
    const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'forgetfulme-e2e-'));

    // Ensure extension path is absolute
    const absExtensionPath = path.resolve(extensionPath);

    const context = await chromium.launchPersistentContext(userDataDir, {
      channel: 'chromium', // Use chromium channel for better extension support
      headless: true,
      args: [
        `--disable-extensions-except=${absExtensionPath}`,
        `--load-extension=${absExtensionPath}`,
        '--disable-dev-shm-usage', // Helps with headless mode
      ],
    });

    // Wait for extension to load - create a page and wait a bit
    const page = context.pages()[0] || (await context.newPage());
    await page.goto('about:blank');
    // Give extension time to initialize
    await page.waitForTimeout(3000);

    await use(context);

    await context.close();
    fs.rmSync(userDataDir, { recursive: true, force: true });
  },

  // Ensure we always have a page to work with
  page: async ({ context }, use) => {
    const existingPage = context.pages()[0] || (await context.newPage());
    await use(existingPage);
  },
});

export { test, expect };
