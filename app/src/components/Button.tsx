import type { ButtonHTMLAttributes } from 'react';

// Every button in MyDay.
//   tonal    – the everyday button (neutral, quiet)
//   primary  – the main action, in the established teal
//   ghost    – a quieter, outlined choice
//   quiet    – the smallest voice: the tools at the bottom of every screen
//   selected – a toggle that's switched on (e.g. "Rolling to tomorrow")
// A small press confirms touch; focus remains visible when motion is off.
type Variant = 'tonal' | 'primary' | 'ghost' | 'quiet' | 'selected';

// inline-flex + gap lines up an icon placed before the label, e.g. <Button><FolderOpen size={18} /> Open</Button>
const BASE =
  'inline-flex items-center justify-center gap-2 border rounded-btn text-center cursor-pointer transition-[background-color,box-shadow,transform,translate,filter,color] duration-150 ease-out ' +
  'enabled:active:scale-[.98] disabled:cursor-default';

const VARIANT: Record<Variant, string> = {
  tonal: 'bg-tonal text-on-tonal border-transparent font-[550] enabled:hover:brightness-[.98]',
  primary: 'bg-[var(--action)] text-[var(--on-action)] border-transparent font-[600] enabled:hover:brightness-[1.08]',
  ghost: 'bg-transparent text-fg-2 border-outline font-[600] enabled:hover:bg-surface-2 enabled:hover:text-fg',
  quiet: 'bg-transparent text-fg-2 border-transparent font-[550] enabled:hover:bg-surface-2 enabled:hover:text-fg',
  selected: 'bg-tonal text-fg border-outline-strong font-[600]',
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
