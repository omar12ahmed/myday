import type { ReactNode } from 'react';
export function Lines({ items }: { items: string[] }) {
  return <ul className="list-disc pl-5 space-y-2 text-[15px]">{items.map((x, i) => <li key={i}>{x}</li>)}</ul>;
}
export function LinkButton({ to, primary = false, children }: { to: string; primary?: boolean; children: ReactNode }) {
  return <a href={'#' + to} className={`inline-flex items-center justify-center text-center no-underline w-full min-h-tap px-5 py-3 rounded-btn font-semibold ${primary ? 'bg-primary text-on-primary shadow-cta' : 'bg-tonal text-on-tonal'}`}>{children}</a>;
}
