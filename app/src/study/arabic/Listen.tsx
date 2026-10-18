import { LoaderCircle, Square, Volume2 } from 'lucide-react';
import { useSyncExternalStore } from 'react';
import { Switch } from '../../components/Switch';
import { clipOf, playOrStop, setSlower, subscribe, voiceLabel, voiceState, type Part } from './voice';

// A play button for a starter word or its example (1.39.0). Nothing at all when that clip hasn't shipped.
// `label` is what it plays, for its accessible name: "Play كِتَاب".
export function PlayButton({ id, part, label }: { id: string; part: Part; label: string }) {
  const s = useSyncExternalStore(subscribe, voiceState);
  const file = clipOf(id, part);
  if (!file) return null;
  const key = `${id}:${part}`, playing = s.playing === key, loading = s.loading === key;
  return <span className="inline-flex items-center gap-2 flex-none">
    <button type="button" data-action="ar-play" data-ar-clip={key} data-state={playing ? 'playing' : loading ? 'loading' : s.failed === key ? 'failed' : 'idle'}
      aria-label={playing || loading ? `Stop ${label}` : `Play ${label}`} onClick={() => playOrStop(key, file)}
      className="grid place-items-center size-11 rounded-btn border border-outline bg-surface hover:bg-surface-2 text-primary cursor-pointer">
      {playing ? <Square size={15} fill="currentColor" aria-hidden="true" /> : loading ? <LoaderCircle size={19} className="animate-spin" aria-hidden="true" /> : <Volume2 size={20} aria-hidden="true" />}
    </button>
    {s.failed === key && <span role="status" className="text-sm text-fg-2">Couldn’t play it. The first time, it needs a connection.</span>}
  </span>;
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
