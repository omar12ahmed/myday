import { LoaderCircle, Square, Volume2 } from 'lucide-react';
import { useEffect, useSyncExternalStore } from 'react';
import { Switch } from '../../components/Switch';
import { clipFor, isScriptedPiece, playOrStop, setSlower, stopVoiceFor, subscribe, voiceLabel, voiceState } from './voice';
import { arabicRuns } from './arabic-runs.mjs';

// A play button for a piece of Arabic: `text` exactly as shown (its clip is found by it). Nothing at all when that text
// has no clip that's been listened to. `name` says which button it is (for one-at-a-time and the tests): "<word id>:word",
// "<lesson id>:example". `label` is what it plays, for its accessible name: "Play كِتَاب".
export function PlayButton({ text, name, label }: { text: string; name: string; label: string }) {
  const s = useSyncExternalStore(subscribe, voiceState);
  const file = clipFor(text);
  useEffect(() => () => stopVoiceFor(name), [name]);
  if (!file) return null;
  const key = name, playing = s.playing === key, loading = s.loading === key;
  return <span className="inline-flex max-w-full items-center gap-2 align-middle">
    <button type="button" data-action="ar-play" data-ar-clip={key} data-state={playing ? 'playing' : loading ? 'loading' : s.failed === key ? 'failed' : 'idle'}
      aria-label={playing || loading ? `Stop ${label}` : `Play ${label}`} onClick={() => playOrStop(key, file)}
      className="grid place-items-center size-11 flex-none rounded-btn border border-outline bg-surface hover:bg-surface-2 text-primary cursor-pointer">
      {playing ? <Square size={15} fill="currentColor" aria-hidden="true" /> : loading ? <LoaderCircle size={19} className="animate-spin" aria-hidden="true" /> : <Volume2 size={20} aria-hidden="true" />}
    </button>
    {s.failed === key && <span role="status" className="min-w-0 text-sm text-fg-2">Couldn’t play it. The first time, it needs a connection.</span>}
  </span>;
}

// A single honest label for a section of mixed prose, only if it has a playable run.
export function MixedVoiceLabel({ texts }: { texts: string[] }) {
  const voiced = texts.flatMap(t => arabicRuns(t).map(p => p.text.trim())).filter(t => clipFor(t));
  if (!voiced.length) return null;
  // Arabic shown without marks is voiced from MyDay's vowelled copy (voice-scripts.json "pieces"): say so.
  const scripted = voiced.some(isScriptedPiece);
  return <p className="text-xs text-fg-2 m-0 mt-2" data-ar-voice-label="">{voiceLabel}{scripted && <span data-ar-voice-script=""> Where the Arabic has no vowel marks, it reads MyDay’s vowelled copy.</span>} Slower playback: Study → Arabic → Vocabulary.</p>;
}

// The honest label under a piece of Arabic that has a voice, away from the Vocabulary card (e.g. a lesson's example).
export function VoiceLabel({ text }: { text: string }) {
  if (!clipFor(text)) return null;
  return <p className="text-xs text-fg-2 m-0 mt-1" data-ar-voice-label="">{voiceLabel} Slower playback: Study → Arabic → Vocabulary.</p>;
}

// What the voice is, honestly, and the Slower switch: on the Vocabulary card.
export function VoiceNote() {
  const { slower } = useSyncExternalStore(subscribe, voiceState);
  return <div className="mt-3" data-ar-voice="">
    <p className="text-sm text-fg-2 flex gap-2 items-start m-0"><Volume2 size={18} className="flex-none mt-0.5" aria-hidden="true" />
      <span><span className="font-semibold text-fg">{voiceLabel}</span> Tap play beside a word or its example. At the end of a sentence the voice may stop without the last vowel, as speakers do.</span></p>
    <p className="text-sm text-fg-2 mt-1.5 mb-0 pl-[26px]">Revision covers reading and writing. The synthesised voice is there to copy; listening and speaking stay untested.</p>
    <div className="mt-2.5 pl-[26px] flex flex-wrap items-center gap-x-3 gap-y-1">
      <Switch on={slower} onChange={setSlower} data-action="ar-slower">Slower</Switch>
      <span className="text-sm text-fg-2">Three-quarter speed, same voice. Remembered on this device.</span>
    </div>
  </div>;
}
