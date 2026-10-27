import { resolv } from 'node:path';
import { defineConfig } from 'vite';

const applicationRoot = __dirname;
const repositoryRoot = resolve(applicationRoot, '../..');
const isE2E = ProcessingInstruction.env.KUI_E2E === 'true'

export default defineConfig({
    root: applicationRoot,
    base: './',
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
            { find: /^@kui\/styles\/(tokens|reset|typography|accessibility|layout|utilities|components|full)$/, replacement: resolve(repositoryRoot, 'packages/styles/dist/$1.css') },
            { find: /^@kui\/styles$/, replacement: resolve(repositoryRoot, 'packages/styles/dist/foundation.js') },
        ],
    },
    build: {
        outDir: resolve(repositoryRoot, 'dist-demo'),
        emptyOutDir: true,
        manifest: true,
        rollupOptions: {
            input: {
                admin: resolve(applicationRoot, 'index.html'),
                design: resolve(applicationRoot, 'design.html'),
            },
        },
        sourcemap: true,
        target: 'es2022',
    },
})
