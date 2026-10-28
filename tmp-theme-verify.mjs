/**
 * 临时校验脚本（不入库）：逐个点击 12 个色系 + 深色，检查 dataset / 主色令牌 / 网格列数 / 设置面板 axe。
 */
import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import AxeBuilder from '@axe-core/playwright'
import { chromium } from '@playwright/test'

const BASE = process.env.KUI_BASE ?? 'http://127.0.0.1:5173'
const ids = ['blue', 'indigo', 'violet', 'purple', 'pink', 'red', 'orange', 'amber', 'green', 'teal', 'cyan', 'slate']
const expectedPrimary = {
    blue: '#2563eb',
    indigo: '#4f46e5',
    violet: '#7c3aed',
    purple: '#9333ea',
    pink: '#db2777',
    red: '#dc2626',
    orange: '#ea580c',
    amber: '#d97706',
    green: '#16a34a',
    teal: '#0d9488',
    cyan: '#0891b2',
    slate: '#475569',
    dark: '#60a5fa',
}

const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL ?? 'msedge' })
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await context.newPage()
const errors = []
page.on('pageerror', (error) => errors.push(String(error)))
page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
})

await mkdir('tmp-shots', { recursive: true })
await page.goto(`${BASE}/#/dashboard`)
await page.waitForSelector('.docs-nav__link')
await page.locator('[data-docs-settings]').first().click()
await page.waitForSelector('#docs-settings:not([hidden])')

const buttons = page.locator('[data-theme-value]')
assert.equal(await buttons.count(), 13, '主题按钮数量应为 13')

const labels = await page.locator('.docs-settings__theme span:last-of-type').allTextContents()
console.log('主题标签:', labels.join(' / '))

const gridColumns = () =>
    page.evaluate(() => getComputedStyle(document.querySelector('.docs-settings__themes')).gridTemplateColumns.split(' ').length)
console.log('桌面端网格列数:', await gridColumns())
assert.equal(await gridColumns(), 4, '桌面端应为 4 列')

const dotColors = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.docs-settings__theme')).map((item) => getComputedStyle(item.querySelector('.docs-theme-dot')).backgroundColor),
)
console.log('色点颜色:', dotColors.join(' | '))
assert.equal(new Set(dotColors).size, 13, '13 个色点颜色应各不相同')

const expectedOnPrimary = {
    orange: '#0b1220',
    amber: '#0b1220',
    green: '#0b1220',
    teal: '#0b1220',
    cyan: '#0b1220',
}

const readTheme = () =>
    page.evaluate(() => ({
        dataset: document.documentElement.dataset.kuiTheme ?? '',
        primary: getComputedStyle(document.documentElement).getPropertyValue('--kui-color-primary').trim(),
        hover: getComputedStyle(document.documentElement).getPropertyValue('--kui-color-primary-hover').trim(),
        onPrimary: getComputedStyle(document.documentElement).getPropertyValue('--kui-color-on-primary').trim(),
        ring: getComputedStyle(document.documentElement).getPropertyValue('--kui-color-focus-ring').trim(),
    }))

const seen = new Map()
for (const id of ids) {
    await page.locator(`[data-theme-value="${id}"]`).click()
    await page.waitForFunction((value) => document.documentElement.dataset.kuiTheme === value, id)
    const state = await readTheme()
    assert.equal(state.dataset, id, `${id}: data-kui-theme 未切换`)
    assert.ok(state.primary, `${id}: --kui-color-primary 为空`)
    assert.equal(state.primary.toLowerCase(), expectedPrimary[id], `${id}: 主色与色板 600 不一致`)
    assert.ok(state.hover && state.ring, `${id}: hover / focus-ring 缺失`)
    assert.equal(state.onPrimary.toLowerCase(), (expectedOnPrimary[id] ?? '#ffffff'), `${id}: on-primary 不符合预期`)
    assert.equal(await page.locator('.docs-settings__theme .fa-check:visible').count(), 1, `${id}: 选中态应只有一个对勾`)
    assert.equal(await page.locator('.docs-settings__theme.is-active').count(), 1, `${id}: 应有且只有一个选中卡片`)
    seen.set(id, state.primary)
    console.log(`  ${id.padEnd(6)} primary=${state.primary} hover=${state.hover} ring=${state.ring} on-primary=${state.onPrimary}`)
}
assert.equal(new Set(seen.values()).size, 12, '12 个色系主色应互不相同')

/* 深色主题仍可用 */
await page.locator('[data-theme-value="dark"]').click()
await page.waitForFunction(() => document.documentElement.dataset.kuiTheme === 'dark')
const dark = await readTheme()
assert.equal(dark.primary.toLowerCase(), expectedPrimary.dark)
console.log(`  dark   primary=${dark.primary} hover=${dark.hover}`)

/* 设置面板 axe：逐主题跑一遍，记录每个主题的违规数 */
let totalViolations = 0
for (const id of [...ids, 'dark']) {
    await page.locator(`[data-theme-value="${id}"]`).click()
    await page.waitForFunction((value) => document.documentElement.dataset.kuiTheme === value, id)
    await page.waitForTimeout(400)
    const results = await new AxeBuilder({ page }).include('#docs-settings').withTags(['wcag2a', 'wcag2aa']).analyze()
    const messages = results.violations.map(
        (violation) => `${id}: ${violation.id} (${violation.impact}) × ${violation.nodes.length}: ${violation.nodes[0]?.target.join(' ')}`,
    )
    if (messages.length) {
        totalViolations += messages.length
        console.log('  axe:', messages.join('\n       '))
    }
}
console.log(`设置面板 axe 违规合计: ${totalViolations}`)

/* 容器级主题：嵌套元素上的 data-kui-theme 也要生效 */
const container = await page.evaluate(() => {
    const probe = document.createElement('div')
    probe.dataset.kuiTheme = 'red'
    document.body.appendChild(probe)
    const primary = getComputedStyle(probe).getPropertyValue('--kui-color-primary').trim()
    const text = getComputedStyle(probe).getPropertyValue('--kui-color-text').trim()
    probe.remove()
    return { primary, text }
})
assert.equal(container.primary.toLowerCase(), '#dc2626', '容器级主题未生效')
console.log(`容器级主题: primary=${container.primary} text=${container.text}`)

/* 响应式列数 */
await page.locator('[data-theme-value="blue"]').click()
await page.setViewportSize({ width: 600, height: 900 })
await page.waitForTimeout(120)
console.log('600px 网格列数:', await gridColumns())
assert.equal(await gridColumns(), 3, '600px 应为 3 列')
await page.setViewportSize({ width: 400, height: 900 })
await page.waitForTimeout(120)
console.log('400px 网格列数:', await gridColumns())
assert.equal(await gridColumns(), 2, '400px 应为 2 列')

/* 截图留档 */
await page.setViewportSize({ width: 1440, height: 900 })
await page.locator('[data-theme-value="teal"]').click()
await page.waitForTimeout(150)
await page.locator('#docs-settings').screenshot({ path: 'tmp-shots/settings-themes.png' })

await page.locator('[data-theme-value="dark"]').click()
await page.waitForTimeout(200)
await page.locator('#docs-settings').screenshot({ path: 'tmp-shots/settings-themes-dark.png' })

await page.setViewportSize({ width: 400, height: 900 })
await page.waitForTimeout(200)
await page.locator('#docs-settings').screenshot({ path: 'tmp-shots/settings-themes-400.png' })

assert.deepEqual(errors, [], `控制台错误: ${errors.join('\n')}`)
await browser.close()
console.log('OK')
