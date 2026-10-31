// Makes the Arabic course's synthesised voice — run by hand when authoring, never by the build, never by the app.
//
//   GOOGLE_TTS_API_KEY=… node app/scripts/make-arabic-audio.mjs <source>      e.g. lesson-examples
//
// For each text of that voiced source (arabic-voice-sources.mjs) that has no clip yet, or whose check says "redo", one
// voice speaks the exact vowelled text; the clip is saved as an MP3 named by its contents and recorded in
// content/arabic-audio/audio-audit.json under its text, as "to check". The build ships nothing until it's been
// listened to (prepare-audio.mjs). The key (Google Cloud Text-to-Speech only) comes from the environment and is
// never written anywhere.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { spokenFor, voiceSources } from './arabic-voice-sources.mjs';

const root = new URL('../../', import.meta.url);
const dir = new URL('content/arabic-audio/', root), clips = new URL('clips/', dir), auditFile = new URL('audio-audit.json', dir);
const sources = voiceSources(root), source = sources.find(s => s.id === process.argv[2]);
if (!source) throw new Error(`Name a voiced source: ${sources.map(s => s.id).join(', ')}`);
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
let made = 0, chars = 0;
for (const text of source.texts) {
  const entry = audit.clips[text];
  if (entry && entry.check !== 'redo') continue;
  const res = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize', {
    method: 'POST',
    signal: AbortSignal.timeout(30000),
    headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({ input: { text: spoken(text) }, voice: { languageCode: 'ar-XA', name: VOICE }, audioConfig: { audioEncoding: 'MP3', sampleRateHertz: 24000 } }),
  });
  if (!res.ok) throw new Error(`“${text}”: ${res.status} ${(await res.text()).slice(0, 200)}`);
  const audio = Buffer.from((await res.json()).audioContent, 'base64');
  const file = createHash('sha256').update(audio).digest('hex').slice(0, 16) + '.mp3';
  writeFileSync(new URL(file, clips), audio);
  // The old clip goes, unless another text's clip is the same file (the same words spoken the same way can come back as
  // the same audio: لَمْ, and the piece لم read from its script); the build then asks for a take of its own.
  const shared = Object.entries(audit.clips).some(([other, c]) => other !== text && c.file === entry?.file);
  if (entry?.file && entry.file !== file && !shared) rmSync(new URL(entry.file, clips), { force: true });
  audit.clips[text] = { file, voice: VOICE, made: today, spoken: spoken(text), check: 'to check', ...(entry?.note ? { earlier: entry.note } : {}) };
  // Keep completed clips in the audit even if a later request fails or the run is interrupted.
  writeFileSync(auditFile, JSON.stringify(audit, null, 1) + '\n');
  made++; chars += text.length;
}
writeFileSync(auditFile, JSON.stringify(audit, null, 1) + '\n');
console.log(`${source.label}: ${made} clips made (${chars} characters); ${source.texts.filter(t => audit.clips[t]).length} of ${source.texts.length} now have a clip.`);
