import { chromium } from 'playwright'

const channel = process.env.KUI_BROWSER_CHANNEL ?? (process.platform === 'win32' ? 'msedge' : undefined)
const browser = await chromium.launch(channel ? { channel } : {})
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
page.on('pageerror', (e) => console.log('[pageerror]', e.message))

await page.goto('http://127.0.0.1:5173/#/tabs', { waitUntil: 'load' })
await page.waitForSelector('.doc-page__title', { timeout: 20000 })
await page.waitForTimeout(1000)

const info = await page.evaluate(() => {
    const triggers = Array.from(document.querySelectorAll('[data-tabs-basic-trigger]'))
    const nav = document.querySelector('[data-tabs-basic] .nav')
    return {
        hash: location.hash,
        title: document.querySelector('.doc-page__title')?.textContent,
        triggerRoles: triggers.map((t) => t.getAttribute('role')),
        navRole: nav?.getAttribute('role'),
        panes: Array.from(document.querySelectorAll('.tab-pane')).map((p) => ({ id: p.id, hidden: p.hidden, cls: p.className })),
        demos: document.querySelectorAll('[data-demo]').length,
    }
})
console.log(JSON.stringify(info, null, 2))
await browser.close()
