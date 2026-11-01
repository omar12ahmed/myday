// Makes the Arabic course's synthesised voice — run by hand when authoring, never by the build, never by the app.
//
//   GOOGLE_TTS_API_KEY=… node app/scripts/make-arabic-audio.mjs <source>      e.g. lesson-examples
//   GOOGLE_TTS_API_KEY=… node app/scripts/make-arabic-audio.mjs <source> --redo-only
//   GOOGLE_TTS_API_KEY=… node app/scripts/make-arabic-audio.mjs <source> --only=<file of texts, one per line>
//
// For each text of that voiced source (arabic-voice-sources.mjs) that has no clip yet, or whose check says "redo", one
// voice speaks the exact vowelled text; the clip is saved as an MP3 named by its contents and recorded in
// content/arabic-audio/audio-audit.json under its text, as "to check". The build ships nothing until it's been
// listened to (prepare-audio.mjs). With --redo-only, only clips marked "redo" are made: a text of that source with no
// clip yet waits for its own round (its words may not have been checked). With --only, only the texts listed in that
// file are made (a batch the owner has checked, when others in the same source haven't been). Any other option stops
// before anything is made. The key (Google Cloud Text-to-Speech only) comes from the environment and is never written
// anywhere.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { spokenFor, voiceSources } from './arabic-voice-sources.mjs';

const root = new URL('../../', import.meta.url);
const dir = new URL('content/arabic-audio/', root), clips = new URL('clips/', dir), auditFile = new URL('audio-audit.json', dir);
const sources = voiceSources(root), source = sources.find(s => s.id === process.argv[2]);
if (!source) throw new Error(`Name a voiced source: ${sources.map(s => s.id).join(', ')}`);
const options = process.argv.slice(3), unknown = options.filter(o => o !== '--redo-only' && !/^--only=./.test(o));
if (unknown.length) throw new Error(`Unknown option ${unknown.join(' ')}: use --redo-only or --only=<file>`);
if (options.filter(o => o.startsWith('--only=')).length > 1) throw new Error('Give --only once: one file lists the batch');
const redoOnly = options.includes('--redo-only'), onlyFile = options.find(o => o.startsWith('--only='))?.slice('--only='.length);
const only = onlyFile ? new Set(readFileSync(onlyFile, 'utf8').split('\n').map(t => t.trim()).filter(Boolean)) : null;
const outside = only ? [...only].find(t => !source.texts.includes(t)) : undefined;
if (outside !== undefined) throw new Error(`${onlyFile}: lists a text that isn't in ${source.id}: “${outside}”`);
const key = process.env.GOOGLE_TTS_API_KEY;
if (!key) throw new Error('Set GOOGLE_TTS_API_KEY (a key for the Text-to-Speech API only).');
if (!existsSync(auditFile)) throw new Error('No audio-audit.json: round one made it; restore it from Git.');
const audit = JSON.parse(readFileSync(auditFile, 'utf8'));
const VOICE = audit.voice.name;
mkdirSync(clips, { recursive: true });
const today = new Date().toISOString().slice(0, 10);
// What the voice is given: the text as shown, except that a slash between alternatives ("مَلِك / مَالِك") is spoken as
// a short pause (an Arabic comma) — read aloud, the slash came out as a stray word.
// A final full stop makes an isolated form a complete utterance, without changing any of its letters or marks.
const spoken = spokenFor(root);
// A clip the owner heard too fast, or with a sound wrong at the usual speed, can be redone slower: its "rate" (the
// voice's speaking rate, from 0.5 to under 1, as prepare-audio.mjs checks) is set on the clip before the redo and kept
// with it, so a later take keeps it. A rate belongs to the voice it was found for: made in another voice, a clip starts
// again at the usual speed. Every clip to be made is checked before any is made or any file is touched.
// Where the voice for new clips can't be got right, one clip can be made in an earlier voice the audit lists: its
// "fallback" names that voice and stays with the clip (the owner's choice, 1 November 2026: WaveNet B where Charon
// fails, before a clip is left out). A rate set together with a fallback is for the fallback voice.
const slower = rate => typeof rate === 'number' && rate >= 0.5 && rate < 1;
const earlierVoices = (audit.earlier_voices ?? []).map(v => v.name);
const voiceOf = entry => entry?.fallback ?? VOICE;
const rateOf = entry => entry?.voice === voiceOf(entry) || entry?.fallback ? entry?.rate : undefined;
const texts = only ? source.texts.filter(t => only.has(t)) : source.texts;
for (const text of texts) {
  const entry = audit.clips[text];
  if (entry?.check !== 'redo') continue;
  if (entry.fallback !== undefined && (!earlierVoices.includes(entry.fallback) || entry.fallback === VOICE)) throw new Error(`“${text}”: a fallback is an earlier voice the audit lists, not the voice for new clips (${entry.fallback})`);
  if (rateOf(entry) !== undefined && !slower(rateOf(entry))) throw new Error(`“${text}”: a clip's speaking rate is only ever slower, from 0.5 to under 1 (${entry.rate})`);
}
let made = 0, chars = 0;
for (const text of texts) {
  const entry = audit.clips[text];
  if (entry ? entry.check !== 'redo' : redoOnly) continue;
  const rate = rateOf(entry), voice = voiceOf(entry);
  const res = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize', {
    method: 'POST',
    signal: AbortSignal.timeout(30000),
    headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({ input: { text: spoken(text) }, voice: { languageCode: 'ar-XA', name: voice }, audioConfig: { audioEncoding: 'MP3', sampleRateHertz: 24000, ...(rate !== undefined ? { speakingRate: rate } : {}) } }),
  });
  if (!res.ok) throw new Error(`“${text}”: ${res.status} ${(await res.text()).slice(0, 200)}`);
  const audio = Buffer.from((await res.json()).audioContent, 'base64');
  const file = createHash('sha256').update(audio).digest('hex').slice(0, 16) + '.mp3';
  writeFileSync(new URL(file, clips), audio);
  // The old clip goes, unless another text's clip is the same file (the same words spoken the same way can come back as
  // the same audio: لَمْ, and the piece لم read from its script); the build then asks for a take of its own.
  const shared = Object.entries(audit.clips).some(([other, c]) => other !== text && c.file === entry?.file);
  if (entry?.file && entry.file !== file && !shared) rmSync(new URL(entry.file, clips), { force: true });
  // The clip's history goes with it: what an earlier take recorded ("earlier"), then any note set before this redo.
  const earlier = [entry?.earlier, entry?.note].filter(Boolean).join(' ');
  audit.clips[text] = { file, voice, made: today, spoken: spoken(text), ...(rate !== undefined ? { rate } : {}), ...(entry?.fallback ? { fallback: entry.fallback } : {}), check: 'to check', ...(earlier ? { earlier } : {}) };
  // Keep completed clips in the audit even if a later request fails or the run is interrupted.
  writeFileSync(auditFile, JSON.stringify(audit, null, 1) + '\n');
  made++; chars += text.length;
}
writeFileSync(auditFile, JSON.stringify(audit, null, 1) + '\n');
console.log(`${source.label}: ${made} clips made (${chars} characters); ${source.texts.filter(t => audit.clips[t]).length} of ${source.texts.length} now have a clip.`);
