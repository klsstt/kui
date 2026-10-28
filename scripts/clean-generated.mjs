import { rmSync } from 'node:fs'
import { resolve } from 'node:path'

const repositoryRoot = process.cwd()
const targets = [
    'dist-demo',
    'packages/tokens/dist',
    'packages/styles/dist',
    'packages/core/dist',
    'eslint-report.txt',
]

for (const target of targets) {
    rmSync(resolve(repositoryRoot, target), { recursive: true, force: true })
    console.log(`[clean] removed ${target}`)
}
