import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import { emptyDirectory } from '../../scripts/lib/empty-directory.mjs'

const applicationRoot = __dirname
const repositoryRoot = resolve(applicationRoot, '../..')
const isE2E = process.env.KUI_E2E === 'true'


/** 构建前清理历史产物，避免 dist-demo 里堆积过期的 chunk */
function cleanDemoOutput() {
    const output = resolve(repositoryRoot, 'dist-demo')
    return {
        name: 'kui-clean-demo-output',
        apply: 'build' as const,
        buildStart() {
            emptyDirectory(output)
        },
    }
}

export default defineConfig({
    root: applicationRoot,
    base: './',
    plugins: [cleanDemoOutput()],
    envDir: repositoryRoot,
    publicDir: resolve(repositoryRoot, 'public'),
    server: isE2E ? { hmr: false, watch: null } : undefined,
    resolve: {
        alias: [
            { find: /^@kui\/core\/components\/(.+)$/, replacement: resolve(repositoryRoot, 'packages/core/dist/components/$1/index.js') },
            { find: /^@kui\/core\/internals$/, replacement: resolve(repositoryRoot, 'packages/core/dist/core/index.js') },
            { find: /^@kui\/core\/utils$/, replacement: resolve(repositoryRoot, 'packages/core/dist/utils/index.js') },
            { find: /^@kui\/core$/, replacement: resolve(repositoryRoot, 'packages/core/dist/index.js') },
            { find: /^@kui\/tokens\/css$/, replacement: resolve(repositoryRoot, 'packages/tokens/dist/tokens.css') },
            { find: /^@kui\/tokens$/, replacement: resolve(repositoryRoot, 'packages/tokens/dist/index.js') },
            { find: /^@kui\/style\/(tokens|reset|typography|accessibility|layout|utilities|components|foundation|full)$/, replacement: resolve(repositoryRoot, 'packages/styles/dist/$1.css') },
            { find: /^@kui\/style$/, replacement: resolve(repositoryRoot, 'packages/styles/dist/foundation.css') },
        ],
    },
    build: {
        outDir: resolve(repositoryRoot, 'dist-demo'),
        emptyOutDir: false,
        manifest: true,
        rollupOptions: {
            input: {
                admin: resolve(applicationRoot, 'index.html'),
            },
        },
        sourcemap: true,
        target: 'es2022',
    },
})
