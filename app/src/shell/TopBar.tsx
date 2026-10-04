import { Focus } from 'lucide-react';
import type { ReactNode } from 'react';
import type { MyDayData } from '../data/types';
import type { View } from '../sync/engine';
import { setFocusMode, useFocusMode } from './focusMode';

// The top bar's right side (besides the theme button): Focus mode (on Today) and your account. On wide screens the
// bar is a white card above the page, like the cards below it; + Capture sits just left of the theme button. On phones
// the Focus mode switch is a round icon button, like the theme button (green when it's on), so the date fits on one line.
export function FocusSwitch() {
  const on = useFocusMode();
  return (
    <button type="button" role="switch" aria-checked={on} data-action="focus-mode" onClick={() => setFocusMode(!on)}
      className={`focus-switch inline-flex items-center justify-center gap-2 min-h-11 min-w-11 rounded-full sm:pl-2.5 sm:pr-1.5 border cursor-pointer text-[14px] font-semibold transition-colors ${on ? 'bg-done-c text-on-done-c border-transparent' : 'bg-surface-2 text-fg-2 border-outline'}`}>
      <Focus size={18} aria-hidden="true" />
      <span className="max-sm:sr-only">Focus mode</span>
      <span aria-hidden="true" className={`max-sm:hidden relative w-10 h-6 rounded-full transition-colors ${on ? 'bg-done' : 'bg-track'}`}>
        <span className={`absolute top-0.5 size-5 rounded-full bg-surface shadow-raised transition-[left] ${on ? 'left-[18px]' : 'left-0.5'}`} />
      </span>
    </button>
  );
}

// Your account: your initials (from your name, or your email) and, on wide screens, your name and email. Opens Your
// account. Only when sync is set up and you're signed in.
export function AccountChip({ data, sync }: { data: MyDayData; sync: View }) {
  if (!sync.account) return null;
  const email = sync.account.email, name = data.patterns.prefs.name;
  const initials = (name ? name.split(/\s+/).map(w => w[0]).join('') : email[0] || '?').slice(0, 2).toUpperCase();
  return (
    <a href="#sync" id="accountChip" className="inline-flex items-center gap-2.5 min-h-11 rounded-full no-underline text-fg pr-1 lg:pr-3" aria-label={`Your account: ${email}`}>
      <span aria-hidden="true" className="grid place-items-center size-11 rounded-full bg-primary-container text-on-primary-container font-bold text-[15px]">{initials}</span>
      <span className="hidden xl:grid leading-tight text-left">
        <span className="text-[14px] font-semibold">{name || email.split('@')[0]}</span>
        <span className="text-[12px] text-fg-3">{email}</span>
      </span>
    </a>
  );
}

// Keeps room for + Capture beside the theme button on wide screens (Capture itself is placed by index.css).
export const CaptureRoom = (): ReactNode => <span aria-hidden="true" className="hidden lg:block w-12 flex-none" />;
