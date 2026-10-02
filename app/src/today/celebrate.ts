// A soft, short burst of colour when the whole day's plan is done. Ported from the current MyDay.
// Skipped entirely when animations are off (in Settings or on the device).
export function celebrate(motionAllowed: boolean) {
  if (!motionAllowed) return;
  const card = document.querySelector('#slot-plan') || document.querySelector('main .card');
  if (!card) return;
  const r = card.getBoundingClientRect();
  const layer = document.createElement('div');
  layer.className = 'burst';
  layer.setAttribute('aria-hidden', 'true');
  layer.style.left = r.left + r.width / 2 + 'px';
  layer.style.top = Math.min(window.innerHeight - 80, Math.max(90, r.top + 70)) + 'px';
  const colours = ['--learning', '--admin', '--health', '--rest', '--primary', '--appt'];
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2 + Math.random() * 0.3, dist = 70 + Math.random() * 60;
    const dot = document.createElement('span');
    dot.style.setProperty('--dx', (Math.cos(a) * dist).toFixed(1) + 'px');
    dot.style.setProperty('--dy', (Math.sin(a) * dist).toFixed(1) + 'px');
    dot.style.background = `var(${colours[i % colours.length]})`;
    dot.style.animationDelay = Math.round(Math.random() * 80) + 'ms';
    layer.appendChild(dot);
  }
  document.body.appendChild(layer);
  setTimeout(() => layer.remove(), 1600);
}
