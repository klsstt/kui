import AxeBuilder from '@axe-core/playwright'
import { chromium } from '@playwright/test'

const browser = await chromium.launch({ channel: 'msedge' })
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await context.newPage()
await page.goto('http://127.0.0.1:5173/#/dashboard')
await page.waitForSelector('.docs-nav__link')
await page.locator('[data-docs-settings]').first().click()
await page.waitForSelector('#docs-settings:not([hidden])')

for (const id of ['orange', 'amber', 'green', 'teal', 'cyan', 'dark', 'blue']) {
    await page.locator(`[data-theme-value="${id}"]`).click()
    await page.waitForTimeout(60)
    const results = await new AxeBuilder({ page }).include('#docs-settings').withTags(['wcag2a', 'wcag2aa']).analyze()
    for (const violation of results.violations) {
        for (const node of violation.nodes) {
            const detail = node.any.map((check) => check.data).filter(Boolean)
            console.log(id, violation.id, JSON.stringify(node.target), JSON.stringify(detail))
        }
    }
}
await browser.close()
