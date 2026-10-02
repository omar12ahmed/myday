// The name box to put the cursor in once it's on screen: an item just added to the roadmap, or a
// concept just made with "+ New".
let pending: string | null = null;
export const focusSoon = (id: string) => { pending = id; };
// Use as an input's ref: puts the cursor in the box (text selected, ready to type over) if it's the one waiting.
export const focusIfWaiting = (id: string) => (el: HTMLInputElement | null) => {
  if (el && pending === id) { pending = null; el.focus(); el.select(); }
};
