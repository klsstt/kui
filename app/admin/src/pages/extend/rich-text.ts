import { RichText } from '@kui/core'
import { trackComponent } from '../../context'
import type { DocPageContext } from '../../docs/types'
import { callout, demo, pageHead, propsTable, sectionTitle } from '../../docs/ui'

/**
 * 文本组件。
 * 可视化编辑与 Markdown 共用同一份内容：工具栏改的是 HTML，
 * 切到源码视图看到的是可直接提交的 Markdown，两者之间不经过第二套模型。
 */
export default function render({ root, meta }: DocPageContext): void {
    root.innerHTML = `
${pageHead(meta, {
    lead: '文本组件处理的是「用户要写一段带格式的内容」。KUI 只提供能被 Markdown 完整表达的操作：标题、加粗、列表、引用、链接、图片与代码块。工具栏改完就能原样提交或存档，不需要再写一套 HTML 清洗。',
    tags: ['RichText', '.kui-rich-text', 'Markdown'],
})}

${sectionTitle('编辑与输出', '同一份内容有两种读法：可视化编辑看效果，Markdown 视图看结构；下方两块只读输出与编辑器同源。')}

${demo({
    title: '图文与代码块',
    desc: '工具栏覆盖段落格式、行内格式、列表、引用、链接、图片与代码块；右侧的 Markdown 按钮切到源码视图，下方的 HTML 与 Markdown 输出随输入更新。',
    tags: ['.kui-rich-text__toolbar', 'kui:rich-text:change', 'setMode'],
    script: `
const value =
    '<h2>秋季上新说明</h2>' +
    '<p>这一版把<strong>商品故事</strong>放在首屏，正文只保留必要信息。</p>' +
    '<blockquote><p>文案留白比形容词更有说服力。</p></blockquote>' +
    '<ul><li>主推三款外套</li><li>尺码表与往年一致</li></ul>' +
    '<img src="./images/photos/city-1.jpg" alt="街头舞者脚上的运动鞋与地面的涂鸦">' +
    '<pre><code>npm install @kui/core</code></pre>'

const editor = RichText.getOrCreate('[data-richtext-basic]', {
    value,
    minHeight: 200,
    markdown: true,
})

const paint = () => {
    document.querySelector('[data-richtext-html]').textContent = editor.getHtml()
    document.querySelector('[data-richtext-markdown]').textContent = editor.markdown
}

editor.element.addEventListener('kui:rich-text:change', paint)
paint()
`,
    html: `
<div class="kui-stack">
    <div class="kui-rich-text" data-richtext-basic data-kui-rich-text></div>
    <div class="kui-grid kui-grid--md">
        <div class="kui-stack kui-stack--tight">
            <p class="form-label">输出 HTML</p>
            <div class="kui-code-block">
                <pre class="kui-code-block__pre" tabindex="0" aria-label="输出 HTML"><code data-richtext-html></code></pre>
            </div>
        </div>
        <div class="kui-stack kui-stack--tight">
            <p class="form-label">输出 Markdown</p>
            <div class="kui-code-block">
                <pre class="kui-code-block__pre" tabindex="0" aria-label="输出 Markdown"><code data-richtext-markdown></code></pre>
            </div>
        </div>
    </div>
</div>`,
})}

${sectionTitle('写入与统计', '外部按钮把一段 Markdown 写进同一个实例：setMarkdown 解析成可视内容，字数与源码同时刷新。')}

${demo({
    title: '插入示例 Markdown',
    desc: '示例带一张本地图片、三级结构与一段引用；写入后切到 Markdown 视图可以继续手改，切回可视化时再解析回 HTML。',
    tags: ['setMarkdown', 'setHtml', '字数统计'],
    script: `
const sampleMarkdown = [
    '# 上新节奏',
    '',
    '这一版把素材准备拆成三步，每一步都有明确的交付物。',
    '',
    '1. 选品与拍摄',
    '2. 文案与尺寸',
    '3. 上线与复盘',
    '',
    '> 先写标题，再写正文：标题决定用户是否继续读。',
    '',
    '![街头舞者脚上的运动鞋与地面的涂鸦](./images/photos/city-1.jpg)',
].join('\\n')

const editor = RichText.getOrCreate('[data-richtext-sample]', {
    placeholder: '点击上方按钮插入示例 Markdown',
    minHeight: 160,
})

const paint = () => {
    const markdown = editor.markdown
    document.querySelector('[data-richtext-source]').textContent = markdown
    document.querySelector('[data-richtext-count]').textContent = markdown.replace(/\\s/g, '').length + ' 字'
}

document.querySelector('[data-richtext-insert]').addEventListener('click', () => {
    editor.setMarkdown(sampleMarkdown)
    editor.focus()
    paint()
})

editor.element.addEventListener('kui:rich-text:change', paint)
`,
    html: `
<div class="kui-stack">
    <div class="kui-toolbar">
        <div class="kui-toolbar__group">
            <button type="button" class="btn btn-default btn-sm" data-richtext-insert><i class="fa fa-file-text-o" aria-hidden="true"></i> 插入示例 Markdown</button>
        </div>
        <div class="kui-toolbar__group">
            <span class="badge badge-neutral" data-richtext-count>0 字</span>
        </div>
    </div>
    <div class="kui-rich-text" data-richtext-sample data-kui-rich-text></div>
    <div class="kui-code-block">
        <pre class="kui-code-block__pre" tabindex="0" aria-label="Markdown 输出"><code data-richtext-source></code></pre>
    </div>
    <p class="form-hint">用工具栏右侧的 Markdown 按钮切到源码视图，可以直接继续手改。</p>
</div>`,
})}

${sectionTitle('无源码视图', '只想给用户一个所见即所得的编辑区时，关掉 markdown：工具栏只保留格式化操作，内容仍然是一份 HTML。')}

${demo({
    title: '纯可视化',
    desc: 'markdown 设为 false 后不再生成源码视图与切换按钮，编辑区与工具栏保持不变。',
    tags: ['markdown: false'],
    script: `
RichText.getOrCreate('[data-richtext-visual]', {
    value: '<p>这里只有工具栏与编辑区，没有源码视图。</p>',
    markdown: false,
    minHeight: 140,
})
`,
    html: `
<div class="kui-stack">
    <div class="kui-rich-text" data-richtext-visual data-kui-rich-text></div>
    <p class="form-hint">同一套工具栏、同一份 HTML，只是少了 Markdown 这一层。</p>
</div>`,
})}

${propsTable([
    { name: 'value', type: 'string', defaultValue: `''`, desc: '初始 HTML，组件挂载时写入编辑区。' },
    { name: 'placeholder', type: 'string', defaultValue: '开始输入内容…', desc: '编辑区为空时的占位文案，由 CSS 生成，不进入内容。' },
    { name: 'label', type: 'string', defaultValue: '富文本编辑区', desc: '编辑区的可访问名称。' },
    { name: 'minHeight', type: 'number', defaultValue: '180', desc: '编辑区最小高度（CSS 像素），源码视图复用同一高度。' },
    { name: 'markdown', type: 'boolean', defaultValue: 'true', desc: '是否提供源码视图与切换按钮；关闭后只剩可视化编辑。' },
    { name: 'plainPaste', type: 'boolean', defaultValue: 'true', desc: '粘贴时只保留纯文本，避免把外部样式带进正文。' },
    { name: 'onChange', type: '({ html, markdown }) => void', desc: '内容变化回调，输入停止 180ms 后触发一次。' },
    { name: 'setHtml / setMarkdown', type: 'method', desc: '写入内容；两种写法都只保留一份模型，切换视图不丢内容。' },
    { name: 'setMode(mode)', type: 'method', desc: `在 <code>'visual'</code> 与 <code>'markdown'</code> 之间切换。` },
    { name: 'html / markdown / getHtml()', type: 'getter', desc: '读取当前内容的两种表示，可直接提交或存草稿。' },
    { name: 'kui:rich-text:change', type: 'event', desc: '<code>detail.payload</code> 同时给出 HTML 与 Markdown。' },
    { name: '.kui-rich-text__toolbar', type: 'class', desc: '工具栏容器，按钮、段落选择器与模式开关都收在里面。' },
    { name: '.kui-rich-text__editor / __source', type: 'class', desc: '可视编辑区与 Markdown 文本域，两者共用圈边框与最小高度。' },
])}

${callout('工具栏只保留 Markdown 能完整表达的操作，因此从 HTML 转回 Markdown 不会丢结构。粘贴默认只保留纯文本；需要保留来源样式时把 <code>plainPaste</code> 设为 <code>false</code>，同时要自行承担清洗成本。')}

`

    const initialValue =
        '<h2>秋季上新说明</h2>' +
        '<p>这一版把<strong>商品故事</strong>放在首屏，正文只保留必要信息。</p>' +
        '<blockquote><p>文案留白比形容词更有说服力。</p></blockquote>' +
        '<ul><li>主推三款外套</li><li>尺码表与往年一致</li></ul>' +
        '<img src="./images/photos/city-1.jpg" alt="街头舞者脚上的运动鞋与地面的涂鸦">' +
        '<pre><code>npm install @kui/core</code></pre>'

    const sampleMarkdown = [
        '# 上新节奏',
        '',
        '这一版把素材准备拆成三步，每一步都有明确的交付物。',
        '',
        '1. 选品与拍摄',
        '2. 文案与尺寸',
        '3. 上线与复盘',
        '',
        '> 先写标题，再写正文：标题决定用户是否继续读。',
        '',
        '![街头舞者脚上的运动鞋与地面的涂鸦](./images/photos/city-1.jpg)',
    ].join('\n')

    const basic = root.querySelector<HTMLElement>('[data-richtext-basic]')
    if (basic) {
        const editor = RichText.getOrCreate(basic, { value: initialValue, minHeight: 200, markdown: true })
        trackComponent(editor)

        const htmlOutput = root.querySelector<HTMLElement>('[data-richtext-html]')
        const markdownOutput = root.querySelector<HTMLElement>('[data-richtext-markdown]')
        const paint = (): void => {
            if (htmlOutput) {
                htmlOutput.textContent = editor.getHtml()
            }
            if (markdownOutput) {
                markdownOutput.textContent = editor.markdown
            }
        }

        basic.addEventListener('kui:rich-text:change', paint)
        paint()
    }

    const sample = root.querySelector<HTMLElement>('[data-richtext-sample]')
    if (sample) {
        const editor = RichText.getOrCreate(sample, {
            placeholder: '点击上方按钮插入示例 Markdown',
            minHeight: 160,
            markdown: true,
        })
        trackComponent(editor)

        const output = root.querySelector<HTMLElement>('[data-richtext-source]')
        const count = root.querySelector<HTMLElement>('[data-richtext-count]')
        const paint = (): void => {
            const markdown = editor.markdown
            if (output) {
                output.textContent = markdown || '（空文档）'
            }
            if (count) {
                count.textContent = `${markdown.replace(/\s/g, '').length} 字`
            }
        }

        root.querySelector<HTMLElement>('[data-richtext-insert]')?.addEventListener('click', () => {
            editor.setMarkdown(sampleMarkdown)
            editor.focus()
            paint()
        })

        sample.addEventListener('kui:rich-text:change', paint)
        paint()
    }

    const visual = root.querySelector<HTMLElement>('[data-richtext-visual]')
    if (visual) {
        trackComponent(
            RichText.getOrCreate(visual, {
                value: '<p>这里只有工具栏与编辑区，没有源码视图。</p>',
                markdown: false,
                minHeight: 140,
            }),
        )
    }
}
