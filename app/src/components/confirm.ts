import { createContext, useContext, type ReactNode } from 'react';

// The question asked by useConfirm() (shown by ConfirmProvider in Dialog.tsx).
export interface ConfirmOptions {
  title: string;
  body?: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
}
export type Ask = (o: ConfirmOptions) => Promise<boolean>;

export const ConfirmContext = createContext<Ask>(() => Promise.resolve(false));

// const confirm = useConfirm();  if (await confirm({ title: 'Remove it?', confirmLabel: 'Remove' })) { … }
export const useConfirm = () => useContext(ConfirmContext);
