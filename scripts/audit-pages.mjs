import { mkdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from 'playwright'

/**
 * 全站页面审计：逐页检查示例数量、占位文案、源码面板与控制台错误。
 * 用法：node scripts/audit-pages.mjs [pageId ...]
 */

const base = process.env.KUI_DOC_URL ?? 'http://127.0.0.1:5173'
const navSource = readFileSync(resolve(process.cwd(), 'app/admin/src/docs/nav.ts'), 'utf8')
const allPages = [...navSource.matchAll(/\{ id: '([a-z0-9-]+)', title:/g)].map((match) => match[1])
const targets = process.argv.slice(2).length ? process.argv.slice(2) : allPages
const output = resolve(process.cwd(), 'tmp-shots')
mkdirSync(output, { recursive: true })

const channel = process.env.KUI_BROWSER_CHANNEL ?? (process.platform === 'win32' ? 'msedge' : undefined)
const browser = await chromium.launch(channel ? { channel } : {})
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })

const rows = []
let failed = 0

for (const id of targets) {
    const errors = []
    const onError = (error) => errors.push(error.message)
    const onConsole = (message) => {
        if (message.type() === 'error') {
            errors.push(message.text())
        }
    }
    page.on('pageerror', onError)
    page.on('console', onConsole)

    await page.goto(`${base}/#/${id}`, { waitUntil: 'load' })
    await page.waitForTimeout(600)

    const demos = await page.locator('[data-demo]').count()
    const placeholder = await page.locator('.doc-page__lead', { hasText: '建设中' }).count()
    const titleLocator = page.locator('.doc-page__title').first()
    const title = (await titleLocator.count()) ? ((await titleLocator.textContent()) ?? '').trim() || '(无标题)' : '(未渲染)'
    const table = await page.locator('.doc-props__table').count()
    const notes = await page.locator('.doc-note').count()

    let toggles = 0
    const toggleCount = await page.locator('[data-demo-toggle]').count()
    for (let index = 0; index < toggleCount; index += 1) {
        const button = page.locator('[data-demo-toggle]').nth(index)
        await button.click()
        const label = (await button.textContent())?.trim()
        if (label?.includes('收起代码')) {
            toggles += 1
        }
    }

    page.off('pageerror', onError)
    page.off('console', onConsole)

    const ok = demos >= 2 && placeholder === 0 && toggles === toggleCount && errors.length === 0
    if (!ok) {
        failed += 1
    }
    rows.push({ id, title, demos, toggles, table, notes, ok, errors: errors.slice(0, 2) })

    if (process.env.KUI_AUDIT_SHOT === '1') {
        await page.screenshot({ path: resolve(output, `audit-${id}.png`) })
    }
}

await browser.close()

const pad = (value, width) => String(value).padEnd(width)
console.log(`${pad('page', 18)}${pad('title', 12)}${pad('demos', 7)}${pad('source', 8)}${pad('api', 5)}${pad('notes', 7)}ok`)
for (const row of rows) {
    console.log(
        `${pad(row.id, 18)}${pad(row.title, 12)}${pad(row.demos, 7)}${pad(`${row.toggles}`, 8)}${pad(row.table, 5)}${pad(row.notes, 7)}${row.ok ? 'PASS' : 'FAIL'}`,
    )
    if (row.errors.length) {
        console.log(`   ! ${row.errors.join(' | ')}`)
    }
}
console.log(`\n${rows.length - failed}/${rows.length} 页通过`)
if (failed) {
    process.exit(1)
}
