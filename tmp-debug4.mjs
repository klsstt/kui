import { chromium } from 'playwright'

const channel = process.env.KUI_BROWSER_CHANNEL ?? (process.platform === 'win32' ? 'msedge' : undefined)
const browser = await chromium.launch(channel ? { channel } : {})
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
page.on('pageerror', (e) => console.log('[pageerror]', e.message))

await page.goto('http://127.0.0.1:5173/#/dashboard', { waitUntil: 'load' })
await page.waitForSelector('.doc-page__title', { timeout: 20000 })
await page.waitForTimeout(600)

const result = await page.evaluate(async () => {
    const out = {}
    try {
        const mod = await import('/src/pages/nav/tabs.ts')
        const host = document.createElement('div')
        document.body.append(host)
        mod.default({
            root: host,
            meta: { id: 'tabs', title: '标签页', groupId: 'nav', groupTitle: '导航交互', order: 0 },
            prev: null,
            next: null,
        })
        const trigger = host.querySelector('[data-tabs-basic-trigger]')
        out.ok = true
        out.navCount = host.querySelectorAll('.nav').length
        out.chain = []
        let node = trigger
        while (node && node !== host) {
            out.chain.push(node.tagName + '.' + (node.className || ''))
            node = node.parentElement
        }
        out.role = trigger.getAttribute('role')
        out.navRole = host.querySelector('.nav')?.getAttribute('role')
        out.tabPanes = host.querySelectorAll('.tab-pane').length
        out.demoCount = host.querySelectorAll('[data-demo]').length
        out.dataAttrs = Array.from(trigger.attributes).map((a) => a.name + '=' + a.value)
    } catch (error) {
        out.ok = false
        out.error = String(error && error.stack ? error.stack : error)
    }
    return out
})
console.log(JSON.stringify(result, null, 2))
await browser.close()
