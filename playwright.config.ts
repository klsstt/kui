import {defineConfig, devices} from '@playwright/test';

const browserChannel = process.env.PLAYWRIGHT_CHANNEL ?? (process.platform === 'win32' ? 'chrome' : undefined);
const testServerUrl = 'http://127.0.0.1:5173';

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
            name: 'admin-chromium',
            testMatch: ['**/design.spec.ts', '**/demo.spec.ts'],
            use: { ...devices['Desktop Chrome'], ...(browserChannel ? {channel: browserChannel} : {})},
        },{
            name: 'component-chromium',
            testMatch: '**/component-accessibility.spec.ts',
            use: { ...devices['Desktop Chrome'], ...(browserChannel ? {channel: browserChannel} : {})},
        },{
            name: 'component-firefox',
            testMatch: '**/component-accessibility.spec.ts',
            use: { ...devices['Desktop Firefox']},
        },
        {
            name: 'component-webkit',
            testMatch: '**/component-accessibility.spec.ts',
            use: { ...devices['Desktop Safari']},
        },{
            name: 'forced-colors-chromium',
            testMatch: '**/forced-colors.spec.ts',
            use: { ...devices['Desktop Chrome'], ...(browserChannel ? {channel: browserChannel} : {}), forcedColors: 'active'},
        }
    ],
    webServer: {
        command: 'pnpm run dev -- --host 127.0.0.1 --port 5173 --strictPort',
        url: testServerUrl,
        env: { KUI_E2E: 'true' },
        reuseExistingServer: false,
    },
})
