/**
 * 文档站冒烟走查。
 * 先构建产物（npm run build:demo），脚本会用本地静态服务器托管 dist-demo，
 * 再走完「导航 → 页面 → 源码面板 → 主题 → 侧栏收缩 → 搜索」的主流程。
 */

import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { existsSync, mkdirSync } from 'node:fs'
import { extname, resolve } from 'node:path'
import { chromium } from 'playwright'

const root = resolve(process.cwd(), 'dist-demo')
if (!existsSync(resolve(root, 'index.html'))) {
    console.error('未找到 dist-demo/index.html，请先执行 npm run build:demo')
    process.exit(1)
}

const mime = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.map': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject',
}

const server = createServer(async (request, response) => {
    const url = new URL(request.url ?? '/', 'http://127.0.0.1')
    const pathname = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname)
    const file = resolve(root, `.${pathname}`)
    if (!file.startsWith(root)) {
        response.writeHead(403).end()
        return
    }
    try {
        const body = await readFile(file)
        response.writeHead(200, { 'content-type': mime[extname(file)] ?? 'application/octet-stream' })
        response.end(body)
    } catch {
        response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' })
        response.end('not found')
    }
})

await new Promise((done) => server.listen(4178, '127.0.0.1', done))
const base = 'http://127.0.0.1:4178'

const output = resolve(process.cwd(), 'tmp-shots')
mkdirSync(output, { recursive: true })

const channel = process.env.KUI_BROWSER_CHANNEL ?? (process.platform === 'win32' ? 'msedge' : undefined)
const browser = await chromium.launch(channel ? { channel } : {})
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })

const failures = []
const consoleErrors = []
page.on('console', (message) => {
    if (message.type() === 'error') {
        consoleErrors.push(message.text())
    }
})
page.on('pageerror', (error) => consoleErrors.push(error.message))

function check(name, passed, detail = '') {
    console.log(`${passed ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`)
    if (!passed) {
        failures.push(name)
    }
}

try {
    await page.goto(`${base}/#/home`, { waitUntil: 'load' })
    await page.waitForSelector('.home-hero', { timeout: 15000 })
    check('宣传首页渲染', (await page.locator('.home-hero').count()) === 1)
    check('品牌 logo 加载', await page.locator('.docs-brand__logo').evaluate((node) => node.complete && node.naturalWidth > 0))
    check('一级导航两项', (await page.locator('.docs-primary__link').count()) === 2)
    check('首页分区', (await page.locator('.home-section').count()) >= 4)

    await page.goto(`${base}/#/dashboard`, { waitUntil: 'load' })
    await page.waitForSelector('.docs', { timeout: 15000 })
    await page.waitForSelector('[data-demo]', { timeout: 15000 })

    check('侧边导航分组', (await page.locator('[data-nav-group]').count()) === 8, `分组 ${await page.locator('[data-nav-group]').count()} 个`)
    check('组件菜单条目', (await page.locator('.docs-nav__link').count()) === 46, `条目 ${await page.locator('.docs-nav__link').count()} 个`)
    check('首页工作台渲染', (await page.locator('.kui-stat').count()) >= 4)
    check('右侧本页目录', await page.locator('.docs-toc').isVisible())

    await page.locator('[data-demo-toggle]').first().click()
    await page.waitForTimeout(200)
    check('查看源代码可展开', await page.locator('.doc-demo__code').first().isVisible())
    check('源码块可复制', (await page.locator('.kui-code-block__copy').count()) > 0)

    await page.locator('[data-docs-settings]').first().click()
    await page.locator('[data-theme-value="dark"]').click()
    await page.waitForTimeout(300)
    check('深色主题生效', (await page.evaluate(() => document.documentElement.dataset.kuiTheme)) === 'dark')
    await page.locator('[data-theme-value="blue"]').click()
    await page.locator('[data-docs-settings-close]').click()
    await page.waitForTimeout(200)

    await page.locator('[data-docs-toggle-sidebar]').click()
    await page.waitForTimeout(300)
    check('侧栏可收缩', ((await page.locator('.docs').getAttribute('class')) ?? '').includes('is-collapsed'))
    await page.locator('[data-docs-toggle-sidebar]').click()
    await page.waitForTimeout(300)
    check('侧栏可展开', !((await page.locator('.docs').getAttribute('class')) ?? '').includes('is-collapsed'))

    await page.locator('[data-docs-search]').fill('表格')
    await page.waitForTimeout(200)
    const visibleLinks = await page.locator('.docs-nav__link:visible').count()
    check('搜索过滤生效', visibleLinks > 0 && visibleLinks < 20, `命中 ${visibleLinks} 项`)
    await page.locator('[data-docs-search]').fill('')

    const pages = [
        ['buttons', '基础样式'],
        ['panel', '容器布局'],
        ['tabs', '导航交互'],
        ['table-advanced', '数据展示'],
        ['form-basic', '表单输入'],
        ['carousel', '媒体内容'],
        ['rich-text', '扩展组件'],
        ['icons', '图标清单'],
    ]
    for (const [id, label] of pages) {
        await page.goto(`${base}/#/${id}`, { waitUntil: 'load' })
        await page.waitForTimeout(700)
        const demos = await page.locator('[data-demo]').count()
        const placeholder = await page.locator('.doc-page__lead', { hasText: '建设中' }).count()
        check(`${label} / ${id}`, demos >= 2 && placeholder === 0, `demos=${demos}`)
        await page.screenshot({ path: resolve(output, `smoke-${id}.png`) })
    }

    check('无控制台错误', consoleErrors.length === 0, consoleErrors.slice(0, 3).join(' | '))
} finally {
    await browser.close()
    server.close()
}

if (failures.length) {
    console.error(`\n冒烟失败 ${failures.length} 项：${failures.join('、')}`)
    process.exit(1)
}
console.log('\n冒烟通过。')
