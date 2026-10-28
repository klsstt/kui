import { defineConfig, devices } from '@playwright/test'

const browserChannel = process.env.PLAYWRIGHT_CHANNEL ?? (process.platform === 'win32' ? 'msedge' : undefined)
const testServerUrl = 'http://127.0.0.1:5173'

export default defineConfig({
    testDir: './tests/e2e',
    fullyParallel: true,
    reporter: 'list',
    use: {
        baseURL: testServerUrl,
        trace: 'retain-on-failure',
    },
    projects: [
        {
            name: 'docs-chromium',
            testMatch: ['**/docs.spec.ts'],
            use: { ...devices['Desktop Chrome'], ...(browserChannel ? { channel: browserChannel } : {}) },
        },
        {
            name: 'docs-mobile',
            testMatch: ['**/docs.spec.ts'],
            use: { ...devices['Pixel 7'], ...(browserChannel ? { channel: browserChannel } : {}) },
        },
        {
            name: 'docs-a11y',
            testMatch: ['**/a11y.spec.ts'],
            use: { ...devices['Desktop Chrome'], ...(browserChannel ? { channel: browserChannel } : {}) },
        },
    ],
    webServer: {
        command: 'npm run dev -- --host 127.0.0.1 --port 5173 --strictPort',
        url: testServerUrl,
        env: { KUI_E2E: 'true' },
        reuseExistingServer: !process.env.CI,
    },
})
