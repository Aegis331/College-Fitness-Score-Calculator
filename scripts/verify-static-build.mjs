import console from 'node:console';
import { URL } from 'node:url';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, readdir, stat } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const dist = new URL('dist/', root);
const html = await readFile(new URL('index.html', dist), 'utf8');
const references = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map((match) => match[1]);
assert(references.some((url) => url.startsWith('/assets/') && url.endsWith('.js')));
assert(references.some((url) => url.startsWith('/assets/') && url.endsWith('.css')));
assert(references.includes('/favicon.svg'));
for (const url of references) {
  assert(url.startsWith('/') && !url.startsWith('//'), `Expected root-relative asset: ${url}`);
  assert((await stat(new URL(`.${url}`, dist))).size > 0, `Empty asset: ${url}`);
}

const metadata = await readFile(new URL('src/data/scoringRules/metadata.ts', root), 'utf8');
const pdfUrl = metadata.match(/url:\s*'([^']+)'/)?.[1];
assert(pdfUrl?.startsWith('/docs/scoring-standards/') && pdfUrl.endsWith('.pdf'));
const source = await readFile(new URL(`.${pdfUrl}`, root));
const deployed = await readFile(new URL(`.${pdfUrl}`, dist));
assert.equal(source.subarray(0, 5).toString(), '%PDF-');
assert.equal(source.length, deployed.length);
const hash = (buffer) => createHash('sha256').update(buffer).digest('hex');
assert.equal(hash(source), hash(deployed));
console.log(`PDF: ${source.length} bytes; SHA-256 ${hash(source)}`);

async function checkDirectory(directory, prefix = '') {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = `${prefix}${entry.name}`;
    if (entry.isDirectory()) {
      assert(['assets', 'docs', 'docs/scoring-standards'].includes(path), `Unexpected directory: ${path}`);
      await checkDirectory(new URL(`${entry.name}/`, directory), `${path}/`);
    } else {
      assert(entry.isFile(), `Unexpected file type: ${path}`);
      assert(/^(index\.html|favicon\.svg|assets\/[^/]+\.(js|css)|docs\/scoring-standards\/[^/]+\.pdf)$/.test(path), `Unexpected deployment file: ${path}`);
      if (!path.endsWith('.pdf')) {
        const text = await readFile(new URL(entry.name, directory), 'utf8');
        assert(!/localhost|127\.0\.0\.1|(?<![A-Za-z])[A-Za-z]:[\\/]|\/src\/|sourceMappingURL/.test(text), `Development reference in: ${path}`);
      }
    }
  }
}
await checkDirectory(dist);
console.log('Static build verified: HTML, JS, CSS, favicon, source PDF and deployment file allowlist.');
