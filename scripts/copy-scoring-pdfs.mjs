import console from 'node:console';
import { URL } from 'node:url';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { copyFile, mkdir, readFile, readdir } from 'node:fs/promises';

const sourceDirectory = new URL('../docs/scoring-standards/', import.meta.url);
const outputDirectory = new URL('../dist/docs/scoring-standards/', import.meta.url);
const pdfs = (await readdir(sourceDirectory, { withFileTypes: true }))
  .filter((entry) => entry.isFile() && entry.name.endsWith('.pdf'));
assert(pdfs.length > 0, 'No canonical scoring PDFs found.');
await mkdir(outputDirectory, { recursive: true });
for (const { name } of pdfs) {
  const source = new URL(name, sourceDirectory);
  const output = new URL(name, outputDirectory);
  await copyFile(source, output);
  const original = await readFile(source);
  const copied = await readFile(output);
  const hash = (buffer) => createHash('sha256').update(buffer).digest('hex');
  assert.equal(copied.length, original.length, `PDF size mismatch: ${name}`);
  assert.equal(hash(copied), hash(original), `PDF hash mismatch: ${name}`);
  console.log(`Copied scoring PDF: ${name} (${copied.length} bytes, SHA-256 verified)`);
}
