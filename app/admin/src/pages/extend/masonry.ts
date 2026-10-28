import { Masonry } from '@kui/core'
import type { MasonryOptions } from '@kui/core'
import { trackComponent } from '../../context'
import type { DocPageContext } from '../../docs/types'
import { callout, demo, pageHead, propsTable, sectionTitle } from '../../docs/ui'

/**
 * 瀑布流。
 * 只做布局计算，不改动子元素结构：列高最短优先，列数由容器宽度与最小列宽算出来。
 * 追加内容后调用一次 layout()，子项会带着过渡动画落到新位置。
 */
export default function render({ root, meta }: DocPageContext): void {
    root.innerHTML = `
${pageHead(meta, {
    lead: '瀑布流用高度不齐的内容填满屏幕，适合图片墙与卡片墙。KUI 只在容器上做布局：列数由容器宽度和最小列宽算出来，手机、平板与桌面共用一份 DOM，子元素结构不变；追加内容后调用一次 layout() 即可重排。',
    tags: ['Masonry', '.kui-masonry', 'layout()'],
})}

${sectionTitle('图片瀑布流', '高度来自图片比例：每个子项先按比例占位，图片解码完成不会改变列高，重排时只移动位置。')}

${demo({
    title: '图片墙与追加',
    desc: '点「随机添加 4 条」会追加四个新子项并调用实例的 layout()：旧子项带着过渡动画重新落位，新子项直接进入最短的一列。',
    tags: ['.kui-masonry__item', 'layout()', 'minColumnWidth: 180'],
    script: `
const masonry = Masonry.getOrCreate('[data-masonry="photos"]', {
    minColumnWidth: 180,
    gap: 16,
})

document.querySelector('[data-masonry-add="photos"]').addEventListener('click', () => {
    const list = document.querySelector('[data-masonry="photos"]')
    const ratios = ['4 / 3', '1 / 1', '3 / 4', '2 / 1']
    const sources = ['./images/photos/city-1.jpg', './images/photos/city-2.jpg', './images/photos/city-3.jpg', './images/photos/city-4.jpg']
    for (let index = 0; index < 4; index += 1) {
        const item = document.createElement('figure')
        item.className = 'kui-masonry__item'
        item.innerHTML =
            '<div class="kui-img-ratio" style="--kui-img-ratio: ' + ratios[index] + '">' +
            '<img src="' + sources[index] + '" alt="随机追加的图片" decoding="async"></div>' +
            '<figcaption class="kui-masonry__body"><strong>新增 · ' + (index + 1) + '</strong><span>刚追加的条目</span></figcaption>'
        list.append(item)
    }
    masonry.layout()
})
`,
    html: `
<div class="kui-stack">
    <div class="kui-toolbar">
        <div class="kui-toolbar__group">
            <button type="button" class="btn btn-default btn-sm" data-masonry-add="photos"><i class="fa fa-plus" aria-hidden="true"></i> 随机添加 4 条</button>
        </div>
        <div class="kui-toolbar__group">
            <span class="badge badge-neutral" data-masonry-count="photos">8 张</span>
        </div>
    </div>
    <div class="kui-masonry" data-masonry="photos" data-kui-masonry>
        <figure class="kui-masonry__item">
            <div class="kui-img-ratio kui-img-ratio--4x3"><img src="./images/photos/city-1.jpg" alt="街头舞者脚上的运动鞋与地面的涂鸦" decoding="async"></div>
            <figcaption class="kui-masonry__body"><strong>街头舞步</strong><span>22:10 · 35mm</span></figcaption>
        </figure>
        <figure class="kui-masonry__item">
            <div class="kui-img-ratio kui-img-ratio--2x1"><img src="./images/photos/city-2.jpg" alt="黑白影调的女性肖像" decoding="async"></div>
            <figcaption class="kui-masonry__body"><strong>黑白肖像</strong><span>午后 · 50mm</span></figcaption>
        </figure>
        <figure class="kui-masonry__item">
            <div class="kui-img-ratio kui-img-ratio--1x1"><img src="./images/photos/city-3.jpg" alt="戴耳机闭眼聆听的女性" decoding="async"></div>
            <figcaption class="kui-masonry__body"><strong>耳机与午后</strong><span>15:20 · 35mm</span></figcaption>
        </figure>
        <figure class="kui-masonry__item">
            <div class="kui-img-ratio" style="--kui-img-ratio: 3 / 4"><img src="./images/photos/city-4.jpg" alt="低头看向侧面的女性" decoding="async"></div>
            <figcaption class="kui-masonry__body"><strong>窗边的侧脸</strong><span>傍晚 · 70mm</span></figcaption>
        </figure>
        <figure class="kui-masonry__item">
            <div class="kui-img-ratio"><img src="./images/photos/city-5.jpg" alt="石雕门柱与铁艺大门" decoding="async"></div>
            <figcaption class="kui-masonry__body"><strong>石雕门柱</strong><span>正午 · 24mm</span></figcaption>
        </figure>
        <figure class="kui-masonry__item">
            <div class="kui-img-ratio kui-img-ratio--4x3"><img src="./images/photos/city-6.jpg" alt="海面上的悬索桥" decoding="async"></div>
            <figcaption class="kui-masonry__body"><strong>跨海大桥</strong><span>退潮 · 85mm</span></figcaption>
        </figure>
        <figure class="kui-masonry__item">
            <div class="kui-img-ratio kui-img-ratio--1x1"><img src="./images/portraits/1.jpg" alt="手绘的卡通人脸" decoding="async"></div>
            <figcaption class="kui-masonry__body"><strong>手绘速写</strong><span>下午 · 28mm</span></figcaption>
        </figure>
        <figure class="kui-masonry__item">
            <div class="kui-img-ratio" style="--kui-img-ratio: 4 / 5"><img src="./images/portraits/2.jpg" alt="趴在桌边的橘猫" decoding="async"></div>
            <figcaption class="kui-masonry__body"><strong>桌边的猫</strong><span>清晨 · 50mm</span></figcaption>
        </figure>
    </div>
</div>`,
})}

${sectionTitle('卡片瀑布流', '没有图片时高度来自文字本身：标题长短与摘要行数不同，列高最短优先补位，卡片之间不会留下大洞。')}

${demo({
    title: '信息卡片与追加',
    desc: '随手记、调研结论与规范条目混排；追加四条只改 DOM 与一次 layout()，卡片高度由内容决定，不需要预先测量。',
    tags: ['.kui-masonry__body', 'gap: 16'],
    script: `
const cards = Masonry.getOrCreate('[data-masonry="cards"]', {
    minColumnWidth: 200,
    gap: 16,
})

document.querySelector('[data-masonry-add="cards"]').addEventListener('click', () => {
    const list = document.querySelector('[data-masonry="cards"]')
    for (let index = 0; index < 4; index += 1) {
        const item = document.createElement('article')
        item.className = 'kui-masonry__item'
        item.innerHTML =
            '<div class="kui-masonry__body"><span class="kui-stat__head"><strong>随手记 · ' + (index + 1) + '</strong>' +
            '<span class="badge badge-info">新增</span></span><span>追加的卡片同样交给列高最短优先。</span></div>'
        list.append(item)
    }
    cards.layout()
})
`,
    html: `
<div class="kui-stack">
    <div class="kui-toolbar">
        <div class="kui-toolbar__group">
            <button type="button" class="btn btn-default btn-sm" data-masonry-add="cards"><i class="fa fa-plus" aria-hidden="true"></i> 随机添加 4 条</button>
        </div>
        <div class="kui-toolbar__group">
            <span class="badge badge-neutral" data-masonry-count="cards">6 条</span>
        </div>
    </div>
    <div class="kui-masonry" data-masonry="cards" data-kui-masonry>
        <article class="kui-masonry__item">
            <div class="kui-masonry__body">
                <span class="kui-stat__head"><strong>结算流程的四个断点</strong><span class="badge badge-neutral">调研</span></span>
                <span>用户在第 3 步反复确认运费，原因不是贵，而是「不知道怎么算出来的」。把公式写出来，这一步的流失就降了一半。</span>
            </div>
        </article>
        <article class="kui-masonry__item">
            <div class="kui-masonry__body">
                <span class="kui-stat__head"><strong>空状态要给出下一步</strong><span class="badge badge-success">已验收</span></span>
                <span>空白页只说「暂无数据」等于把问题丢回给用户。</span>
            </div>
        </article>
        <article class="kui-masonry__item">
            <div class="kui-masonry__body">
                <span class="kui-stat__head"><strong>键盘可用的快捷键面板</strong><span class="badge badge-info">进行中</span></span>
                <span>用 ? 打开一页快捷键说明，比在菜单里翻三层更符合肌肉记忆。面板本身也要能用方向键浏览。</span>
            </div>
        </article>
        <article class="kui-masonry__item">
            <div class="kui-masonry__body">
                <span class="kui-stat__head"><strong>错误文案的两条规则</strong><span class="badge badge-warning">待评审</span></span>
                <span>说清发生了什么、用户能做什么。不要写「操作失败，请重试」。</span>
            </div>
        </article>
        <article class="kui-masonry__item">
            <div class="kui-masonry__body">
                <span class="kui-stat__head"><strong>表格里的空值</strong><span class="badge badge-neutral">规范</span></span>
                <span>数字类空值用短横线，文本类空值留空并降低行高，不要用「无」把每一行都填满。</span>
            </div>
        </article>
        <article class="kui-masonry__item">
            <div class="kui-masonry__body">
                <span class="kui-stat__head"><strong>灰度发布的最低配置</strong><span class="badge badge-info">进行中</span></span>
                <span>一页开关、一个百分比滑块、一份回滚清单。剩下的交给监控。</span>
            </div>
        </article>
    </div>
</div>`,
})}

${sectionTitle('列数与密度', '默认按宽度自适应；需要固定看板列数时再锁死，并自己承担窄屏下的拥挤。')}

${demo({
    title: '固定列数',
    desc: 'columns 大于 0 时不再按宽度算列数：两栏看板在任何屏宽都保持两列，容器变窄时只压缩单列宽度。',
    tags: ['columns: 2'],
    script: `
Masonry.getOrCreate('[data-masonry="fixed"]', {
    columns: 2,
    gap: 16,
})
`,
    html: `
<div class="kui-masonry" data-masonry="fixed" data-kui-masonry>
    <article class="kui-masonry__item">
        <div class="kui-masonry__body"><strong>本周进行中</strong><span>组件库文档补齐媒体与扩展两组，共 9 页，示例全部带源码。</span></div>
    </article>
    <article class="kui-masonry__item">
        <div class="kui-masonry__body"><strong>下周计划</strong><span>整理令牌与主题切换的说明，补一张对照表。</span></div>
    </article>
    <article class="kui-masonry__item">
        <div class="kui-masonry__body"><strong>需要支持</strong><span>截图能力，用来生成每个示例的第一帧预览。</span></div>
    </article>
    <article class="kui-masonry__item">
        <div class="kui-masonry__body"><strong>风险</strong><span>图片文件偏大，首屏需要限制并发解码的数量。</span></div>
    </article>
</div>`,
})}

${propsTable([
    { name: 'minColumnWidth', type: 'number', defaultValue: '180', desc: '单列最小宽度；容器宽度除以它得到列数，窄屏自然降到一列。' },
    { name: 'gap', type: 'number', defaultValue: '16', desc: '列间距与行间距（像素），同时参与列宽计算。' },
    { name: 'columns', type: 'number', defaultValue: '0', desc: '0 为按宽度自适应；大于 0 时锁定列数。' },
    { name: 'layout()', type: 'method', desc: '手动重排；追加内容或图片解码完成后调用一次，子项带过渡动画落位。' },
    { name: '.kui-masonry__item', type: 'class', desc: '子项容器，负责裁切、描边与卡片底色。' },
    { name: '.kui-masonry__body', type: 'class', desc: '文字区：标题用 <code>strong</code>，说明与元信息用 <code>span</code>。' },
    { name: '.kui-img-ratio', type: 'class', desc: '图片子项里先占比例再裁切，保证图片到达前后列高一致。' },
    { name: '.is-positioned', type: 'class', desc: '首次排布后加到容器上，子项改为绝对定位；没有脚本时按普通流展示。' },
])}

${callout('layout() 是同步计算：追加子项后立即调用就能拿到新列高。图片子项请用比例容器或 <code>width</code> / <code>height</code> 声明尺寸，否则图片解码完成会改变列高，瀑布流看起来像「跳了一下」。')}

`

    const instances = new Map<string, Masonry>()

    const mount = (name: string, options: Partial<MasonryOptions>): HTMLElement | null => {
        const element = root.querySelector<HTMLElement>(`[data-masonry="${name}"]`)
        if (!element) {
            return null
        }
        const instance = Masonry.getOrCreate(element, options)
        trackComponent(instance)
        instances.set(name, instance)
        return element
    }

    mount('photos', { minColumnWidth: 180, gap: 16 })
    mount('cards', { minColumnWidth: 200, gap: 16 })
    mount('fixed', { columns: 2, gap: 16 })

    const pick = <T,>(list: T[]): T => list[Math.floor(Math.random() * list.length)]

    const photoSources = [
        { src: './images/photos/city-1.jpg', alt: '街头舞者脚上的运动鞋与地面的涂鸦' },
        { src: './images/photos/city-2.jpg', alt: '黑白影调的女性肖像' },
        { src: './images/photos/city-3.jpg', alt: '戴耳机闭眼聆听的女性' },
        { src: './images/photos/city-4.jpg', alt: '低头看向侧面的女性' },
        { src: './images/photos/city-5.jpg', alt: '石雕门柱与铁艺大门' },
        { src: './images/photos/city-6.jpg', alt: '海面上的悬索桥' },
        { src: './images/portraits/7.jpg', alt: '动漫风格的女性肖像' },
        { src: './images/portraits/4.jpg', alt: '戴头盔与面罩的人' },
    ]
    const photoRatios = ['4 / 3', '1 / 1', '3 / 4', '2 / 1', '16 / 9']
    const photoCaptions: Array<[string, string]> = [
        ['刚追加的一帧', '24mm · f/2.8'],
        ['新加入的一张', '35mm · f/2'],
        ['刚追加的一帧', '50mm · f/1.8'],
        ['新加入的一张', '85mm · f/2.8'],
        ['刚追加的一帧', '28mm · f/4'],
        ['新加入的一张', '70mm · f/2.8'],
    ]

    const buildPhotoItem = (): HTMLElement => {
        const source = pick(photoSources)
        const caption = pick(photoCaptions)
        const item = document.createElement('figure')
        item.className = 'kui-masonry__item'
        const ratio = document.createElement('div')
        ratio.className = 'kui-img-ratio'
        ratio.style.setProperty('--kui-img-ratio', pick(photoRatios))
        const image = document.createElement('img')
        image.src = source.src
        image.alt = source.alt
        image.loading = 'lazy'
        image.decoding = 'async'
        ratio.append(image)
        const body = document.createElement('figcaption')
        body.className = 'kui-masonry__body'
        const title = document.createElement('strong')
        title.textContent = caption[0]
        const meta = document.createElement('span')
        meta.textContent = caption[1]
        body.append(title, meta)
        item.append(ratio, body)
        return item
    }

    const cardTemplates: Array<{ title: string; badge: string; tone: string; text: string }> = [
        { title: '随手记：列表的密度', badge: '调研', tone: 'badge-neutral', text: '列表每行只放一个决策点，第二行留给元信息；行高不必一致，但主信息要对齐。' },
        { title: '空状态的下一步', badge: '规范', tone: 'badge-success', text: '给出一个可以立刻执行的动作，并说明它会发生什么。' },
        { title: '加载中的占位', badge: '进行中', tone: 'badge-info', text: '骨架屏的形状要贴近真实内容，避免内容到达时整体跳动。' },
        { title: '复制成功的反馈', badge: '待评审', tone: 'badge-warning', text: '按钮就地变成「已复制」，两秒后恢复，不再弹出额外的提示框。' },
        { title: '批量操作的选择', badge: '调研', tone: 'badge-neutral', text: '先选后批量，还是先批量再选？答案取决于误操作的代价。' },
        { title: '移动端的表单', badge: '进行中', tone: 'badge-info', text: '一屏一个决策，标签在上、输入在下，错误信息贴在字段下方。' },
    ]

    const buildCardItem = (): HTMLElement => {
        const template = pick(cardTemplates)
        const item = document.createElement('article')
        item.className = 'kui-masonry__item'
        const body = document.createElement('div')
        body.className = 'kui-masonry__body'
        const head = document.createElement('span')
        head.className = 'kui-stat__head'
        const title = document.createElement('strong')
        title.textContent = template.title
        const badge = document.createElement('span')
        badge.className = `badge ${template.tone}`
        badge.textContent = template.badge
        head.append(title, badge)
        const text = document.createElement('span')
        text.textContent = template.text
        body.append(head, text)
        item.append(body)
        return item
    }

    const updateCount = (name: string): void => {
        const element = root.querySelector<HTMLElement>(`[data-masonry="${name}"]`)
        const counter = root.querySelector<HTMLElement>(`[data-masonry-count="${name}"]`)
        if (!element || !counter) {
            return
        }
        counter.textContent = `${element.children.length} ${name === 'photos' ? '张' : '条'}`
    }

    root.querySelectorAll<HTMLElement>('[data-masonry-add]').forEach((button) => {
        button.addEventListener('click', () => {
            const name = button.dataset.masonryAdd ?? ''
            const element = root.querySelector<HTMLElement>(`[data-masonry="${name}"]`)
            const instance = instances.get(name)
            if (!element || !instance) {
                return
            }
            const build = name === 'photos' ? buildPhotoItem : buildCardItem
            for (let index = 0; index < 4; index += 1) {
                element.append(build())
            }
            instance.layout()
            updateCount(name)
        })
    })

    updateCount('photos')
    updateCount('cards')
}
