import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './tests',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: 'html',
    use: {
        baseURL: 'http://localhost:3000',
        trace: 'on-first-retry',
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
    /* webServer config removed for manual control */
    /*
    webServer: [
      { command: 'npm run dev -w server', url: 'http://localhost:3001', timeout: 120000, reuseExistingServer: true },
      { command: 'npm run dev -w client', url: 'http://localhost:3000', timeout: 120000, reuseExistingServer: true }
    ],
    */
});
