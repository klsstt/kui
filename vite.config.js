import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    publicDir: false,
    resolve: {
        alias: [
            {find: /^@kui\/core\/Components\/V(.+)$/, replacement: resolve(__dirname, 'packages/core/src/components/$1/index.ts')},
            {find: /^@kui\/core\/internals$/, replacement: resolve(__dirname, 'packages/core/src/core/index.ts')},
            {find: /^@kui\/core\/utils$/, replacement: resolve(__dirname, 'packages/core/src/utils/index.ts')},
            {find: /^@kui\/core$/, replacement: resolve(__dirname, 'packages/core/src/index.ts')},
            {find: /^@kui\/tokens\/styles/, replacement: resolve(__dirname, 'packages/tokens/src/styles')},
            {find: /^@kui\/styles\/source/, replacement: resolve(__dirname, 'packages/styles/src')},
            {find: /^@kui\/tokens$/, replacement: resolve(__dirname, 'packages/tokens/src/index.ts')},
        ],
    },
    test: {
        environment: 'jsdom',
        globals: true,
        include: ['tests/unit/**/*.test.ts'],
    },
    server: {
        open: '/index.html',
    },
});
