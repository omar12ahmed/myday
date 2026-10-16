import { useMemo, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { FONT, fitText, textWidth, useWidth } from '../components/measure';
import { InlineLink, TextLink } from '../components/parts';
import { GRAPH_LABEL_MAX, knowledgeGraph, neighbours, nodeNote, nodeProject, noteKey, packGraph, projectKey, type KnowledgeGraph, type PlacedNode } from '../data/graph';
import { noteName } from '../data/notes';
import { projectById, projectNotes, stageOf, STATUS_LABEL } from '../data/projects';
import { update } from '../data/storage';
import { toast } from '../data/toast';
import type { MyDayData } from '../data/types';
import { bothMention, keepLink, mightBelong, relatedNotes, unlink } from '../data/understand';

// Connections (milestone 4, #projects/connections): the knowledge graph — how your notes and projects connect, drawn
// by itself from the links that are already there (data/graph.ts). Tap a dot to see what it connects to and why; links
// MyDay made can be kept or undone here, as under "MyDay connected these". Nothing here is arranged by hand, and
// nothing is saved by looking. Drawn at the real width of the screen, so names stay at reading size on a phone too;
// "What goes together" below says the same in words.

const R = { project: 12, note: 7 };
const C = { primary: 'var(--primary)', primaryC: 'var(--primary-container)', surface: 'var(--surface)', ink: 'var(--text)', ink2: 'var(--text-2)', line: 'var(--outline-strong)', learn: 'var(--learning)' };
const EDGE_STYLE = {
  in: { stroke: C.line, strokeWidth: 1.6 },
  myday: { stroke: C.primary, strokeWidth: 1.6, strokeDasharray: '5 4' },
  related: { stroke: C.learn, strokeWidth: 1.6, strokeDasharray: '1 5', strokeLinecap: 'round' as const },
};

type Label = { text: string; x: number; y: number; anchor: 'start' | 'end' | 'middle'; font: string };
type Rect = { x: number; y: number; w: number; h: number };
const overlaps = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

// Names go where they fit — right of the dot, left, below, above, then the corners — and never on top of another name
// or dot (a name too long for any spot tries again shorter). Projects are named first, then the best-connected notes;
// with a dot chosen, it and its neighbours come first, and only they (and the projects) are named.
function placeLabels(nodes: PlacedNode[], w: number, h: number, sel: string | null, near: Map<string, unknown> | null): Map<string, Label> {
  const dots: (Rect & { key: string })[] = nodes.map(n => { const r = R[n.kind] + 3; return { key: n.key, x: n.gx - r, y: n.gy - r, w: 2 * r, h: 2 * r }; });
  const rank = (n: PlacedNode) => (n.key === sel ? 0 : near?.has(n.key) ? 1 : n.kind === 'project' ? 2 : 3);
  const order = [...nodes].filter(n => !sel || rank(n) < 3).sort((a, b) => rank(a) - rank(b) || b.degree - a.degree || a.key.localeCompare(b.key));
  const taken: Rect[] = [], out = new Map<string, Label>();
  const inside = (x: number, tw: number) => Math.min(Math.max(x, 1), w - 1 - tw);
  for (const n of order) {
    const font = n.kind === 'project' ? FONT(700, 14) : FONT(500, 13), th = n.kind === 'project' ? 18 : 17, r = R[n.kind] + 5;
    for (const max of [GRAPH_LABEL_MAX[n.kind], 110]) {
      const text = fitText(n.label, max, font), tw = textWidth(text, font);
      const below = n.gy + r - 2, above = n.gy - r + 2 - th, mid = n.gy - th / 2;
      const tries: (Rect & { anchor: Label['anchor']; tx: number })[] = [
        { x: n.gx + r, y: mid, w: tw, h: th, anchor: 'start', tx: n.gx + r },
        { x: n.gx - r - tw, y: mid, w: tw, h: th, anchor: 'end', tx: n.gx - r },
        ...[below, above].flatMap(y => [
          { x: inside(n.gx - tw / 2, tw), y, w: tw, h: th, anchor: 'start' as const, tx: inside(n.gx - tw / 2, tw) },
          { x: n.gx - 4, y, w: tw, h: th, anchor: 'start' as const, tx: n.gx - 4 },
          { x: n.gx + 4 - tw, y, w: tw, h: th, anchor: 'start' as const, tx: n.gx + 4 - tw },
        ]),
      ];
      const ok = tries.find(t => t.x >= 1 && t.x + t.w <= w - 1 && t.y >= 0 && t.y + t.h <= h && !taken.some(x => overlaps(t, x)) && !dots.some(d => d.key !== n.key && overlaps(t, d)));
      if (!ok) continue;
      taken.push(ok);
      out.set(n.key, { text, x: ok.tx, y: ok.y + th / 2, anchor: ok.anchor, font });
      break;
    }
  }
  return out;
}

function Drawing({ g, nodes, width, height, sel, onSelect }: { g: KnowledgeGraph; nodes: PlacedNode[]; width: number; height: number; sel: string | null; onSelect: (key: string | null) => void }) {
  const at = useMemo(() => new Map(nodes.map(n => [n.key, n])), [nodes]);
  const near = useMemo(() => (sel ? neighbours(g, sel) : null), [g, sel]);
  const labels = useMemo(() => placeLabels(nodes, width, height, sel, near), [nodes, width, height, sel, near]);
  const lit = (key: string) => !sel || key === sel || !!near?.has(key);
  const press = (e: KeyboardEvent, key: string) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(key === sel ? null : key); } };
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="block max-w-full h-auto" role="group" aria-label="How your notes and projects connect"
      onKeyDown={e => { if (e.key === 'Escape') onSelect(null); }}>
      <rect width={width} height={height} fill="transparent" onClick={() => onSelect(null)} />
      {g.edges.map(e => {
        const a = at.get(e.a), b = at.get(e.b);
        if (!a || !b) return null;
        const on = !sel || e.a === sel || e.b === sel;
        return <line key={e.a + e.b} data-s="kg-edge" data-kind={e.kind} x1={a.gx} y1={a.gy} x2={b.gx} y2={b.gy} style={{ ...EDGE_STYLE[e.kind], opacity: on ? 1 : 0.18 }} />;
      })}
      {nodes.map(n => {
        const project = n.kind === 'project' ? n.status ?? 'active' : null, r = R[n.kind], chosen = n.key === sel;
        const lab = labels.get(n.key);
        return (
          <g key={n.key} className="kg-node cursor-pointer" role="button" tabIndex={0} aria-pressed={chosen} data-s="kg-node" data-kind={n.kind} data-id={n.id}
            aria-label={`${n.kind === 'project' ? 'Project' : 'Note'}: ${n.label} — ${n.degree} connection${n.degree === 1 ? '' : 's'}`}
            onClick={() => onSelect(chosen ? null : n.key)} onKeyDown={e => press(e, n.key)}>
            <title>{n.label}</title>
            <circle cx={n.gx} cy={n.gy} r={Math.max(r + 8, 15)} fill="transparent" />
            <circle className="kg-focus" cx={n.gx} cy={n.gy} r={r + 6} fill="none" strokeWidth="2.5" style={{ stroke: chosen ? C.primary : 'transparent' }} />
            <g style={{ opacity: lit(n.key) ? 1 : 0.3 }}>
              {n.kind === 'project'
                ? <circle cx={n.gx} cy={n.gy} r={r} strokeWidth={project === 'active' ? 3 : 2.5} style={project === 'active' ? { fill: C.primary, stroke: C.surface } : project === 'paused' ? { fill: C.primaryC, stroke: C.primary } : { fill: C.surface, stroke: C.primary }} />
                : <circle cx={n.gx} cy={n.gy} r={r} strokeWidth="2" style={{ fill: C.surface, stroke: C.ink2 }} />}
            </g>
            {lab && <text x={lab.x} y={lab.y} textAnchor={lab.anchor} dominantBaseline="central" className="kg-label"
              style={{ font: lab.font, fill: n.kind === 'project' ? C.ink : C.ink2 }}>{lab.text}</text>}
          </g>
        );
      })}
    </svg>
  );
}

// Shows a note or project in the panel when it's drawn; otherwise a link that opens it.
function Pick({ k, drawn, href, onSelect, children }: { k: string; drawn: boolean; href: string; onSelect: (key: string) => void; children: ReactNode }) {
  return drawn
    ? <button type="button" className="text-primary font-semibold underline-offset-2 hover:underline text-left p-0 bg-transparent border-0 cursor-pointer min-h-6" data-action="kg-pick" data-key={k} onClick={() => onSelect(k)}>{children}</button>
    : <InlineLink href={href}>{children}</InlineLink>;
}

function Details({ data, sel, drawn, onSelect }: { data: MyDayData; sel: string; drawn: Set<string>; onSelect: (key: string | null) => void }) {
  const kind = sel.startsWith('p:') ? 'project' : 'note', id = sel.slice(2);
  const pick = (k: string, href: string, children: ReactNode) => <Pick k={k} drawn={drawn.has(k)} href={href} onSelect={onSelect}>{children}</Pick>;
  const h4 = 'text-[13px] font-bold text-fg-2 mt-3 mb-1';
  if (kind === 'note') {
    const n = nodeNote(data, { kind, id });
    if (!n) return null;
    const p = projectById(data, n.projectId), rel = relatedNotes(data, n, 5);
    return (
      <div id="kg-panel" className="scroll-mt-24" data-kind="note" data-id={n.id}>
        <p className="text-xs font-semibold text-fg-3 m-0">Note{n.private ? ' · private — never sent to AI help' : ''}</p>
        <h3 className="mt-0.5 mb-1 text-[17px]">{noteName(n)}</h3>
        {p ? <p className="text-[15px] m-0" id="kg-where">In {pick(projectKey(p.id), `#projects/p/${p.id}`, p.title)}{n.linkedBy ? <> — MyDay put it there: {bothMention(n.linkWhy ?? '')}.</> : '.'}</p>
          : <p className="text-[15px] m-0" id="kg-where">Not in a project yet.</p>}
        {p && n.linkedBy && <div className="flex flex-wrap gap-2 mt-2">
          <Button inline variant="tonal" data-action="kg-keep" onClick={() => { if (update(d => (keepLink(d, n.id) ? undefined : false))) toast('Kept.'); }}>Keep it there</Button>
          <Button inline variant="ghost" data-action="kg-undo" onClick={() => { if (update(d => (unlink(d, n.id) ? undefined : false))) toast('Taken out — MyDay won\'t put it back in that project.'); }}>Undo</Button>
        </div>}
        {rel.length > 0 && <>
          <h4 className={h4}>Related notes</h4>
          <ul className="list-none p-0 m-0 grid gap-1" id="kg-related">
            {rel.map(r => <li key={r.note.id} className="text-[15px]">{pick(noteKey(r.note.id), `#projects/notes/${r.note.id}`, noteName(r.note))} <span className="text-fg-3">— {bothMention(r.why)}</span></li>)}
          </ul>
        </>}
        <TextLink href={`#projects/notes/${n.id}`} data-action="kg-open">Open the note</TextLink>
      </div>
    );
  }
  const p = nodeProject(data, { kind, id });
  if (!p) return null;
  const ns = projectNotes(data, p), mb = mightBelong(data, p, 3);
  return (
    <div id="kg-panel" className="scroll-mt-24" data-kind="project" data-id={p.id}>
      <p className="text-xs font-semibold text-fg-3 m-0">Project · {stageOf(p.stage).label}{p.status !== 'active' ? ` · ${STATUS_LABEL[p.status]}` : ''}</p>
      <h3 className="mt-0.5 mb-1 text-[17px]">{p.title}</h3>
      {ns.length ? <>
        <h4 className={h4}>Its notes ({ns.length})</h4>
        <ul className="list-none p-0 m-0 grid gap-1" id="kg-notes">
          {ns.slice(0, 8).map(n => <li key={n.id} className="text-[15px]">{pick(noteKey(n.id), `#projects/notes/${n.id}`, noteName(n))}{n.linkedBy ? <span className="text-fg-3"> · put here by MyDay</span> : null}</li>)}
        </ul>
        {ns.length > 8 && <p className="text-[13px] text-fg-3 m-0 mt-1">and {ns.length - 8} more — all of them are on the project's page.</p>}
      </> : <p className="text-[15px] text-fg-2 m-0">No notes in it yet.</p>}
      {mb.length > 0 && <>
        <h4 className={h4}>Might belong here</h4>
        <ul className="list-none p-0 m-0 grid gap-1">
          {mb.map(m => <li key={m.note.id} className="text-[15px]">{pick(noteKey(m.note.id), `#projects/notes/${m.note.id}`, noteName(m.note))} <span className="text-fg-3">— {bothMention(m.why)}</span></li>)}
        </ul>
      </>}
      <TextLink href={`#projects/p/${p.id}`} data-action="kg-open">Open the project</TextLink>
    </div>
  );
}

// The key, drawn with the same lines and dots as the drawing.
function Key() {
  const swatch = (body: ReactNode, w = 26) => <svg width={w} height="16" viewBox={`0 0 ${w} 16`} className="flex-none" aria-hidden="true">{body}</svg>;
  const items: { label: string; shape: ReactNode }[] = [
    { label: 'Project', shape: swatch(<circle cx="8" cy="8" r="6.5" style={{ fill: C.primary }} />, 16) },
    { label: 'Note', shape: swatch(<circle cx="8" cy="8" r="5" strokeWidth="2" style={{ fill: C.surface, stroke: C.ink2 }} />, 16) },
    { label: 'In a project', shape: swatch(<line x1="1" y1="8" x2="25" y2="8" style={EDGE_STYLE.in} />) },
    { label: 'Put there by MyDay', shape: swatch(<line x1="1" y1="8" x2="25" y2="8" style={EDGE_STYLE.myday} />) },
    { label: 'Related (shared words)', shape: swatch(<line x1="2" y1="8" x2="25" y2="8" style={EDGE_STYLE.related} />) },
  ];
  return (
    <ul className="list-none p-0 m-0 mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-fg-3 font-semibold" aria-hidden="true" data-s="kg-key">
      {items.map(({ label, shape }) => <li key={label} className="inline-flex items-center gap-1.5">{shape}{label}</li>)}
    </ul>
  );
}

export function ConnectionsView({ data }: { data: MyDayData }) {
  const g = knowledgeGraph(data), [measured, width] = useWidth();
  const [sel, setSel] = useState<string | null>(null);
  const packed = useMemo(() => (width ? packGraph(g, width) : null), [g, width]);
  const drawn = useMemo(() => new Set(g.groups.flatMap(gr => gr.nodes.map(n => n.key))), [g]);
  const chosen = sel && drawn.has(sel) ? sel : null; // a dot that's gone (a link undone, a note deleted) is let go
  // On a phone the details sit below a tall drawing: bring them into view when they'd otherwise be out of sight.
  const choose = (key: string | null) => {
    setSel(key);
    if (!key) return;
    requestAnimationFrame(() => {
      const el = document.getElementById('kg-panel');
      if (!el) return;
      const r = el.getBoundingClientRect();
      const calm = document.documentElement.dataset.motion === 'off' || matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (r.top > innerHeight - 160 || r.bottom < 80) el.scrollIntoView({ block: 'start', behavior: calm ? 'auto' : 'smooth' });
    });
  };
  const count = (kind: string) => g.groups.reduce((a, gr) => a + gr.nodes.filter(n => n.kind === kind).length, 0);
  const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
  return (
    <>
      <Card aria-labelledby="kg-h" className="max-w-[720px] mx-auto">
        <h2 id="kg-h">Connections</h2>
        <p className="text-[15px] text-fg-2 m-0">How your notes and projects connect — drawn by MyDay from what's already there, so there's nothing here to keep tidy. Tap a dot to see what it's connected to, and why.</p>
      </Card>
      {!g.groups.length ? (
        <Card id="kg-empty" className="max-w-[720px] mx-auto">
          <p className="text-[15px] text-fg-2 m-0">Nothing connects yet. As you write notes and start projects, MyDay links the ones that clearly go together, and they'll appear here by themselves. <InlineLink href="#projects/notes">Go to your notes</InlineLink></p>
        </Card>
      ) : (
        <>
          <Card aria-labelledby="kg-draw-h">
            <h3 id="kg-draw-h" className="sr-only">The drawing</h3>
            <div ref={measured} data-s="kg-drawing">
              {packed && width > 0 && <Drawing g={g} nodes={packed.nodes} width={width} height={Math.ceil(packed.height) + 4} sel={chosen} onSelect={choose} />}
            </div>
            <Key />
            <div className="mt-4 pt-3 border-t border-outline" aria-live="polite">
              {chosen ? <Details data={data} sel={chosen} drawn={drawn} onSelect={choose} />
                : <p className="text-[15px] text-fg-2 m-0" id="kg-hint">{plural(count('note'), 'note')} and {plural(count('project'), 'project')} drawn. Tap one to see its connections.</p>}
            </div>
          </Card>
          <Card aria-labelledby="kg-groups-h">
            <h3 id="kg-groups-h">What goes together</h3>
            <ul className="list-none p-0 m-0" id="kg-groups">
              {g.groups.map(gr => {
                const ps = gr.nodes.filter(n => n.kind === 'project'), ns = gr.nodes.filter(n => n.kind === 'note').sort((a, b) => b.degree - a.degree || a.label.localeCompare(b.label));
                const words = !ps.length ? g.edges.find(e => e.kind === 'related' && (e.a === ns[0]?.key || e.b === ns[0]?.key))?.why : '';
                return (
                  <li key={gr.nodes[0].key} className="py-2.5 border-t border-outline first:border-t-0" data-s="kg-group">
                    <p className="m-0 text-[15px] font-semibold">
                      {ps.length ? ps.map((p, i) => <span key={p.key}>{i > 0 && ' · '}<button type="button" className="text-primary font-semibold p-0 bg-transparent border-0 cursor-pointer hover:underline text-left min-h-6" data-action="kg-pick" data-key={p.key} onClick={() => choose(p.key)}>{p.label}</button></span>)
                        : <>{ns.length} related notes{words ? <span className="font-normal text-fg-3"> — {bothMention(words)}</span> : null}</>}
                    </p>
                    {ns.length > 0 && <p className="m-0 mt-0.5 text-[14px] text-fg-2">
                      {ns.slice(0, 4).map((n, i) => <span key={n.key}>{i > 0 && ' · '}<a href={`#projects/notes/${n.id}`} className="text-fg-2 underline decoration-outline-strong underline-offset-2 hover:text-primary">{n.label}</a></span>)}
                      {ns.length > 4 && <span className="text-fg-3"> · and {ns.length - 4} more</span>}
                    </p>}
                    {!ns.length && <p className="m-0 mt-0.5 text-[13px] text-fg-3">No notes connected yet.</p>}
                  </li>
                );
              })}
            </ul>
          </Card>
        </>
      )}
      {(g.loose > 0 || g.left > 0) && (
        <Card className="max-w-[720px] mx-auto" id="kg-loose">
          {g.loose > 0 && <p className="text-[15px] text-fg-2 m-0">{g.loose} note{g.loose === 1 ? " isn't" : "s aren't"} connected to anything yet. They join by themselves as you write more, or when you put one in a project. <InlineLink href="#projects/notes">Your notes</InlineLink></p>}
          {g.left > 0 && <p className="text-[15px] text-fg-2 m-0 mt-2">{g.left} more connected note{g.left === 1 ? " isn't" : "s aren't"} drawn, to keep this readable — the least connected ones.</p>}
        </Card>
      )}
    </>
  );
}
