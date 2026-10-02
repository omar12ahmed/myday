import { useState } from 'react';
import { shortDate } from '../data/dates';
import type { Series } from '../data/workout/history';
import { n1 } from '../data/workout/common';

// A small line chart for one measure, drawn to scale, with its unit. Each point shows its value on
// hover, focus (keyboard) or tap. Ported from the current MyDay.
export function Chart({ series }: { series: Series }) {
  const [tip, setTip] = useState<number | null>(null);
  const W = 320, H = 150, L = 40, R = 12, T = 14, B = 26;
  const p = series.points, vs = p.map(x => x.v);
  let lo = Math.min(...vs), hi = Math.max(...vs);
  if (lo === hi) { lo = lo - 1; hi = hi + 1; }
  const pad = (hi - lo) * 0.1; lo = Math.max(0, Math.floor(lo - pad)); hi = Math.ceil(hi + pad); // whole-number axis ends
  const x = (i: number) => L + (p.length === 1 ? 0 : (i * (W - L - R)) / (p.length - 1));
  const y = (v: number) => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
  const label = (i: number) => `${shortDate(p[i].date)}: ${n1(p[i].v)} ${series.unit}`;
  const last = p[p.length - 1];
  return (
    <figure className="chart my-3 mx-0">
      <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" className="w-full h-auto block overflow-visible"
        aria-label={`${series.label}: ${p.map(pt => `${shortDate(pt.date)} ${n1(pt.v)} ${series.unit}`).join(', ')}`}>
        <line className="ch-grid stroke-outline" strokeWidth="1" x1={L} x2={W - R} y1={y(hi)} y2={y(hi)} />
        <line className="ch-grid stroke-outline" strokeWidth="1" x1={L} x2={W - R} y1={y(lo)} y2={y(lo)} />
        <text className="ch-axis fill-fg-3 text-[10px] tabular-nums" x={L - 6} y={y(hi) + 4} textAnchor="end">{n1(Math.round(hi * 10) / 10)}</text>
        <text className="ch-axis fill-fg-3 text-[10px] tabular-nums" x={L - 6} y={y(lo) + 4} textAnchor="end">{n1(Math.round(lo * 10) / 10)}</text>
        <text className="ch-axis fill-fg-3 text-[10px]" x={L} y={H - 6}>{shortDate(p[0].date)}</text>
        <text className="ch-axis fill-fg-3 text-[10px]" x={W - R} y={H - 6} textAnchor="end">{shortDate(last.date)}</text>
        <polyline className="ch-line fill-none stroke-primary" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" points={p.map((pt, i) => `${x(i).toFixed(1)},${y(pt.v).toFixed(1)}`).join(' ')} />
        {p.map((pt, i) => (
          <g key={i} className="ch-pt cursor-pointer outline-none group/pt" tabIndex={0} data-tip={label(i)}
            onFocus={() => setTip(i)} onBlur={() => setTip(null)} onMouseEnter={() => setTip(i)} onMouseLeave={() => setTip(null)} onClick={() => setTip(i)}>
            <circle className="ch-hit fill-transparent" cx={x(i)} cy={y(pt.v)} r="14" />
            <circle className="ch-dot fill-primary stroke-surface group-focus-visible/pt:stroke-fg" strokeWidth="2" cx={x(i)} cy={y(pt.v)} r="4.5" />
          </g>
        ))}
      </svg>
      {tip !== null && (
        <div className="ch-tip show absolute -translate-x-1/2 -translate-y-[calc(100%+10px)] bg-inverse text-on-inverse text-[13px] px-2 py-1 rounded-lg pointer-events-none whitespace-nowrap"
          aria-hidden="true" style={{ left: `${(x(tip) / W) * 100}%`, top: `${(y(p[tip].v) / H) * 100}%` }}>{label(tip)}</div>
      )}
      </div>
      <figcaption className="text-[15px] text-fg-2">{series.label} ({series.unit}){series.lowerIsBetter ? ' — lower means less help needed' : ''}. Latest: {n1(last.v)} {series.unit}.</figcaption>
    </figure>
  );
}
