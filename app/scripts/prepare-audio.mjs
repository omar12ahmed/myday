// The Arabic course's synthesised voice (1.39.0, 1.40.0): checked at every build against the course, then the clips
// that have been listened to are copied for the app. Each clip belongs to its exact text (one clip serves every place
// that text appears); which texts have a voice is defined in arabic-voice-sources.mjs.
//
// The build fails on: a clip whose text is no longer in any voiced part of the course (so a changed sentence can't
// keep an old voice), a file whose contents don't match its name, a file cut short, a stray file, a clip made with
// another voice, or an unknown check. Clips not yet listened to ("to check", "redo") and ones left out ship nothing:
// their text simply has no play button.
// Clips: content/arabic-audio/ (made by make-arabic-audio.mjs) → public/arabic-audio/ (not in Git; cached by the
// service worker only when played) and the list the app reads, src/study/arabic/voice-clips.json — kept out of
// src/study/arabic/data/, which prepare-arabic.mjs empties and rewrites whenever it runs.
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { spokenText, voiceSources } from './arabic-voice-sources.mjs';
import { readingPassages, wholeText } from './arabic-reading-sentences.mjs';

const root = new URL('../../', import.meta.url);
const fail = message => { throw new Error('Arabic audio: ' + message); };
// Usually the authored folder; a test can pass another one to check that a broken audit fails (nothing is written).
const dir = process.argv[2] ? new URL('file://' + process.argv[2].replace(/\/?$/, '/')) : new URL('content/arabic-audio/', root);
const clipsDir = new URL('clips/', dir);
const audit = JSON.parse(readFileSync(new URL('audio-audit.json', dir), 'utf8'));
const sources = voiceSources(root);
const CHECKS = ['to check', 'checked', 'redo', 'left out'];
if (!audit.voice?.name || !audit.label) fail('the audit needs its voice and its label');
// New clips are made with the audit's voice; clips made earlier with a voice listed under earlier_voices still ship.
const VOICES = [audit.voice.name, ...(audit.earlier_voices ?? []).map(v => v.name)];

const used = new Set(), shipped = {};
const count = Object.fromEntries(CHECKS.map(c => [c, 0]));
for (const [text, c] of Object.entries(audit.clips ?? {})) {
  const short = `“${text.length > 40 ? text.slice(0, 40) + '…' : text}”`;
  if (!sources.some(s => s.texts.includes(text))) fail(`${short}: its text is no longer in any voiced part of the course. Make the new text's clip with make-arabic-audio.mjs and take this one out.`);
  if (!CHECKS.includes(c.check)) fail(`${short}: unknown check “${c.check}”`);
  if (c.spoken !== undefined && c.spoken !== spokenText(text)) fail(`${short}: the spoken text changes more than its pause punctuation`);
  if (!VOICES.includes(c.voice)) fail(`${short}: made with a voice the audit doesn't list (${c.voice})`);
  if (!/^[0-9a-f]{16}\.mp3$/.test(c.file ?? '')) fail(`${short}: a clip is named by its contents (16 hex + .mp3)`);
  const at = new URL(c.file, clipsDir);
  if (!existsSync(at)) fail(`${short}: ${c.file} is missing`);
  const bytes = readFileSync(at);
  if (createHash('sha256').update(bytes).digest('hex').slice(0, 16) + '.mp3' !== c.file) fail(`${short}: ${c.file}'s contents don't match its name`);
  // Under 2 KB is under half a second at this bit rate: a clip cut short (it happens), not a whole word.
  if (bytes.length < 2000) fail(`${short}: ${c.file} is too short to be a whole word`);
  if (used.has(c.file)) fail(`${short}: ${c.file} is used by two texts`);
  used.add(c.file);
  count[c.check]++;
  if (c.check === 'checked') shipped[text] = c.file;
}
const stray = readdirSync(clipsDir).filter(f => !used.has(f));
if (stray.length) fail(`files no clip uses: ${stray.join(', ')}`);

if (!process.argv[2]) {
  const out = new URL('app/public/arabic-audio/', root);
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  for (const file of Object.values(shipped)) copyFileSync(new URL(file, clipsDir), new URL(file, out));
  // A reading text's whole clip is found by its whole text (wholeText), for “Listen to the whole text”.
  const readings = readingPassages(root);
  writeFileSync(new URL('app/src/study/arabic/voice-clips.json', root), JSON.stringify({ voice: audit.voice.name, label: audit.label, clips: shipped, readings, wholes: Object.fromEntries(Object.entries(readings).map(([id, parts]) => [id, wholeText(parts)])) }));
}
const per = sources.map(s => `${s.label} ${s.texts.filter(t => shipped[t]).length} of ${s.texts.length}`).join('; ');
console.log(`Arabic audio: ${count.checked} clips listened to and shipped; ${count['to check'] + count.redo} not yet listened to, ${count['left out']} left out (no button). With a voice: ${per}.`);
