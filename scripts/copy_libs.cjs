#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const src = path.resolve(process.cwd(), 'src', 'lib');
const dest = path.resolve(process.cwd(), 'public', 'lib');

async function copyDir(srcDir, destDir) {
  await fs.promises.mkdir(destDir, { recursive: true });
  const entries = await fs.promises.readdir(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else if (entry.isFile()) {
      await fs.promises.copyFile(srcPath, destPath);
    }
  }
}

async function main() {
  try {
    const stat = await fs.promises.stat(src);
    if (!stat.isDirectory()) {
      console.error('src/lib is not a directory:', src);
      process.exit(1);
    }
  } catch (err) {
    console.error('src/lib not found:', src);
    process.exit(1);
  }

  try {
    await copyDir(src, dest);
    console.log('Copied', src, '=>', dest);
  } catch (err) {
    console.error('Copy failed:', err);
    process.exit(2);
  }
}

main();
