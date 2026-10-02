// Short messages at the bottom of the screen ("Saved.", "Your day is ready."), from anywhere in the app.
type Listener = (message: string) => void;
const listeners = new Set<Listener>();

export function toast(message: string) {
  for (const fn of listeners) fn(message);
}

export function onToast(fn: Listener): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}
