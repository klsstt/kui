import type { DocPageContext } from '../../docs/types'
import { demo, pageHead, propsTable, sectionTitle } from '../../docs/ui'

/**
 * 排版。
 * 字号、字重、行高共同决定一屏信息的阅读顺序：先看见结论，再读细节，最后才是注释。
 * 页面里的每一行文字都落在现成的标签或类上，不临时发明第四种字号。
 */
export default function render({ root, meta }: DocPageContext): void {
    root.innerHTML = `
${pageHead(meta, {
    lead: '这一页把排版拆成六块可以单独照抄的面板：字号阶梯、字重与行高、首字下沉、图文混排、文本强调与尺寸混排、间距与截断。每一块都只用现成的标签与类，复制出去就能跑。',
    tags: ['Typography', '.kui-prose', '.kui-drop-cap'],
})}

${sectionTitle('字号与字重', '字号由标签决定，字重由类决定；两者都不在页面上临时调数值。')}

${demo({
    title: '字号阶梯',
    desc: '七级阶梯覆盖 28 → 11px：三级标题走 h1–h3，正文走默认段落，辅助标注与极小标签各降一档。同一屏最多出现四级。',
    tags: ['h1–h3', '--kui-font-size-component-*'],
    html: `
<table class="table">
    <thead>
        <tr><th>级</th><th>写法</th><th>像素</th><th>用途</th><th>样例</th></tr>
    </thead>
    <tbody>
        <tr><td>1</td><td><code class="kui-inline-code">h1</code></td><td>28</td><td>数据大标题</td><td><h1 class="kui-mixed-type">486,210</h1></td></tr>
        <tr><td>2</td><td><code class="kui-inline-code">h2</code></td><td>21</td><td>页面标题</td><td><h2>渠道复盘</h2></td></tr>
        <tr><td>3</td><td><code class="kui-inline-code">h3</code></td><td>16</td><td>区块标题</td><td><h3>渠道表现</h3></td></tr>
        <tr><td>4</td><td><code class="kui-inline-code">p</code></td><td>14</td><td>正文</td><td><p>保存后立即生效</p></td></tr>
        <tr><td>5</td><td><code class="kui-inline-code">.kui-page-header__desc</code></td><td>13</td><td>控件文字与说明</td><td><p class="kui-page-header__desc">搜索成员或邮箱</p></td></tr>
        <tr><td>6</td><td><code class="kui-inline-code">.kui-stat__label</code></td><td>12</td><td>辅助标注</td><td><span class="kui-stat__label">较昨日 12.4%</span></td></tr>
        <tr><td>7</td><td><code class="kui-inline-code">small</code></td><td>11</td><td>极小标签</td><td><small>更新于 09:24</small></td></tr>
    </tbody>
</table>`,
})}

${demo({
    title: '字重配对',
    desc: '正文 400，列表标题 500，面板标题 600，只有结论数字才上 700。字重跳级会让整块版面发灰，读者反而找不到重点。',
    stage: 'tinted',
    tags: ['font-weight', '.panel-title', '.kui-task__title'],
    html: `
<div class="kui-grid kui-grid--md">
    <article class="kui-board kui-stack kui-stack--tight">
        <span class="kui-stat__label">400 · 正文与说明</span>
        <p class="kui-page-header__desc">需要连续阅读的句子统一使用常规字重，颜色退到次级，靠行长与间距分段落。</p>
    </article>
    <article class="kui-board kui-stack kui-stack--tight">
        <span class="kui-stat__label">500 · 列表标题</span>
        <p class="kui-task__title">列表项与表格首列用中等字重，和正文刚好拉开一档。</p>
    </article>
    <article class="kui-board kui-stack kui-stack--tight">
        <span class="kui-stat__label">600 · 面板标题</span>
        <p class="panel-title">面板与卡片标题停在 600，再重就会和主按钮抢注意力。</p>
    </article>
    <article class="kui-board kui-stack kui-stack--tight">
        <span class="kui-stat__label">700 · 结论数字</span>
        <p><strong>486,210 元</strong>，只有这一处允许 700。</p>
    </article>
</div>`,
})}

${demo({
    title: '行高',
    desc: '数字 1.15、列表标题 1.45、说明 1.6、混排 1.7、长文 1.8；行高跟随阅读时长，不跟随个人偏好。',
    tags: ['line-height', '.kui-prose'],
    html: `
<div class="kui-stack kui-stack--tight">
    <div class="kui-board">
        <div class="kui-cluster kui-justify-between">
            <span class="kui-stat__value">486,210<small>元</small></span>
            <code class="kui-inline-code">1.15 · .kui-stat__value</code>
        </div>
    </div>
    <div class="kui-board">
        <div class="kui-cluster kui-justify-between">
            <span class="kui-list__title">待审核订单 3 单</span>
            <code class="kui-inline-code">1.45 · .kui-list__title</code>
        </div>
    </div>
    <div class="kui-board kui-max-w-md">
        <p class="kui-page-header__desc">说明文字停在 1.6：两三行的短段落不需要更大行距，段与段之间用间距区分。</p>
        <code class="kui-inline-code">1.6 · .kui-page-header__desc</code>
    </div>
    <div class="kui-board kui-max-w-md">
        <p class="kui-mixed-type">中英混排与数字混排用 1.7，让 12 号英文与 14 号中文在同一行里保持同样的基线节奏。</p>
        <code class="kui-inline-code">1.7 · .kui-mixed-type</code>
    </div>
    <div class="kui-board">
        <div class="kui-prose">
            <p>长段阅读用 1.8，行长控制在 44rem 以内。连续阅读超过三段时，行距再小就会让视线在换行处丢行，只能靠缩窄容器或拆成两栏来解决。</p>
            <p>段落之间靠间距区分，不使用首行缩进；引号、破折号与省略号使用中文标点，英文单词与 API 名称整体换行。</p>
        </div>
        <code class="kui-inline-code">1.8 · .kui-prose &gt; p</code>
    </div>
</div>`,
})}

${sectionTitle('成组排版', '首字下沉与图文混排是两种「让正文有形状」的写法：一个改变开头，一个改变文本与图的相对位置。')}

${demo({
    title: '首字下沉',
    desc: '首字下沉只用在开篇段落，靠一个放大到 3.2em 的首字母把读者拉进正文；同页出现两次就会互相抵消。',
    tags: ['.kui-drop-cap', '.kui-prose'],
    html: `
<div class="kui-board">
    <div class="kui-prose">
        <p class="kui-drop-cap">入秋后的第一周，三条渠道同时完成了秋季改版。直营小程序的转化率从 3.6% 升到 4.8%，门店自提的客单价提高了 62 元，分销渠道则在库存同步上暴露了新的延迟。这些变化说明：改版本身并不神奇，真正起作用的是把「下单」这一步从四屏压到两屏。</p>
        <p>第二段开始恢复正常字号。首字下沉只处理开头，后面所有段落都回到 14px 与 1.8 的行高，读者不会觉得整篇都在被强调。</p>
    </div>
</div>`,
})}

${demo({
    title: '图文混排：左浮动与右浮动',
    desc: '图片浮动后宽度不超过文本块的 44%，正文围绕图片换行；两个方向只取其一，同页混用会让阅读视线来回横跳。',
    tags: ['.kui-figure-float', '.kui-figure-float--left', '.kui-clearfix'],
    html: `
<div class="kui-grid kui-grid--lg">
    <article class="kui-board">
        <div class="kui-prose kui-clearfix">
            <figure class="kui-figure-float">
                <img class="kui-img-responsive kui-img-rounded" src="./images/photos/city-2.jpg" width="1440" height="900" alt="黑白人像照片" loading="lazy" decoding="async">
                <figcaption>右浮动 · 图注跟随图片，字号降到 12px</figcaption>
            </figure>
            <h3 class="panel-title">右浮动：让文字先出现</h3>
            <p>图片放在右侧时，读者的视线先落在左侧第一行文字上，图片只是补充。这种排法适合说明性的报道、产品背景与人物介绍。</p>
            <p>正文围绕图片换行，图片下方不留空白；容器加上 .kui-clearfix，浮动的图片就不会撑破卡片。</p>
        </div>
    </article>
    <article class="kui-board">
        <div class="kui-prose kui-clearfix">
            <figure class="kui-figure-float kui-figure-float--left">
                <img class="kui-img-responsive kui-img-rounded" src="./images/portraits/7.jpg" width="602" height="602" alt="插画人像" loading="lazy" decoding="async">
                <figcaption>左浮动 · 图注与图片左对齐</figcaption>
            </figure>
            <h3 class="panel-title">左浮动：让人物先出现</h3>
            <p>图片放在左侧时，读者先看到人，再读到介绍。人物访谈、团队介绍与案例故事用这个方向更自然。</p>
            <p>左右两个方向的间距由 .kui-figure-float 统一给出，正文不需要额外留白。</p>
        </div>
    </article>
</div>`,
})}

${sectionTitle('强调与混排', '强调只做一件事：把一个词从整段里提出来。三种写法各有分工，不叠加使用。')}

${demo({
    title: '文本强调与尺寸混搭',
    desc: '荧光笔标注结论，下划线标注引用，渐变文字用于封面级标题，语义强调用 .kui-em；数字与单位靠大小字号混排拉开层级。',
    tags: ['.kui-mark', '.kui-underline-mark', '.kui-text-gradient', '.kui-em'],
    html: `
<div class="kui-stack">
    <div class="kui-board">
        <div class="kui-prose">
            <p>本周的核心结论是<mark class="kui-mark">退款率连续三周下降</mark>，但<em class="kui-em">客单价同步下滑</em>，需要在下周的选品会上一起看。</p>
            <p>这句话里的 <span class="kui-underline-mark">「先定栏数，再定密度」</span> 来自布局规范，引用时保持原样，不再加粗。</p>
        </div>
    </div>
    <div class="kui-board kui-stack kui-stack--tight">
        <h2 class="kui-text-gradient">十月渠道复盘</h2>
        <span class="kui-stat__label">渐变文字只用于封面级标题，正文里不出现</span>
    </div>
    <div class="kui-grid kui-grid--sm">
        <article class="kui-board kui-stack kui-stack--tight">
            <p class="kui-stat__value">486,210<small>元</small></p>
            <span class="kui-stat__label">大数字 + 小单位：.kui-stat__value</span>
        </article>
        <article class="kui-board kui-stack kui-stack--tight">
            <h2 class="kui-mixed-type">12,480<small>次 / 天</small></h2>
            <span class="kui-stat__label">标题级混排：h2 + .kui-mixed-type</span>
        </article>
        <article class="kui-board kui-stack kui-stack--tight">
            <p class="kui-mixed-type">本月新增 <strong>1,284</strong> 位会员，其中 <small>62% 来自门店</small></p>
            <span class="kui-stat__label">行内混排：数字与括注同一行</span>
        </article>
    </div>
</div>`,
})}

${sectionTitle('间距与截断', '间距表达分组，截断表达取舍；两者都在容器上决定，而不是在文字上硬调。')}

${demo({
    title: '间距与对齐',
    desc: '同一行用 .kui-cluster，不同行用 .kui-stack；gap 只有三档，对齐只改 align 与 justify 两个变量。',
    tags: ['.kui-stack--tight', '--kui-cluster-gap', '--kui-cluster-align'],
    html: `
<div class="kui-stack">
    <div class="kui-grid kui-grid--md">
        <div class="kui-board kui-stack kui-stack--tight">
            <code class="kui-inline-code">.kui-stack--tight · gap 8</code>
            <div class="kui-board">分组一</div>
            <div class="kui-board">分组二</div>
            <div class="kui-board">分组三</div>
        </div>
        <div class="kui-board kui-stack">
            <code class="kui-inline-code">.kui-stack · gap 16</code>
            <div class="kui-board">分组一</div>
            <div class="kui-board">分组二</div>
            <div class="kui-board">分组三</div>
        </div>
        <div class="kui-board kui-stack kui-stack--loose">
            <code class="kui-inline-code">.kui-stack--loose · gap 24</code>
            <div class="kui-board">分组一</div>
            <div class="kui-board">分组二</div>
            <div class="kui-board">分组三</div>
        </div>
    </div>
    <div class="kui-board kui-stack">
        <code class="kui-inline-code">.kui-cluster · gap 12 / --kui-cluster-gap: 20</code>
        <div class="kui-cluster">
            <span class="badge badge-neutral">默认 12</span>
            <span class="badge badge-neutral">同一行</span>
            <span class="badge badge-neutral">自动换行</span>
            <span class="badge badge-neutral">间距一致</span>
        </div>
        <div class="kui-cluster" style="--kui-cluster-gap: var(--kui-space-5)">
            <span class="badge badge-neutral">松散 20</span>
            <span class="badge badge-neutral">同一行</span>
            <span class="badge badge-neutral">只在需要分区时用</span>
        </div>
    </div>
    <div class="kui-board kui-stack">
        <code class="kui-inline-code">--kui-cluster-align · flex-start / center / flex-end</code>
        <div class="kui-cluster" style="--kui-cluster-align: flex-start">
            <button type="button" class="btn btn-default btn-sm">短</button>
            <button type="button" class="btn btn-default btn-lg">高三档</button>
            <span class="badge badge-primary">徽章</span>
            <span class="kui-stat__label">顶端对齐，适合表单行</span>
        </div>
        <div class="kui-cluster">
            <button type="button" class="btn btn-default btn-sm">短</button>
            <button type="button" class="btn btn-default btn-lg">高三档</button>
            <span class="badge badge-primary">徽章</span>
            <span class="kui-stat__label">居中对齐，默认值</span>
        </div>
        <div class="kui-cluster kui-justify-between">
            <span class="kui-stat__label">左端：筛选条件</span>
            <span class="kui-cluster">
                <button type="button" class="btn btn-default btn-sm">取消</button>
                <button type="button" class="btn btn-primary btn-sm">保存</button>
            </span>
        </div>
    </div>
</div>`,
})}

${demo({
    title: '截断与数字对齐',
    desc: '单行用 .kui-truncate，两行用 .kui-clamp-2，标识符用 .kui-nowrap；金额列右对齐并加上 tabular-nums，数值变化时列宽与小数点都不抖。',
    tags: ['.kui-truncate', '.kui-clamp-2', 'tabular-nums'],
    script: `
const body = document.querySelector<HTMLElement>('[data-typ-clamped]')
const toggle = document.querySelector<HTMLButtonElement>('[data-typ-expand]')

toggle?.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') === 'true'
    body?.classList.toggle('kui-clamp-2', open)
    toggle.setAttribute('aria-expanded', String(!open))
    toggle.textContent = open ? '展开全文' : '收起为两行'
})
`,
    html: `
<div class="kui-stack">
    <div class="kui-board kui-stack kui-stack--tight kui-max-w-sm">
        <code class="kui-inline-code">.kui-truncate · 单行</code>
        <p class="kui-truncate">K-2481 · 澄明科技 2026 年秋季第一批补货单，共 24 个 SKU</p>
    </div>
    <div class="kui-board kui-stack kui-stack--tight kui-max-w-sm">
        <code class="kui-inline-code">.kui-clamp-2 · 两行</code>
        <p class="kui-page-header__desc kui-clamp-2" data-typ-clamped>这是一段刻意写长的说明文字，用来验证容器在第二行结束时出现省略号，而不是继续向下撑高整行。展开后它回到普通段落，行高与字号都不变，因此整块卡片的宽度不会跳动；再次收起时仍然停在两行，说明截断是容器行为，不是文字本身被删掉了。</p>
        <div class="kui-cluster">
            <button type="button" class="btn btn-default btn-xs" data-typ-expand aria-expanded="false">展开全文</button>
            <span class="kui-stat__label">第三行被省略号收掉</span>
        </div>
    </div>
    <div class="kui-board kui-stack kui-stack--tight">
        <div class="kui-cluster">
            <code class="kui-inline-code">tabular-nums + 右对齐</code>
            <span class="kui-stat__label">金额与占比两列不会随数值变化而抖动</span>
        </div>
        <div class="kui-max-w-md">
            <table class="table">
                <thead>
                    <tr><th>日期</th><th class="kui-text-right">金额（元）</th><th class="kui-text-right">占比</th></tr>
                </thead>
                <tbody>
                    <tr><td>09-18</td><td class="kui-text-right kui-mixed-type">182,400</td><td class="kui-text-right kui-mixed-type">42.6%</td></tr>
                    <tr><td>09-19</td><td class="kui-text-right kui-mixed-type">8,800</td><td class="kui-text-right kui-mixed-type">2.1%</td></tr>
                    <tr><td>09-20</td><td class="kui-text-right kui-mixed-type">98,600</td><td class="kui-text-right kui-mixed-type">23.0%</td></tr>
                </tbody>
            </table>
        </div>
        <p class="kui-stat__label">当前字体（Aptos / Segoe UI）的数字本身已是等宽，tabular-nums 保证换成比例数字字体或中英混排时仍然对齐。</p>
    </div>
    <div class="kui-board kui-cluster">
        <code class="kui-inline-code">.kui-nowrap</code>
        <span class="tag kui-nowrap">kui-typography-scale-v2</span>
        <span class="kui-stat__label">版本号与标识符不换行，溢出时横向滚动</span>
    </div>
</div>`,
})}

${propsTable([
    { name: 'h1 / h2 / h3', type: 'tag', defaultValue: '28 / 21 / 16px', desc: '三级标题使用原生标签，只继承字族、行高与颜色，不额外加类。' },
    { name: '--kui-font-family-page', type: 'font-family', defaultValue: 'Aptos, HarmonyOS Sans', desc: '页面正文与标题的字体栈。' },
    { name: '--kui-font-family-component', type: 'font-family', defaultValue: 'Segoe UI Variable', desc: '按钮、标签、表头等控件文字。' },
    { name: '--kui-font-size-component-label', type: '12px', defaultValue: '12px', desc: '辅助标注、表头与徽章文字。' },
    { name: '--kui-font-size-component-control', type: '13px', defaultValue: '13px', desc: '按钮、输入框与列表元信息。' },
    { name: '--kui-font-size-component-value', type: '14px', defaultValue: '14px', desc: '正文、卡片标题与表格内容。' },
    { name: '.kui-prose', type: 'class', defaultValue: '44rem', desc: '正文容器：限制行长，段落字号 14px、行高 1.8，首尾段自动去掉多余间距。' },
    { name: '.kui-drop-cap', type: 'class', defaultValue: '—', desc: '首字下沉，首字母放大到 3.2em 并左浮动，只用于开篇段落。' },
    { name: '.kui-figure-float', type: 'class', defaultValue: 'right', desc: '图片右浮动，宽度不超过 44%；叠加 <code>--left</code> 改为左浮动。' },
    { name: '.kui-clearfix', type: 'class', defaultValue: '—', desc: '清除内部浮动，避免浮动图片撑破卡片。' },
    { name: '.kui-mark / .kui-underline-mark', type: 'class', defaultValue: '—', desc: '荧光笔底纹 / 下划线底纹，用于句中强调。' },
    { name: '.kui-em', type: 'class', defaultValue: '—', desc: '语义强调：品牌色 + 600 字重，替代 <code>font-weight</code> 内联。' },
    { name: '.kui-text-gradient', type: 'class', defaultValue: '—', desc: '渐变文字，背景裁剪到文字，只用于封面级标题。' },
    { name: '.kui-mixed-type', type: 'class', defaultValue: '1.7', desc: '中英与数字混排：等宽数字，内部 <code>small</code> 降到 0.62em。' },
    { name: '.kui-truncate / .kui-clamp-2 / .kui-clamp-3', type: 'class', defaultValue: '—', desc: '单行省略 / 两行 / 三行截断，溢出以省略号收尾。' },
    { name: '.kui-nowrap', type: 'class', defaultValue: '—', desc: '不换行，用于标识符、版本号与代码片段。' },
    { name: 'tabular-nums', type: 'font-variant-numeric', defaultValue: '—', desc: '数字等宽，表格与指标不再因位数变化而抖动。' },
    { name: '--kui-cluster-gap / -align / -justify', type: 'length', defaultValue: '12px / center', desc: '同一行元素之间的间距、交叉轴对齐与主轴分布。' },
    { name: '--kui-stack-gap', type: 'length', defaultValue: '16px', desc: '纵向堆叠间距，由 <code>--tight</code>（8）与 <code>--loose</code>（24）覆盖。' },
])}

`

    const body = root.querySelector<HTMLElement>('[data-typ-clamped]')
    const toggle = root.querySelector<HTMLButtonElement>('[data-typ-expand]')
    toggle?.addEventListener('click', () => {
        const open = toggle.getAttribute('aria-expanded') === 'true'
        body?.classList.toggle('kui-clamp-2', open)
        toggle.setAttribute('aria-expanded', String(!open))
        toggle.textContent = open ? '展开全文' : '收起为两行'
    })
}
