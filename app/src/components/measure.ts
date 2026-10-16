import { useLayoutEffect, useState } from 'react';

// Drawings that keep their words at reading size (Your map, Connections) are drawn at the real width of the space
// they're in, and measure their names in the app's own font, so a name is shortened only when it would touch another.

export const FONT = (weight: number, size: number) => `${weight} ${size}px "Plus Jakarta Sans Variable", system-ui, sans-serif`;

let pen: CanvasRenderingContext2D | null | undefined;
export function textWidth(s: string, font: string) {
  if (pen === undefined) pen = document.createElement('canvas').getContext('2d');
  if (!pen) return s.length * 7.6;
  pen.font = font;
  return pen.measureText(s).width;
}
// The text, shortened with "…" until it fits `max` pixels.
export function fitText(s: string, max: number, font: string) {
  if (textWidth(s, font) <= max) return s;
  let t = s;
  while (t.length > 1 && textWidth(t.trimEnd() + '…', font) > max) t = t.slice(0, -1);
  return t.trimEnd() + '…';
}

// The width of an element, measured before it's painted (and again whenever it changes). Use: const [ref, w] = useWidth();
// <div ref={ref}> … (w is 0 until measured).
export function useWidth() {
  const [el, setEl] = useState<HTMLElement | null>(null);
  const [w, setW] = useState(0);
  useLayoutEffect(() => {
    if (!el) return;
    const measure = () => setW(el.clientWidth);
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [el]);
  return [setEl, w] as const;
}
