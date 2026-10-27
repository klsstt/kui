import {cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import * as sass from 'sass';

const packageRoot = fileURLToPath(new URL(',', import.meta.url));
const sourceRoot = resolve(packageRoot, 'src');
const output = resolve(packageRoot, 'dist');
const tokenCssPath = resolve(packageRoot, '../tokens/dist/tokens.css');
const fontAwesomeSource = resolve(packageRoot, '../../public/assets/font-awesome-4.7');
const singleLayerEntries = ['reset', 'typography', 'accessibility', 'layout', 'utilities', 'components'];

await rm(output, { force: true, recursive: true });
await mkdir(output, { recursive: true });

const tokenCss = await readFile(tokenCssPath, 'utf8').catch(() => {
    throw new Error('@kui/tokens must be built before @kui/styles. Run the package build script instead of build:local.');
});
await cp(tokenCssPath, resolve(output, 'tokens.css'));

for(const entry of singleLayerEntries) {
    await writeFile(resolve(output, `${entry}.css`), await compileEntry(entry));
}

const foundation = await compileEntry('foundation');
const full = await compileEntry('full');
await cp(fontAwesomeSource, resolve(output, 'font-awesome-4.7'), { recursive: true });
await writeFile(resolve(output, 'foundation.css'), joinCss(tokenCss, foundation));
await writeFile(resolve(output, 'full.css'), joinCss('@import "./font-awesome-4.7/font-awesome.min.css";', tokenCss, full));

async function compileEntry(entry) {
    const result = await sass.compileAsync(resolve(sourceRoot, `entries/${entry}.scss`), {
        loadPaths: [sourceRoot],
        style: 'compressed',
    });
    return result.css;
}

function joinCss(...parts) {
    return `${parts.map((part) => part.trim()).filter(Boolean).join('\n')}\n`;
}
