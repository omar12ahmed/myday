// Moving around the lesson journey: to a step's section, or to one small thing in it, with keyboard focus going
// along (a heading or a box gets focus quietly, without scrolling twice).
export const visible = (el: Element) => el.getClientRects().length > 0;
export function focusQuietly(el: HTMLElement) {
  if (!el.matches('textarea, button, input, select, a[href]')) el.tabIndex = -1;
  el.focus({ preventScroll: true });
}
// To a step's section, its heading taking focus. Waits a frame so a section that has just appeared is there.
export function toStep(step: string, focus = true) {
  requestAnimationFrame(() => {
    const el = document.getElementById('ar-step-' + step);
    if (!el) return;
    el.scrollIntoView({ block: 'start' });
    const heading = el.querySelector<HTMLElement>('h3');
    if (focus && heading) focusQuietly(heading);
  });
}
