import { chromium } from 'playwright'

const channel = process.env.KUI_BROWSER_CHANNEL ?? (process.platform === 'win32' ? 'msedge' : undefined)
const browser = await chromium.launch(channel ? { channel } : {})
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
page.on('console', (m) => console.log('[console]', m.type(), m.text()))
page.on('pageerror', (e) => console.log('[pageerror]', e.message))

await page.goto('http://127.0.0.1:5173/#/tabs', { waitUntil: 'load' })
await page.waitForSelector('.doc-page__title', { timeout: 20000 })
await page.waitForTimeout(800)
console.log('hash before', await page.evaluate(() => location.hash))
console.log('triggers', await page.locator('[data-tabs-basic-trigger]').count())
const handled = await page.evaluate(() => {
    const el = document.querySelectorAll('[data-tabs-basic-trigger]')[1]
    let prevented = null
    el.addEventListener('click', (event) => { prevented = event.defaultPrevented })
    el.click()
    return { prevented, hash: location.hash }
})
console.log('synthetic', handled)
await page.waitForTimeout(500)
console.log('hash after', await page.evaluate(() => location.hash))
await browser.close()
