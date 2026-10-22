import { Moon, Sun, SunMoon } from 'lucide-react';
import { flushSync } from 'react-dom';
import { toast } from '../data/toast';
import type { Theme } from '../data/types';

const ORDER: Theme[] = ['light', 'dark', 'auto'];
const LABEL: Record<Theme, string> = { dark: 'Dark', light: 'Light', auto: 'Match device' };
const ICON = { dark: Moon, light: Sun, auto: SunMoon };

// The round button in the header: Light → Dark → Match device → Light…
export function ThemeButton({ theme, motionAllowed, onChange }: { theme: Theme; motionAllowed: boolean; onChange: (t: Theme) => void }) {
  const Icon = ICON[theme];
  const label = `Theme: ${LABEL[theme]}. Tap to change.`;
  function next() {
    const t = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length];
    // A soft cross-fade where the browser supports it (and animations are on).
    if (motionAllowed && document.startViewTransition) {
      const transition = document.startViewTransition(() => flushSync(() => onChange(t)));
      // A newer transition may skip this animation; the theme update still runs.
      void transition.ready.catch(() => {});
    }
    else onChange(t);
    toast(`Theme: ${LABEL[t]}`);
  }
  return (
    <button type="button" id="themeBtn" data-action="theme" aria-label={label} title={label} onClick={next}
      className="flex-none size-11 rounded-[10px] grid place-items-center bg-transparent text-fg-2 border border-outline cursor-pointer hover:bg-surface">
      <Icon size={22} aria-hidden="true" />
    </button>
  );
}
