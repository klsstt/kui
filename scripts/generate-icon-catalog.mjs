import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * 从 Font Awesome 4.7 的样式表生成分类图标清单。
 * 图标名是有序数组，页面按分类渲染并提供一键复制。
 */

const repositoryRoot = process.cwd()
const cssPath = resolve(repositoryRoot, 'public/assets/font-awesome-4.7/css/font-awesome.css')
const outputPath = resolve(repositoryRoot, 'app/admin/src/data/icons.ts')

const css = readFileSync(cssPath, 'utf8')
const names = [...new Set([...css.matchAll(/\.fa-([a-z0-9-]+):before/g)].map((match) => match[1]))]
    // 方向别名与辅助类不是图标实体
    .filter((name) => !['lg', '2x', '3x', '4x', '5x', 'fw', 'ul', 'li', 'border', 'pull-left', 'pull-right', 'spin', 'pulse', 'rotate-90', 'rotate-180', 'rotate-270', 'flip-horizontal', 'flip-vertical', 'stack', 'stack-1x', 'stack-2x', 'inverse'].includes(name))
    .sort()

const categories = [
    {
        id: 'direction',
        title: '方向与箭头',
        test: (name) => /^(arrow|angle|chevron|caret|hand-o|long-arrow|toggle-|exchange|repeat|undo|redo|refresh|rotate|random|sort|sign-in|sign-out|level-)/.test(name),
    },
    {
        id: 'ui',
        title: '界面与操作',
        test: (name) =>
            /^(check|times|plus|minus|search|filter|cog|gears|gear|sliders|ellipsis|expand|compress|ban|lock|unlock|eye|star|heart|bookmark|flag|bell|calendar|clock|spinner|circle|dot-circle|power|trash|pencil|edit|clone|cut|paste|save|eraser|magic|external-link|link|chain|bars|navicon|th|columns|list|window|square|check-square|minus-square|plus-square|toggle|object|mouse-pointer|id-|i-cursor|tint|adjust|braille|microphone-slash|low-vision|wheelchair|universal-access|assistive-listening|american-sign|audio-description|sign-language|share-alt|ban|shield|history|hourglass|hourglass-|hand-|gavel|legal|balance-scale|battery|plug|power-off|toggle-on|toggle-off)/.test(name),
    },
    {
        id: 'file',
        title: '文件与编辑',
        test: (name) => /^(file|folder|clipboard|paperclip|archive|book|newspaper|files-o|floppy|scissors|paragraph|header|font|text-|bold|italic|underline|strikethrough|align-|indent|outdent|superscript|subscript|quote|th-list|chain-broken|content|pencil-square|map-o|sticky-note|envelope-open|address-book|address-card|vcard|id-card)/.test(name),
    },
    {
        id: 'media',
        title: '媒体与图像',
        test: (name) => /^(play|pause|stop|video|music|volume|headphones|microphone|film|camera|picture|image|photo|tv|podcast|audio|youtube|soundcloud|spotify|cc$|closed-captioning|step-|forward|backward|fast-|eject|assistive|deaf|subtitle|tty|phone|fax|rss|feed|podcast)/.test(name),
    },
    {
        id: 'chart',
        title: '图表与数据',
        test: (name) => /^(chart|bar-chart|pie-chart|line-chart|area-chart|database|table|signal|server|sitemap|tasks|calculator|percent|cubes|cube|connectdevelop|gg|slideshare|pie-)/.test(name),
    },
    {
        id: 'user',
        title: '用户与社交',
        test: (name) => /^(user|users|group|child|female|male|venus|mars|transgender|intersex|share|comment|thumbs|handshake|envelope|at$|hashtag|smile|frown|meh|heart|birthday-cake|venus-|mars-|genderless|mercury|neuter|transgender-alt|user-o)/.test(name),
    },
    {
        id: 'commerce',
        title: '商业与支付',
        test: (name) => /^(shopping|cart|money|credit-card|paypal|bitcoin|dollar|euro|gbp|yen|ruble|rupee|ils|krw|try$|won|percent|bank|industry|building|briefcase|suitcase|tag|tags|gift|ticket|truck|store|balance-scale|legal|gavel|handshake-o|barcode|qrcode|cc-|paypal|stripe|amazon|google-wallet|apple|android)/.test(name),
    },
    {
        id: 'device',
        title: '设备与技术',
        test: (name) => /^(mobile|tablet|desktop|laptop|keyboard|print|hdd|plug|battery|wifi|bluetooth|usb|microchip|terminal|code|bug|cloud|download|upload|wrench|thermometer|tachometer|industry|server|database|sitemap|cogs|gear|snowflake-o|superpowers|rocket|space-shuttle|satellite|signal|television|tv|calculator|microchip)/.test(name),
    },
    {
        id: 'travel',
        title: '交通与出行',
        test: (name) => /^(car|bus|train|bicycle|plane|taxi|ship|rocket|motorcycle|subway|road|anchor|map$|map-marker|map-pin|location-arrow|street-view|globe|binoculars|compass|ship|fighter-jet|space-shuttle|wheelchair|suitcase|taxi)/.test(name),
    },
    {
        id: 'life',
        title: '生活与自然',
        test: (name) => /^(home|coffee|cutlery|glass|beer|bed|bath|tree|leaf|sun-o|moon-o|sun$|snowflake-o|bolt|fire|fire-extinguisher|umbrella|flask|paw|heartbeat|medkit|hospital-o|ambulance|stethoscope|apple|lemon-o|seedling|pagelines|futbol-o|soccer-ball-o|birthday-cake|binoculars|bomb|beer|glass|spoon|fork|cutlery|futbol)/.test(name),
    },
]

const buckets = new Map(categories.map((category) => [category.id, []]))
const general = []

for (const name of names) {
    const matched = categories.find((category) => category.test(name))
    if (matched) {
        buckets.get(matched.id).push(name)
    } else {
        general.push(name)
    }
}

const result = categories
    .map((category) => ({ id: category.id, title: category.title, icons: buckets.get(category.id) }))
    .filter((category) => category.icons.length > 0)

if (general.length) {
    result.push({ id: 'general', title: '通用符号', icons: general })
}

const content = `/**
 * 图标清单（由 scripts/generate-icon-catalog.mjs 生成，勿手改）。
 * 名称对应 Font Awesome 4.7 的 \`fa fa-<name>\`。
 */

export interface IconCategory {
    /** 分类 id */
    id: string
    /** 分类标题 */
    title: string
    /** 图标名 */
    icons: string[]
}

export const iconCategories: IconCategory[] = ${JSON.stringify(result, null, 4)}

/** 图标总数 */
export const iconCount = ${names.length}
`

writeFileSync(outputPath, content, 'utf8')
console.log(`[icons] ${names.length} 个图标，${result.length} 个分类 → ${outputPath}`)
for (const category of result) {
    console.log(`  - ${category.title}: ${category.icons.length}`)
}
