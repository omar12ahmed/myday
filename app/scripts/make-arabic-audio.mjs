// Makes the Arabic starter words' audio (1.39.0) — run by hand when authoring, never by the build, never by the app.
// Each of the 48 words and its example sentence is spoken by one synthesised voice from its exact vowelled text in
// the curriculum package, saved as an MP3 named by its contents, and recorded in content/arabic-audio/audio-audit.json
// with the text it says. A clip is made only when it's new, its text changed, or its check says "redo"; every new
// clip starts as "to check" and the build ships nothing until it's been listened to (validate-audio.mjs).
//
//   GOOGLE_TTS_API_KEY=… node app/scripts/make-arabic-audio.mjs
//
// The key (Google Cloud Text-to-Speech only) comes from the environment and is never written anywhere.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

const VOICE = 'ar-XA-Chirp3-HD-Charon';
const root = new URL('../../', import.meta.url);
const dir = new URL('content/arabic-audio/', root), clips = new URL('clips/', dir), auditFile = new URL('audio-audit.json', dir);
const key = process.env.GOOGLE_TTS_API_KEY;
if (!key) throw new Error('Set GOOGLE_TTS_API_KEY (a key for the Text-to-Speech API only).');
const lexicon = JSON.parse(readFileSync(new URL('content/arabic-fusha/MyDay_Arabic_Fusha_Curriculum.json', root), 'utf8')).lexicon_seed;
mkdirSync(clips, { recursive: true });
const audit = existsSync(auditFile) ? JSON.parse(readFileSync(auditFile, 'utf8')) : {
  about: 'Audio for the Arabic starter words: one synthesised voice, made from the exact vowelled text below and listened to before it ships. MyDay’s own add-on — the curriculum package’s audio_status describes the course’s own materials and is unchanged. Made by app/scripts/make-arabic-audio.mjs; checked at every build by app/scripts/validate-audio.mjs.',
  voice: { service: 'Google Cloud Text-to-Speech', name: VOICE, kind: 'Chirp 3 HD prebuilt voice (not a custom or cloned voice)', settings: 'MP3, 24 kHz, normal speed; slower playback is done by the browser' },
  label: 'Synthesised voice — a model to copy; checked by ear, not yet by a teacher.',
  checks: { 'to check': 'made, not yet listened to: not shipped', checked: 'listened to against the text: shipped', redo: 'heard a mistake: made again next run', 'left out': 'couldn’t be made right: no play button' },
  clips: {},
};
const today = new Date().toISOString().slice(0, 10);
let made = 0, chars = 0;
for (const w of lexicon) {
  for (const [part, text] of [['word', w.form_ar], ['example', w.example_ar]]) {
    const entry = audit.clips[w.id]?.[part];
    if (entry && entry.text === text && entry.check !== 'redo') continue;
    const res = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({ input: { text }, voice: { languageCode: 'ar-XA', name: VOICE }, audioConfig: { audioEncoding: 'MP3', sampleRateHertz: 24000 } }),
    });
    if (!res.ok) throw new Error(`${w.id} ${part}: ${res.status} ${(await res.text()).slice(0, 200)}`);
    const audio = Buffer.from((await res.json()).audioContent, 'base64');
    const file = createHash('sha256').update(audio).digest('hex').slice(0, 16) + '.mp3';
    writeFileSync(new URL(file, clips), audio);
    if (entry?.file && entry.file !== file) rmSync(new URL(entry.file, clips), { force: true });
    (audit.clips[w.id] ??= {})[part] = { text, file, voice: VOICE, made: today, check: 'to check', ...(entry?.note ? { earlier: entry.note } : {}) };
    made++; chars += text.length;
  }
}
writeFileSync(auditFile, JSON.stringify(audit, null, 1) + '\n');
console.log(`${made} clips made (${chars} characters); ${Object.keys(audit.clips).length} words in the audit.`);
