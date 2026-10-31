// The Arabic course's synthesised voice (starter words 1.39.0, lessons' examples 1.40.0): which texts have a clip
// (only ones listened to before shipping — see app/scripts/prepare-audio.mjs; a clip belongs to its exact text, so one
// clip serves every place that text appears), and one shared player. One clip at a time, and only when you tap play — never by
// itself. A clip is fetched whole and played from memory, because the service worker keeps whole files for offline
// (an <audio src> would ask for byte ranges, which it doesn't keep). "Slower" plays the same clip at 0.75×, pitch
// kept; your choice is remembered on this device (myday.arabic.slower, not part of your MyDay data). "Always show the
// help" keeps a known word's play button and reading in view (myday.arabic.alwayshelp, on this device too).
import audio from './voice-clips.json';

const clips = audio.clips as Record<string, string>;
export const clipFor = (text: string): string | null => clips[text] ?? null;
export const hasVoice = Object.keys(clips).length > 0;
export const voiceLabel = audio.label;
export interface ReadingSentence { text: string; plain: string; spoken: string; line: number }
const readings = audio.readings as Record<string, ReadingSentence[]>;
export const readingFor = (id: string): ReadingSentence[] | null => readings[id] ?? null;
// A reading text read in one go (round ten), found by its whole text: “Listen to the whole text” plays it when it has
// a checked clip, and the sentences in turn when it hasn't.
const wholes = (audio as { wholes?: Record<string, string> }).wholes ?? {};
export const wholeClipFor = (id: string): string | null => (wholes[id] ? clipFor(wholes[id]) : null);
export const hasReadingVoice = Object.entries(readings).some(([id, parts]) => !!wholeClipFor(id) || parts.some(p => clipFor(p.spoken)));
// The texts the course gives without vowel marks, voiced from MyDay's vowelled copy (content/teaching/arabic/voice-scripts.json).
const scripted = new Set((audio as { scripted?: string[] }).scripted ?? []);
export const isScripted = (id: string) => scripted.has(id);
// Short pieces shown without marks and voiced from MyDay's vowelled copy (voice-scripts.json "pieces").
const scriptedPieces = new Set((audio as { scriptedPieces?: string[] }).scriptedPieces ?? []);
export const isScriptedPiece = (text: string) => scriptedPieces.has(text);

export const SLOWER_KEY = 'myday.arabic.slower';
function initialSlower() { try { return localStorage.getItem(SLOWER_KEY) === 'yes'; } catch { return false; } }
export const ALWAYS_HELP_KEY = 'myday.arabic.alwayshelp';
function initialAlwaysHelp() { try { return localStorage.getItem(ALWAYS_HELP_KEY) === 'yes'; } catch { return false; } }

export interface VoiceState { playing: string | null; loading: string | null; failed: string | null; slower: boolean; sequence: string | null; alwaysHelp: boolean }
let state: VoiceState = { playing: null, loading: null, failed: null, slower: initialSlower(), sequence: null, alwaysHelp: initialAlwaysHelp() };
const listeners = new Set<() => void>();
const set = (change: Partial<VoiceState>) => { state = { ...state, ...change }; listeners.forEach(l => l()); };
export const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
export const voiceState = () => state;

export function setSlower(on: boolean) {
  try { localStorage.setItem(SLOWER_KEY, on ? 'yes' : 'no'); } catch { /* Works for this visit if storage is unavailable. */ }
  if (player) player.defaultPlaybackRate = player.playbackRate = on ? 0.75 : 1;
  set({ slower: on });
}
export function setAlwaysHelp(on: boolean) {
  try { localStorage.setItem(ALWAYS_HELP_KEY, on ? 'yes' : 'no'); } catch { /* Works for this visit if storage is unavailable. */ }
  set({ alwaysHelp: on });
}

// An empty sound, played straight from the tap: some browsers (Safari) only let a page play sound it starts during
// a tap, and the clip arrives a moment later — this lets the same player go on to play it.
const SILENCE = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
let player: HTMLAudioElement | null = null, objectUrl: string | null = null, turn = 0;

function stop() {
  turn++;
  if (player) { player.onended = null; player.onerror = null; player.pause(); }
  if (objectUrl) URL.revokeObjectURL(objectUrl);
  objectUrl = null;
  set({ playing: null, loading: null, sequence: null });
}

// A text's page stops only its own playback when you leave it; a different page cannot stop a newer clip.
export function stopVoiceFor(prefix: string) {
  if ([state.playing, state.loading, state.sequence].some(key => key === prefix || key?.startsWith(prefix + ':'))) stop();
}

interface Clip { key: string; file: string }
async function start(items: Clip[], sequence: string | null) {
  stop();
  if (!items.length) return;
  const mine = turn;
  player ??= new Audio();
  player.src = SILENCE;
  player.play().catch(() => {});
  const play = async (index: number): Promise<void> => {
    if (mine !== turn) return;
    const { key, file } = items[index];
    const failed = () => { if (mine === turn) { stop(); set({ failed: key }); } };
    set({ playing: null, loading: key, failed: null, sequence });
    try {
      const res = await fetch('arabic-audio/' + file);
      if (!res.ok) throw new Error('clip ' + res.status);
      const blob = await res.blob();
      if (mine !== turn) return;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      objectUrl = URL.createObjectURL(blob);
      player!.src = objectUrl;
      player!.preservesPitch = true;
      player!.defaultPlaybackRate = player!.playbackRate = state.slower ? 0.75 : 1;
      player!.onerror = failed;
      player!.onended = () => {
        if (mine !== turn) return;
        if (index + 1 < items.length) void play(index + 1);
        else stop();
      };
      await player!.play();
      if (mine === turn) set({ loading: null, playing: key });
    } catch { failed(); }
  };
  await play(0);
}

// Play one clip, cancelling any whole-text request, or stop the current clip.
export async function playOrStop(key: string, file: string) {
  if (state.playing === key || state.loading === key) { stop(); return; }
  await start([{ key, file }], null);
}

// Only the current sentence is fetched; subsequent sentences follow its end, never a timer.
export async function playSequenceOrStop(group: string, items: Clip[]) {
  if (state.sequence === group) { stop(); return; }
  await start(items, group);
}
