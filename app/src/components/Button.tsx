import type { ButtonHTMLAttributes } from 'react';

// Every button in MyDay. Styles match the current MyDay's buttons.
//   tonal    – the everyday button (soft green-grey)
//   primary  – the one main action on a card
//   ghost    – a quieter, outlined choice
//   selected – a toggle that's switched on (e.g. "Rolling to tomorrow")
type Variant = 'tonal' | 'primary' | 'ghost' | 'selected';

// inline-flex + gap lines up an icon placed before the label, e.g. <Button><FolderOpen size={18} /> Open</Button>
const BASE =
  'inline-flex items-center justify-center gap-2 border rounded-btn text-center cursor-pointer transition-[background-color,box-shadow,transform] duration-150 ' +
  'enabled:active:scale-[.985] enabled:hover:shadow-raised disabled:opacity-40 disabled:cursor-default';

const VARIANT: Record<Variant, string> = {
  tonal: 'bg-tonal text-on-tonal border-transparent font-[550]',
  primary: 'bg-primary text-on-primary border-transparent font-[650] shadow-raised',
  ghost: 'bg-transparent text-fg-2 border-outline font-[550] enabled:hover:bg-surface-2',
  selected: 'bg-primary-container text-on-primary-container border-primary-outline font-[550]',
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
