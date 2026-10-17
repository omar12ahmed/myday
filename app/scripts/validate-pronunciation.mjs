import { readFileSync } from 'node:fs';
const root = new URL('../../', import.meta.url);
const read = p => JSON.parse(readFileSync(new URL(p, root), 'utf8'));
const fail = message => { throw new Error('Arabic pronunciation: ' + message); };
const material = read('content/arabic-fusha/MyDay_Arabic_Starter_Materials.json');
const passages = read('content/teaching/pronunciation/passages.json');
const readings = read('content/teaching/pronunciation/readings.json');
const source = material.assets ?? material.starter_assets;
if (!Array.isArray(source)) fail('starter asset structure changed');
const texts = source.filter(a => a.text_ar);
if (Object.keys(passages).length !== texts.length) fail('every reading text needs exactly one prepared reading');
for (const a of texts) {
  const p = passages[a.id];
  if (!p || p.source !== a.text_ar) fail('missing or stale reading for ' + a.id);
  if (!p.latin.trim() || /[ء-ي]/.test(p.latin) || p.latin.split('\n').length !== a.text_ar.split('\n').length) fail('invalid reading or dialogue line alignment for ' + a.id);
}
const keys = new Set();
for (const [ar, latin] of Object.entries(readings)) {
  const key = ar.normalize('NFC').replace(/\s+/g, ' ').trim();
  if (keys.has(key) || !key || !latin.trim() || /[ء-ي]/.test(latin)) fail('duplicate or invalid entry ' + ar);
  keys.add(key);
}
console.log(`Arabic pronunciation: ${texts.length} prepared texts, ${keys.size} authored readings; source text and line alignment validated.`);
