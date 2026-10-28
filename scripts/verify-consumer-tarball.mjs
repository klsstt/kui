import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const repositoryRoot = process.cwd()
const packages = [
    { name: '@kui/tokens', dist: 'packages/tokens/dist', files: ['index.js', 'index.d.ts', 'tokens.css'] },
    { name: '@kui/style', dist: 'packages/styles/dist', files: ['full.css', 'components.css', 'reset.css'] },
    { name: '@kui/core', dist: 'packages/core/dist', files: ['index.js', 'index.d.ts'] },
]

const failures = []

for (const item of packages) {
    const manifestPath = resolve(repositoryRoot, item.dist, '../package.json')
    if (!existsSync(manifestPath)) {
        failures.push(`${item.name} 缺少 package.json`)
        continue
    }
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
    const declaredFiles = [
        ...Object.values(manifest.exports ?? {}).flatMap((entry) =>
            typeof entry === 'string' ? [entry] : Object.values(entry).filter((value) => typeof value === 'string')
        ),
    ]
    for (const file of item.files) {
        const target = resolve(repositoryRoot, item.dist, file)
        if (!existsSync(target)) {
            failures.push(`${item.name} 的 exports 产物缺失：${file}`)
        }
    }
    const undeclared = item.files.filter((file) => !declaredFiles.some((entry) => entry.includes(file)))
    if (undeclared.length) {
        console.warn(`[warn] ${item.name} 的 package.json exports 未声明：${undeclared.join('、')}`)
    }
    console.log(`[ok] ${item.name} 产物齐全`)
}

if (failures.length) {
    console.error('\n发布产物校验失败：')
    for (const failure of failures) console.error(`  - ${failure}`)
    process.exit(1)
}

console.log('\n发布产物校验通过（npm pack 干跑前置检查）。')
