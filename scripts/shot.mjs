import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from 'playwright'

/**
 * 文档站截图走查。
 * 用法：node scripts/shot.mjs [pageId ...]
 * 产物写入 tmp-shots/，同时输出控制台错误，便于定位运行时问题。
 */

const base = process.env.KUI_DOC_URL ?? 'http://127.0.0.1:5173'
const pages = process.argv.slice(2)
const targets = pages.length ? pages : ['dashboard']
const output = resolve(process.cwd(), 'tmp-shots')
mkdirSync(output, { recursive: true })

const browser = await chromium.launch(
    process.env.KUI_BROWSER_CHANNEL ? { channel: process.env.KUI_BROWSER_CHANNEL } : {},
)
const mobile = process.env.KUI_SHOT_MOBILE === '1'
const width = Number(process.env.KUI_SHOT_WIDTH ?? (mobile ? 390 : 1440))
const height = Number(process.env.KUI_SHOT_HEIGHT ?? (mobile ? 844 : 1000))
const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
    isMobile: mobile,
    hasTouch: mobile,
})
const page = await context.newPage()

const messages = []
page.on('console', (message) => {
    if (message.type() === 'error') {
        messages.push(`[console] ${message.text()}`)
    }
})
page.on('pageerror', (error) => messages.push(`[pageerror] ${error.message}`))

for (const id of targets) {
    messages.length = 0
    await page.goto(`${base}/#/${id}`, { waitUntil: 'load' })
    await page.waitForTimeout(900)
    if (process.env.KUI_SHOT_THEME || process.env.KUI_SHOT_MODE) {
        await page.evaluate(({theme, mode}) => {
            if (theme === 'dark') {
                document.documentElement.dataset.kuiTheme = 'blue'
                document.documentElement.dataset.kuiMode = 'dark'
            } else if (theme) {
                document.documentElement.dataset.kuiTheme = theme
            }
            if (mode === 'light' || mode === 'dark') document.documentElement.dataset.kuiMode = mode
        }, { theme: process.env.KUI_SHOT_THEME, mode: process.env.KUI_SHOT_MODE })
        await page.waitForTimeout(300)
    }
    if (process.env.KUI_SHOT_OPEN === '1') {
        const toggles = page.locator('[data-demo-toggle]')
        for (let index = 0; index < (await toggles.count()); index += 1) {
            await toggles.nth(index).click()
        }
        await page.waitForTimeout(400)
    }
    const file = resolve(output, `${id}${mobile ? '-mobile' : ''}${process.env.KUI_SHOT_THEME ? `-${process.env.KUI_SHOT_THEME}` : ''}${process.env.KUI_SHOT_MODE ? `-{process.evn.KUI_SHOT_MODE}` : ''}.png`)
    await page.screenshot({ path: file, fullPage: process.env.KUI_SHOT_VIEWPORT !== '1' })
    const title = await page.title()
    const demos = await page.locator('[data-demo]').count()
    console.log(`${id}: ${title} | demos=${demos} | ${file}${messages.length ? `\n  ${messages.join('\n  ')}` : ''}`)
}

await browser.close()
