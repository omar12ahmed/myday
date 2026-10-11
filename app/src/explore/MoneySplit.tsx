// Where one customer payment goes: streams sized to each amount, recalculated whenever an assumption changes.
// The drawing is decorative; the list beside it carries the same figures as text.
export function MoneySplit({ total, merchant, platform, courier, money }: { total: number; merchant: number; platform: number; courier: number; money: (n: number) => string }) {
  const parts = [
    { key: 'merchant', label: 'Merchant receives', note: 'merchandise, less commission', value: merchant },
    { key: 'platform', label: 'Platform commission', note: 'the marketplace’s revenue', value: platform },
    { key: 'courier', label: 'Courier', note: 'delivery, passed through at cost', value: courier },
  ];
  const height = 200, gap = 44, top = 10, sx = 14, dx = 610;
  let source = top, target = top;
  const streams = parts.map(part => {
    const h = total > 0 ? height * part.value / total : 0;
    const s0 = source, d0 = target;
    source += h; target += h + gap;
    const mid = (sx + dx) / 2;
    return { ...part, h, d0, path: `M${sx} ${s0} C${mid} ${s0},${mid} ${d0},${dx} ${d0} L${dx} ${d0 + h} C${mid} ${d0 + h},${mid} ${s0 + h},${sx} ${s0 + h} Z`, line: `M${sx} ${s0 + h / 2} C${mid} ${s0 + h / 2},${mid} ${d0 + h / 2},${dx} ${d0 + h / 2}` };
  });
  const span = top + height + gap * (parts.length - 1) + top;
  // Labels sit beside their stream, nudged apart when two small amounts would overlap.
  const room = span * 78 / 300, centres = streams.map(s => s.d0 + s.h / 2);
  const last = centres.length - 1;
  for (let i = 1; i <= last; i++) centres[i] = Math.max(centres[i], centres[i - 1] + room); // push down
  centres[last] = Math.min(centres[last], span - room / 2);                                    // stay inside
  for (let i = last - 1; i >= 0; i--) centres[i] = Math.min(centres[i], centres[i + 1] - room); // pull up
  return <figure className="ex-money-split" data-money-split="">
    <div className="ex-split-drawing">
      <svg viewBox={`0 0 640 ${span}`} preserveAspectRatio="none" aria-hidden="true">
        <rect className="ex-split-source" data-split-source="" x="0" y={top} width={sx} height={height} />
        {streams.map(s => s.h > 0 && <g key={s.key} className={`ex-split-${s.key}`}>
          <path className="ex-split-stream" d={s.path} data-split-stream="" />
          <path className="ex-split-pulse" d={s.line} data-split-pulse="" />
          <rect className="ex-split-target" x={dx} y={s.d0} width="30" height={s.h} data-split-target="" />
        </g>)}
      </svg>
      <ul className="ex-split-labels">{streams.map((s, i) => <li key={s.key} className={`ex-split-${s.key}`} style={{ top: `${centres[i] / span * 100}%` }} data-split-label=""><span className="ex-mono">{s.label}</span><strong>{money(s.value)}</strong><small>{s.note}</small></li>)}</ul>
    </div>
    <figcaption><span className="ex-mono">Customer pays</span> {money(total)}. Every dollar has one destination; widths are to scale.</figcaption>
  </figure>;
}
