import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

/**
 * 文档站可访问性门禁。
 * 覆盖每类组件里结构最复杂的页面：浮层、数据表、表单与媒体。
 * 只检查 WCAG 2.0 A/AA，失败时输出具体节点，方便定位。
 */

const pages = ['dashboard', 'mask', 'tabs', 'table-advanced', 'form-basic', 'rich-text']

for (const id of pages) {
    test(`可访问性：${id}`, async ({ page }) => {
        await page.goto(`/#/${id}`)
        await page.waitForSelector('[data-demo]')
        const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
        const messages = results.violations.map(
            (violation) => `${violation.id} (${violation.impact}) × ${violation.nodes.length}: ${violation.nodes[0]?.target.join(' ')}`,
        )
        expect(messages, messages.join('\n')).toEqual([])
    })
}
