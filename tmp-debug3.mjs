import { chromium } from 'playwright'

const channel = process.env.KUI_BROWSER_CHANNEL ?? (process.platform === 'win32' ? 'msedge' : undefined)
const browser = await chromium.launch(channel ? { channel } : {})
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
page.on('pageerror', (e) => console.log('[pageerror]', e.message))

await page.goto('http://127.0.0.1:5173/#/dashboard', { waitUntil: 'load' })
await page.waitForSelector('.doc-page__title', { timeout: 20000 })
await page.waitForTimeout(800)

const result = await page.evaluate(async () => {
    try {
        const mod = await import('/src/pages/nav/tabs.ts')
        const host = document.createElement('div')
        host.style.display = 'none'
        document.body.append(host)
        mod.default({
            root: host,
            meta: { id: 'tabs', title: '标签页', groupId: 'nav', groupTitle: '导航交互', order: 0 },
            prev: null,
            next: null,
        })
        return { ok: true, role: host.querySelector('[data-tabs-basic-trigger]')?.getAttribute('role') }
    } catch (error) {
        return { ok: false, error: String(error && error.stack ? error.stack : error) }
    }
})
console.log(JSON.stringify(result, null, 2))
await browser.close()
