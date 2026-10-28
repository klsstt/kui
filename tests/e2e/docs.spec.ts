import { expect, test } from '@playwright/test'

/**
 * 文档站端到端契约。
 * 覆盖用户进入站点后一定会走的五步：定位组件 → 看示例 → 看源码 → 切主题 → 收菜单。
 */

test('默认进入宣传首页，并可切换到组件库', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.home-hero')).toBeVisible()
    await expect(page.locator('.docs-primary__link')).toHaveCount(2)
    await expect(page.locator('.docs-brand__logo')).toHaveJSProperty('complete', true)
    await page.locator('[data-primary="docs"]').click()
    await expect(page.locator('.docs-nav__link')).toHaveCount(46)
    await expect(page.locator('.docs-sidebar')).toBeVisible()
})

test('侧边导航按八类组织，并可定位到具体组件', async ({ page }) => {
    await page.goto('/#/dashboard')
    await expect(page.locator('[data-nav-group]')).toHaveCount(8)
    await expect(page.locator('.docs-nav__link')).toHaveCount(46)
    await expect(page.locator('.docs-nav__link.is-active')).toContainText('首页工作台')
})

test('切换页面会同步标题、目录与上一页/下一页', async ({ page }) => {
    await page.goto('/#/buttons')
    await expect(page.locator('.doc-page__title')).toHaveText('按钮')
    await expect(page).toHaveTitle(/按钮 · KUI/)
    await expect(page.locator('.docs-toc__link')).not.toHaveCount(0)
    await page.locator('.docs-pager__link--next').click()
    await expect(page.locator('.doc-page__title')).toHaveText('徽章标签')
})

test('示例可以展开源码并复制', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.goto('/#/buttons')
    const firstDemo = page.locator('[data-demo]').first()
    await firstDemo.locator('[data-demo-toggle]').click()
    await expect(firstDemo.locator('.doc-demo__code')).toBeVisible()
    await expect(firstDemo.locator('.kui-code-block__pre')).toContainText('btn-primary')

    await firstDemo.locator('.kui-code-block__copy').click()
    await expect(firstDemo.locator('.kui-code-block__copy')).toContainText('已复制')
    const clipboard = await page.evaluate(() => navigator.clipboard.readText())
    expect(clipboard).toContain('btn-primary')
})

test('三套主题切换后颜色令牌随之变化', async ({ page }) => {
    await page.goto('/#/dashboard')
    const primary = () => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--kui-color-primary').trim())
    await page.locator('[data-docs-settings]').first().click()
    await page.locator('[data-theme-value="green"]').click()
    await expect(page.locator('html')).toHaveAttribute('data-kui-theme', 'green')
    const green = await primary()
    await page.locator('[data-theme-value="dark"]').click()
    await expect(page.locator('html')).toHaveAttribute('data-kui-theme', 'dark')
    const dark = await primary()
    expect(green).not.toBe(dark)
})

test('侧栏可以收起、展开，并能按关键字过滤', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name.includes('mobile'), '移动端使用抽屉导航，折叠仅桌面端提供')

    await page.goto('/#/dashboard')
    const shell = page.locator('.docs')
    await page.locator('[data-docs-toggle-sidebar]').click()
    await expect(shell).toHaveClass(/is-collapsed/)
    await page.locator('[data-docs-toggle-sidebar]').click()
    await expect(shell).not.toHaveClass(/is-collapsed/)

    await page.locator('[data-docs-search]').fill('表格')
    const visible = page.locator('.docs-nav__link:visible')
    await expect(visible).not.toHaveCount(0)
    expect(await visible.count()).toBeLessThan(20)
})

test('移动端通过抽屉打开导航并定位组件', async ({ page }, testInfo) => {
    test.skip(!testInfo.project.name.includes('mobile'), '仅移动端')

    await page.goto('/#/dashboard')
    await page.locator('[data-docs-menu]').click()
    await expect(page.locator('.docs')).toHaveClass(/is-drawer-open/)
    await page.locator('.docs-nav__link', { hasText: '复杂表格' }).click()
    await expect(page.locator('.doc-page__title')).toHaveText('复杂表格')
    await expect(page.locator('.docs')).not.toHaveClass(/is-drawer-open/)
})
