import { useContext, useMemo, useState, type ReactNode } from 'react';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { ExternalLink } from '../parts';
import { PronunciationContext } from './pronunciationContext';
import { transliterate } from './transliterate';

export const TRANSLITERATION_KEY = 'myday.arabic.transliteration';
function initialPreference() { try { return localStorage.getItem(TRANSLITERATION_KEY) !== 'hidden'; } catch { return true; } }

export function Pronunciation({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(initialPreference);
  const context = useMemo(() => ({ enabled, read: transliterate, toggle: () => setEnabled(previous => {
    const next = !previous;
    try { localStorage.setItem(TRANSLITERATION_KEY, next ? 'shown' : 'hidden'); } catch { /* Works for this visit if storage is unavailable. */ }
    return next;
  }) }), [enabled]);
  return <PronunciationContext.Provider value={context}>{children}</PronunciationContext.Provider>;
}

export function PronunciationControls() {
  const { enabled, toggle } = useContext(PronunciationContext);
  return <Card aria-label="Arabic pronunciation help" data-ar-pronunciation="">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h3 className="m-0">Pronunciation help</h3>
      <Button inline variant="tonal" aria-pressed={enabled} data-action="ar-transliteration" onClick={toggle}>{enabled ? 'Hide transliteration' : 'Show transliteration'}</Button>
    </div>
    <p className="text-sm text-fg-2 mb-0">Read the Latin letters alongside Arabic. Hide them when practising recall. Your choice is remembered on this device.</p>
    <details className="mt-2" data-ar-pronunciation-key=""><summary className="cursor-pointer min-h-11 py-2 text-primary">How to read the pronunciation guide</summary>
      <p className="text-sm">This is a word-by-word aid to fuṣḥā. Follow the linked recordings for natural phrasing and connected speech.</p>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="font-semibold" dir="ltr">a · i · u</dt><dd>Short vowels. <span dir="ltr">ā · ī · ū</span> are their longer counterparts.</dd>
        <dt className="font-semibold" dir="ltr">th · dh · sh</dt><dd>As in English “think”, “this” and “ship”. Each pair of letters represents one Arabic sound.</dd>
        <dt className="font-semibold" dir="ltr">kh · gh</dt><dd>Sounds made near the back of the mouth; gh uses the voice. Compare the alphabet recordings.</dd>
        <dt className="font-semibold" dir="ltr">ḥ · ʿ · ʾ</dt><dd>Ḥāʾ, ʿayn and hamza. These are distinct sounds; ʿ is not an English vowel. Initial hamza is usually left unwritten in this guide.</dd>
        <dt className="font-semibold" dir="ltr">ṣ · ḍ · ṭ · ẓ · q</dt><dd>The emphatic consonants and qāf. Keep them distinct from s, d, t, dh and k.</dd>
        <dt className="font-semibold" dir="ltr">bb · ll · rr</dt><dd>A doubled consonant (shadda): hold the consonant longer. It is not an extra vowel.</dd>
        <dt className="font-semibold" dir="ltr">al- · ash-</dt><dd>The article retains l with moon letters and assimilates with sun letters: al-qamar, ash-shams.</dd>
        <dt className="font-semibold" dir="ltr">-un · -in · -an</dt><dd>Written tanwīn endings. Vowelled examples keep their written endings; pronunciation at a pause may change.</dd>
      </dl>
      <p className="text-sm">An unvowelled word can have several readings. Brackets mark incomplete vowel information rather than a pronunciation to memorise. Use the sentence and its recording.</p>
      <p className="text-sm"><ExternalLink href="https://madinaharabic.com/free-content/reading/lesson-1/part-1">Hear the Arabic alphabet and vowel models</ExternalLink></p>
    </details>
  </Card>;
}
