import { describe, expect, it } from 'vitest'
import { htmlToMarkdown, markdownToHtml } from '../../packages/core/src/components/rich-text/rich-text'

/**
 * 富文本的 Markdown 双向转换。
 * 两类转换必须能来回走：写进编辑器的结构导出成 Markdown，再解析回来不丢层级。
 */

describe('rich-text markdown', () => {
    it('把标题、强调与代码导出为 Markdown', () => {
        const markdown = htmlToMarkdown('<h2>标题</h2><p><strong>重点</strong>与<code>const a</code></p>')
        expect(markdown).toContain('## 标题')
        expect(markdown).toContain('**重点**')
        expect(markdown).toContain('`const a`')
    })

    it('列表与引用使用标准前缀', () => {
        const markdown = htmlToMarkdown('<ul><li>一</li><li>二</li></ul><blockquote><p>引用</p></blockquote>')
        expect(markdown).toContain('- 一\n- 二')
        expect(markdown).toContain('> 引用')
    })

    it('解析 Markdown 时保留标题层级', () => {
        const html = markdownToHtml('## 二级标题\n\n### 三级标题')
        expect(html).toContain('<h2>二级标题</h2>')
        expect(html).toContain('<h3>三级标题</h3>')
    })

    it('代码围栏不被当作段落解析', () => {
        const html = markdownToHtml('```ts\nconst a: number = 1\n```')
        expect(html).toContain('<pre><code class="language-ts">')
        expect(html).toContain('const a: number = 1')
        expect(html).not.toContain('<p>')
    })

    it('行内语法可以往返', () => {
        const html = '<p><strong>粗</strong>与<em>斜</em>与<a href="https://kui.dev">链接</a></p>'
        const markdown = htmlToMarkdown(html)
        const restored = markdownToHtml(markdown)
        expect(restored).toContain('<strong>粗</strong>')
        expect(restored).toContain('<em>斜</em>')
        expect(restored).toContain('<a href="https://kui.dev">链接</a>')
    })

    it('转义 HTML，避免把文本当标签解析', () => {
        const html = markdownToHtml('<script>alert(1)</script>')
        expect(html).toContain('&lt;script&gt;')
        expect(html).not.toContain('<script>')
    })
})
