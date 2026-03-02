/**
 * Patch ts-md5 package.json to add exports field for ESM resolution.
 *
 * ngx-gravatar imports 'ts-md5/dist/md5' which fails in ESM because
 * directory imports are not supported. This patch adds an exports map
 * that resolves 'ts-md5/dist/md5' to 'ts-md5/dist/md5.js'.
 *
 * This workaround is needed until ngx-gravatar is replaced with a
 * custom solution (it's unmaintained since 2022).
 */
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgPath = resolve(__dirname, '../node_modules/ts-md5/package.json');

try {
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
  if (!pkg.exports) {
    pkg.exports = {
      '.': {
        import: './dist/esm/index.js',
        require: './dist/cjs/index.js',
        types: './dist/esm/index.d.ts',
      },
      './dist/md5': './dist/md5.js',
      './*': './*',
    };
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 4) + '\n');
    console.log('Patched ts-md5 package.json with exports field');
  }
} catch (e) {
  // ts-md5 not installed yet, skip
}
