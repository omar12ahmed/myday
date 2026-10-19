// The Arabic starter words' audio (1.39.0): checked at every build against the text it says, then the clips that
// have been listened to are copied for the app. A clip whose word or example has changed since it was made, a file
// whose contents don't match its name, a stray file or an unknown check fails the build. Clips not yet listened to
// ("to check", "redo") and ones left out ship nothing: their words simply have no play button.
// Clips: content/arabic-audio/ (made by make-arabic-audio.mjs) → public/arabic-audio/ (not in Git; cached by the
// service worker only when played) and the list the app reads, src/study/arabic/voice-clips.json — kept out of
// src/study/arabic/data/, which prepare-arabic.mjs empties and rewrites whenever it runs.
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

const root = new URL('../../', import.meta.url);
const read = p => JSON.parse(readFileSync(new URL(p, root), 'utf8'));
const fail = message => { throw new Error('Arabic audio: ' + message); };
// Usually the authored folder; a test can pass another one to check that a broken audit fails.
const dir = process.argv[2] ? new URL('file://' + process.argv[2].replace(/\/?$/, '/')) : new URL('content/arabic-audio/', root);
const clipsDir = new URL('clips/', dir);
const audit = JSON.parse(readFileSync(new URL('audio-audit.json', dir), 'utf8'));
const lexicon = new Map(read('content/arabic-fusha/MyDay_Arabic_Fusha_Curriculum.json').lexicon_seed.map(w => [w.id, w]));
const CHECKS = ['to check', 'checked', 'redo', 'left out'];
if (!audit.voice?.name || !audit.label) fail('the audit needs its voice and its label');

const used = new Set(), shipped = {};
const count = Object.fromEntries(CHECKS.map(c => [c, 0]));
for (const [id, parts] of Object.entries(audit.clips ?? {})) {
  const w = lexicon.get(id);
  if (!w) fail(`${id} isn't a starter word`);
  for (const [part, c] of Object.entries(parts)) {
    const text = part === 'word' ? w.form_ar : part === 'example' ? w.example_ar : fail(`${id}: “${part}” is neither its word nor its example`);
    if (c.text !== text) fail(`${id} ${part}: the text changed since its clip was made (clip says “${c.text}”, the course now has “${text}”). Make it again with make-arabic-audio.mjs.`);
    if (!CHECKS.includes(c.check)) fail(`${id} ${part}: unknown check “${c.check}”`);
    if (c.voice !== audit.voice.name) fail(`${id} ${part}: made with another voice (${c.voice})`);
    if (!/^[0-9a-f]{16}\.mp3$/.test(c.file ?? '')) fail(`${id} ${part}: a clip is named by its contents (16 hex + .mp3)`);
    const at = new URL(c.file, clipsDir);
    if (!existsSync(at)) fail(`${id} ${part}: ${c.file} is missing`);
    const bytes = readFileSync(at);
    if (createHash('sha256').update(bytes).digest('hex').slice(0, 16) + '.mp3' !== c.file) fail(`${id} ${part}: ${c.file}'s contents don't match its name`);
    // Under 2 KB is under half a second at this bit rate: a clip cut short (it happens), not a whole word.
    if (bytes.length < 2000) fail(`${id} ${part}: ${c.file} is too short to be a whole word`);
    used.add(c.file);
    count[c.check]++;
    if (c.check === 'checked') (shipped[id] ??= {})[part] = c.file;
  }
}
const stray = readdirSync(clipsDir).filter(f => !used.has(f));
if (stray.length) fail(`files no clip uses: ${stray.join(', ')}`);

if (!process.argv[2]) {
  const out = new URL('app/public/arabic-audio/', root);
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  for (const parts of Object.values(shipped)) for (const file of Object.values(parts)) copyFileSync(new URL(file, clipsDir), new URL(file, out));
  writeFileSync(new URL('app/src/study/arabic/voice-clips.json', root), JSON.stringify({ voice: audit.voice.name, label: audit.label, clips: shipped }));
}
console.log(`Arabic audio: ${count.checked} clips listened to and shipped; ${count['to check'] + count.redo} not yet listened to, ${count['left out']} left out (no button).`);
