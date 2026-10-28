import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, resolve, relative } from 'node:path'

const repositoryRoot = resolve(import.meta.dirname, '..')
const iconCss = join(repositoryRoot, 'public/assets/font-awesome-4.7/css/font-awesome.css')
const scanRoots = [join(repositoryRoot, 'app/admin'), join(repositoryRoot, 'packages/styles/src')]

const defined = new Set(
    [...readFileSync(iconCss, 'utf8').matchAll(/\.fa-([a-zA-Z0-9-]+):before/g)].map((match) => match[1])
)

/** Font Awesome 的尺寸与动画工具类不是图标，允许出现在文档与示例中 */
const utilityClasses = new Set([
    'lg', '2x', '3x', '4x', '5x', 'fw', 'ul', 'li', 'border',
    'pull-left', 'pull-right', 'spin', 'pulse',
    'rotate-90', 'rotate-180', 'rotate-270',
    'flip-horizontal', 'flip-vertical',
    'stack', 'stack-1x', 'stack-2x', 'inverse',
])

function* walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name)
        if (entry.isDirectory()) {
            yield* walk(full)
        } else if (/\.(ts|js|mjs|html|scss|css|vue)$/.test(entry.name)) {
            yield full
        }
    }
}

const used = new Map()
for (const root of scanRoots) {
    if (!statSync(root, { throwIfNoEntry: false })) {
        continue
    }
    for (const file of walk(root)) {
        if (file.replaceAll('\\', '/').includes('/font-awesome-4.7/')) {
            continue
        }
        const source = readFileSync(file, 'utf8')
        for (const match of source.matchAll(/\bfa-([a-zA-Z0-9-]+)\b/g)) {
            const name = match[1]
            if (!used.has(name)) {
                used.set(name, new Set())
            }
            used.get(name).add(relative(repositoryRoot, file).replaceAll('\\', '/'))
        }
    }
}

const missing = [...used.keys()].filter((name) => !defined.has(name) && !utilityClasses.has(name)).sort()

if (missing.length) {
    console.error(`[check-icons] 检测到 ${missing.length} 个 Font Awesome 4.7 不支持的图标名：`)
    for (const name of missing) {
        console.error(`  - fa-${name}  (${[...used.get(name)].join(', ')})`)
    }
    process.exit(1)
}

console.log(`[check-icons] 通过：校验 ${used.size} 个图标名，全部存在于 Font Awesome 4.7。`)
