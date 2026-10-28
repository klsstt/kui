import { chromium } from 'playwright'

const base = 'http://127.0.0.1:5173'
const pages = ['layout', 'container', 'content', 'row', 'responsive', 'panel', 'tabs', 'navbar', 'alert', 'overlay', 'mask', 'guide', 'steps', 'timeline']

const channel = process.env.KUI_BROWSER_CHANNEL ?? (process.platform === 'win32' ? 'msedge' : undefined)
const browser = await chromium.launch(channel ? { channel } : {})
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })

let errors = []
page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`[console] ${message.text()}`)
})
page.on('pageerror', (error) => errors.push(`[pageerror] ${error.message}`))

const results = []
const record = (name, ok, detail = '') => results.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`)

async function interactions(id) {
    if (id === 'panel') {
        await page.locator('[data-panel-demo] [data-panel-action="collapse"]').click()
        await page.waitForTimeout(200)
        record('panel collapse', ((await page.locator('[data-panel-demo]').getAttribute('class')) ?? '').includes('is-collapse'))
        await page.locator('[data-panel-demo] [data-panel-action="collapse"]').click()
        await page.waitForTimeout(250)
        await page.locator('[data-panel-demo] [data-panel-action="refresh"]').click()
        await page.waitForTimeout(300)
        record('panel refresh', (await page.locator('[data-panel-demo] .panel-body').innerText()).includes('已刷新'))
    }
    if (id === 'tabs') {
        await page.locator('[data-tabs-basic-trigger]').nth(1).click()
        await page.waitForTimeout(250)
        record('tabs switch', await page.locator('#tabs-basic-activity').isVisible())
        await page.locator('[data-tabs-basic-trigger]').nth(1).focus()
        await page.keyboard.press('ArrowRight')
        await page.waitForTimeout(250)
        record('tabs arrow keys', await page.locator('#tabs-basic-settings').isVisible())
        await page.locator('[data-tabs-flow-trigger]').nth(3).click()
        await page.waitForTimeout(250)
        record('tabs disabled ignored', (await page.locator('#tabs-flow-billing').isVisible()) === false)
        await page.waitForTimeout(1200)
        const iframes = await page.locator('.kui-iframe-tabs__pane iframe').count()
        const pjaxPanes = await page.locator('.kui-pjax-tabs__pane').count()
        record('tabs containers', iframes >= 2 && pjaxPanes >= 2, `iframes=${iframes} pjax=${pjaxPanes}`)
        record('pjax fetched', (await page.locator('.kui-pjax-tabs__pane').nth(0).innerText()).includes('已加载'))
    }
    if (id === 'navbar') {
        await page.setViewportSize({ width: 480, height: 900 })
        await page.waitForTimeout(300)
        await page.locator('[data-navbar-toggler]').click()
        await page.waitForTimeout(700)
        const cls = (await page.locator('#navbar-collapse-demo').getAttribute('class')) ?? ''
        const expanded = await page.locator('[data-navbar-toggler]').getAttribute('aria-expanded')
        record('navbar collapse', cls.includes('show'), `${cls} aria=${expanded}`)
        await page.setViewportSize({ width: 1440, height: 1000 })
    }
    if (id === 'alert') {
        const before = await page.locator('[data-alert-dismiss]').count()
        await page.locator('[data-alert-dismiss] [data-dismiss="alert"]').first().click()
        await page.waitForTimeout(250)
        const after = await page.locator('[data-alert-dismiss]').count()
        record('alert dismiss', after === before - 1, `${before} -> ${after}`)
    }
    if (id === 'overlay') {
        await page.locator('[data-overlay-tooltip]').first().hover()
        await page.waitForTimeout(400)
        record('tooltip shows', (await page.locator('.tooltip').count()) >= 1)
        await page.mouse.move(2, 2)
        await page.waitForTimeout(250)
        await page.locator('[data-overlay-popover]').first().click()
        await page.waitForTimeout(350)
        record('popover shows', (await page.locator('.popover').count()) >= 1)
        await page.keyboard.press('Escape')
        await page.mouse.click(2, 2)
        await page.waitForTimeout(200)
        await page.locator('[data-overlay-menu]').first().click()
        await page.waitForTimeout(350)
        record('dropdown shows', (await page.locator('.dropdown-menu.show').count()) >= 1)
        await page.keyboard.press('Escape')
    }
    if (id === 'mask') {
        await page.locator('[data-mask-open="mask-confirm"]').click()
        await page.waitForTimeout(500)
        record('modal shows', (await page.locator('#mask-confirm.show').count()) === 1, `backdrop=${await page.locator('.modal-backdrop').count()}`)
        await page.keyboard.press('Escape')
        await page.waitForTimeout(350)
        record('modal closes on esc', (await page.locator('#mask-confirm.show').count()) === 0)
        await page.locator('[data-mask-trigger]').click()
        await page.waitForTimeout(600)
        record('modal trigger opens', (await page.locator('.modal-trigger.show').count()) === 1)
        await page.locator('.modal-trigger [data-dismiss="modal"]').first().click()
        await page.waitForTimeout(350)
        await page.locator('[data-mask-open="mask-drawer"]').click()
        await page.waitForTimeout(500)
        record('drawer opens', (await page.locator('#mask-drawer.show').count()) === 1)
        await page.keyboard.press('Escape')
    }
    if (id === 'guide') {
        await page.locator('[data-guide-replay]').click()
        await page.waitForTimeout(600)
        record('tour opens', (await page.locator('.kui-tour__bubble').count()) === 1)
        const first = await page.locator('.kui-tour__counter').innerText().catch(() => '')
        await page.keyboard.press('ArrowRight')
        await page.waitForTimeout(350)
        const second = await page.locator('.kui-tour__counter').innerText().catch(() => '')
        record('tour next', first.startsWith('1') && second.startsWith('2'), `${first} -> ${second}`)
        await page.keyboard.press('Escape')
        await page.waitForTimeout(250)
        record('tour closes', (await page.locator('.kui-tour__bubble').count()) === 0)
        await page.locator('[data-guide-single-play]').click()
        await page.waitForTimeout(450)
        record('tour centered', (await page.locator('.kui-tour__bubble.is-centered').count()) === 1)
        await page.keyboard.press('Escape')
    }
    if (id === 'steps') {
        const before = await page.locator('[data-steps-readout]').innerText()
        await page.locator('[data-steps-clickable] .kui-step').nth(2).click()
        await page.waitForTimeout(250)
        const after = await page.locator('[data-steps-readout]').innerText()
        record('steps clickable', before !== after, `${before} -> ${after}`)
    }
}

try {
    for (const id of pages) {
        errors = []
        try {
            await page.goto(`${base}/#/${id}`, { waitUntil: 'load' })
            await page.waitForSelector('.doc-page__title', { timeout: 20000 })
            await page.waitForTimeout(700)
        } catch (error) {
            record(id, false, 'load failed: ' + error.message.split('\n')[0])
            continue
        }
        const demos = await page.locator('[data-demo]').count()
        const placeholder = await page.locator('.doc-page__lead', { hasText: '建设中' }).count()
        const props = await page.locator('.doc-props').count()
        const notes = await page.locator('.doc-note').count()
        record(id, demos >= 3 && placeholder === 0 && props >= 1 && notes >= 2, `demos=${demos} props=${props} notes=${notes} errors=${errors.length}`)
        if (errors.length) results.push('   ' + errors.slice(0, 4).join(' | '))
        try {
            await interactions(id)
        } catch (error) {
            record(id + ' interactions', false, error.message.split('\n')[0])
        }
        if (errors.length) record(id + ' console', false, errors.slice(0, 3).join(' | '))
    }
} finally {
    await browser.close()
}

console.log(results.join('\n'))
