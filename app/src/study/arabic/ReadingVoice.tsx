import { LoaderCircle, Square, Volume2, VolumeOff } from 'lucide-react';
import { useEffect, useSyncExternalStore } from 'react';
import { Button } from '../../components/Button';
import { Ar, Reading } from './Ar';
import { clipFor, playOrStop, playSequenceOrStop, readingFor, stopVoiceFor, subscribe, voiceLabel, voiceState, wholeClipFor } from './voice';

// Display and audio always use the same prepared sentence positions. Hiding vowel marks changes only the display.
export function ReadingVoice({ id, full, plain, vowels, prepared }: { id: string; full: string; plain: string | null; vowels: boolean; prepared?: string }) {
  const state = useSyncExternalStore(subscribe, voiceState);
  const group = id + ':reading', parts = readingFor(id);
  useEffect(() => () => stopVoiceFor(group), [group]);
  const shown = vowels || !plain ? full : plain;
  const voiced = parts?.some(p => clipFor(p.spoken)) ?? false;
  const complete = !!parts?.length && parts.every(p => clipFor(p.spoken));
  const whole = wholeClipFor(id), wholeKey = group + ':whole';
  const all = state.sequence === group;
  const keyFor = (i: number) => group + ':' + i;
  const failed = state.failed === wholeKey || parts?.some((_, i) => state.failed === keyFor(i));
  // A text the course gives without vowel marks is voiced from MyDay's own vowelled copy (content/teaching/arabic/voice-scripts.json).
  const scripted = parts?.some(p => /[\u064B-\u0652]/.test(p.spoken) && !/[\u064B-\u0652]/.test(p.text)) ?? false;
  return <>
    {(whole || complete) && <Button inline variant="ghost" className="mb-3" data-action="ar-read-all" data-ar-clip={group} data-ar-whole={whole ? 'one clip' : 'sentences'}
      data-state={all ? state.loading ? 'loading' : 'playing' : 'idle'} aria-pressed={all}
      onClick={() => playSequenceOrStop(group, whole ? [{ key: wholeKey, file: whole }] : (parts ?? []).map((p, i) => ({ key: keyFor(i), file: clipFor(p.spoken)! })))}>
      {all ? <Square size={16} aria-hidden="true" /> : <Volume2 size={18} aria-hidden="true" />}
      {all ? 'Stop the whole text' : 'Listen to the whole text'}
    </Button>}
    <div className="rounded-tile bg-surface-2 px-4 py-3" data-ar-reading="">
      {shown.split('\n').map((line, li) => {
        const lineParts = parts?.map((p, i) => ({ ...p, index: i })).filter(p => p.line === li);
        if (!lineParts?.length) return <Ar key={li} block className="text-[24px] my-1" reading={prepared?.split('\n')[li]}>{line}</Ar>;
        return <div key={li}>
          <p lang="ar" dir="rtl" className="ar ar-block text-[24px] my-1">{lineParts.map(p => {
            const file = clipFor(p.spoken), key = keyFor(p.index);
            const playing = state.playing === key, loading = state.loading === key;
            const text = vowels || !plain ? p.text : p.plain;
            return <span key={key}>{file ? <button type="button" data-action="ar-read-sentence" data-ar-sentence={p.index} data-ar-clip={key}
              data-state={playing ? 'playing' : loading ? 'loading' : state.failed === key ? 'failed' : 'idle'}
              aria-label={`${playing || loading ? 'Stop' : 'Play'} sentence ${p.index + 1}: ${text}`} aria-pressed={playing || loading}
              onClick={() => playOrStop(key, file)}
              className={`inline-flex items-center gap-2 max-w-full min-h-11 min-w-11 px-1 py-1 border-0 rounded-btn text-right align-middle cursor-pointer ${playing || loading ? 'bg-primary-container text-fg' : 'bg-transparent text-inherit hover:bg-surface'}`}>
              <span className="min-w-0">{text}</span>
              {playing ? <Square size={15} className="flex-none text-primary" aria-hidden="true" /> : loading ? <LoaderCircle size={18} className="flex-none text-primary animate-spin" aria-hidden="true" /> : <Volume2 size={17} className="flex-none text-primary" aria-hidden="true" />}
            </button> : <span>{text}</span>}{' '}</span>;
          })}</p>
          <Reading text={line} block prepared={prepared?.split('\n')[li]} />
        </div>;
      })}
    </div>
    {failed && <p role="status" className="text-sm text-fg-2">Couldn’t play it. The first time, it needs a connection.</p>}
    {voiced ? <p className="text-xs text-fg-2 mt-2" data-ar-voice-label="">{voiceLabel}{scripted && <span data-ar-voice-script=""> It reads MyDay’s vowelled copy of this text; the page keeps the course’s spelling without marks.</span>} Tap a sentence to hear it. Slower playback: Study → Arabic → Vocabulary.</p>
      : <p className="text-sm text-fg-2 flex gap-2 items-start mb-0"><VolumeOff size={18} className="flex-none mt-0.5" aria-hidden="true" />No recording included. Read it aloud yourself, or ask a fluent speaker to.</p>}
  </>;
}
