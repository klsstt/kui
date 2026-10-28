import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { basename, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export function findTemporaryFiles(paths) {
    return [...new Set(paths.map((path) => path.replaceAll('\\', '/')))]
        .filter((path) => path.startsWith('.temp/') || path.startsWith('tmp-shots/') || /^tmp[-_.]/i.test(basename(path))).sort()
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    const repositoryRoot = fileURLToPath(new URL('../', import.meta.url))
    try {
        const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], {
            cwd: repositoryRoot,
            encoding: 'utf8',
        }).split('\0').filter((file) => file && existsSync(resolve(repositoryRoot, file)))
        const violations = findTemporaryFiles(files)
        if (violations.length) {
            console.error('发现混入源码的临时文件，请迁移到 .temp/agent/，不要强制提交')
            for (const file of violations) console.error(` -${file}`)
            process.exitCode = 1
        } else {
            console.log('仓库临时文件检查通过')
        }
    } catch (error) {
        console.error('无法检查git文件清单', error.message)
        process.exitCode = 1
    }
}
