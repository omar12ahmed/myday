// The starter words' voice (1.39.0): which word and example have a clip (only ones listened to before shipping — see
// app/scripts/prepare-audio.mjs), and one shared player. One clip at a time, and only when you tap play — never by
// itself. A clip is fetched whole and played from memory, because the service worker keeps whole files for offline
// (an <audio src> would ask for byte ranges, which it doesn't keep). "Slower" plays the same clip at 0.75×, pitch
// kept; your choice is remembered on this device (myday.arabic.slower, not part of your MyDay data).
import audio from './voice-clips.json';

export type Part = 'word' | 'example';
const clips = audio.clips as Record<string, Partial<Record<Part, string>>>;
export const clipOf = (id: string, part: Part): string | null => clips[id]?.[part] ?? null;
export const hasVoice = Object.keys(clips).length > 0;
export const voiceLabel = audio.label;

export const SLOWER_KEY = 'myday.arabic.slower';
function initialSlower() { try { return localStorage.getItem(SLOWER_KEY) === 'yes'; } catch { return false; } }

export interface VoiceState { playing: string | null; loading: string | null; failed: string | null; slower: boolean }
let state: VoiceState = { playing: null, loading: null, failed: null, slower: initialSlower() };
const listeners = new Set<() => void>();
const set = (change: Partial<VoiceState>) => { state = { ...state, ...change }; listeners.forEach(l => l()); };
export const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
export const voiceState = () => state;

export function setSlower(on: boolean) {
  try { localStorage.setItem(SLOWER_KEY, on ? 'yes' : 'no'); } catch { /* Works for this visit if storage is unavailable. */ }
  if (player) player.defaultPlaybackRate = player.playbackRate = on ? 0.75 : 1;
  set({ slower: on });
}

// An empty sound, played straight from the tap: some browsers (Safari) only let a page play sound it starts during
// a tap, and the clip arrives a moment later — this lets the same player go on to play it.
const SILENCE = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
let player: HTMLAudioElement | null = null, objectUrl: string | null = null, turn = 0;

function stop() {
  turn++;
  if (player) { player.onended = null; player.pause(); }
  if (objectUrl) URL.revokeObjectURL(objectUrl);
  objectUrl = null;
  set({ playing: null, loading: null });
}

// Play a clip, or stop it if it's the one playing. `key` names the button ("<word id>:word").
export async function playOrStop(key: string, file: string) {
  if (state.playing === key || state.loading === key) { stop(); return; }
  stop();
  const mine = turn;
  player ??= new Audio();
  player.src = SILENCE;
  player.play().catch(() => {});
  set({ loading: key, failed: null });
  try {
    const res = await fetch('arabic-audio/' + file);
    if (!res.ok) throw new Error('clip ' + res.status);
    const blob = await res.blob();
    if (mine !== turn) return;
    objectUrl = URL.createObjectURL(blob);
    player.src = objectUrl;
    player.preservesPitch = true;
    // Loading a clip resets the speed to the default one, so both are set.
    player.defaultPlaybackRate = player.playbackRate = state.slower ? 0.75 : 1;
    player.onended = () => { if (mine === turn) stop(); };
    await player.play();
    if (mine === turn) set({ loading: null, playing: key });
  } catch {
    if (mine !== turn) return;
    stop();
    set({ failed: key });
  }
}
