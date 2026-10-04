import type { ButtonHTMLAttributes } from 'react';

// Every button in MyDay.
//   tonal    – the everyday button (soft peach)
//   primary  – the one main action on a card: a warm gradient with a soft glow beneath it
//   ghost    – a quieter, outlined choice
//   quiet    – the smallest voice: the tools at the bottom of every screen
//   selected – a toggle that's switched on (e.g. "Rolling to tomorrow")
// Each one answers your touch: a gentle lift on hover and a small press when tapped (still when animations are off).
type Variant = 'tonal' | 'primary' | 'ghost' | 'quiet' | 'selected';

// inline-flex + gap lines up an icon placed before the label, e.g. <Button><FolderOpen size={18} /> Open</Button>
const BASE =
  'inline-flex items-center justify-center gap-2 border rounded-btn text-center cursor-pointer transition-[background-color,box-shadow,transform,translate,filter,color] duration-150 ease-out ' +
  'enabled:active:scale-[.98] disabled:opacity-40 disabled:cursor-default';

const VARIANT: Record<Variant, string> = {
  tonal: 'bg-tonal text-on-tonal border-transparent font-[600] enabled:hover:shadow-raised enabled:hover:brightness-[.98]',
  primary: 'bg-primary bg-linear-to-b from-primary to-primary-2 text-on-primary border-transparent font-[650] shadow-cta enabled:hover:brightness-[1.05] enabled:hover:-translate-y-px enabled:active:translate-y-0',
  ghost: 'bg-transparent text-fg-2 border-outline font-[600] enabled:hover:bg-surface-2 enabled:hover:text-fg',
  quiet: 'bg-surface/60 text-fg-2 border-outline font-[550] backdrop-blur-sm enabled:hover:bg-surface enabled:hover:text-fg enabled:hover:shadow-raised',
  selected: 'bg-primary-container text-on-primary-container border-primary-outline font-[600]',
};

const FULL_WIDTH = 'w-full min-h-tap px-5 py-3';
const INLINE = 'w-auto min-h-11 px-4 py-2 text-[15px]';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  inline?: boolean; // smaller, and only as wide as its label
}

export function Button({ variant = 'tonal', inline = false, type = 'button', className = '', ...rest }: ButtonProps) {
  // className is for spacing around the button (e.g. "mt-3"); its look belongs in the styles above.
  return <button type={type} data-variant={variant} className={`${BASE} ${VARIANT[variant]} ${inline ? INLINE : FULL_WIDTH} ${className}`} {...rest} />;
}
