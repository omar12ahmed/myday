// Connections — the knowledge graph (milestone 4): how your notes and projects connect, drawn by itself from links
// that already exist. Never managed by hand, nothing saved, nothing sent anywhere:
// - a note in a project — put there by you, or by MyDay (shown differently until you keep it; see understand.ts);
// - related notes — the same on-device word matching as a note's "Related" (a note's 3 closest, both ways). Two notes
//   in the same project aren't joined again: their project already holds them together.
// Notes that connect to nothing yet are counted, not drawn. Done projects are drawn only if notes still belong to them.
//
// Worked out once per saved state: the groups that go together, then each group laid out by a small, fixed simulation
// (nodes push each other apart, links pull them together) that always starts from the same place — so the drawing
// stays the same every time you open it, and only changes when what you wrote changes. Fitting the groups into the
// width of the screen is separate (`packGraph`), so a phone and a laptop show the same shapes.
import { isBlank, noteName } from './notes';
import type { MyDayData, Note, Project, ProjectStatus } from './types';
import { relatedNotes } from './understand';

export type NodeKind = 'project' | 'note';
export interface GraphNode { key: string; kind: NodeKind; id: string; label: string; degree: number; x: number; y: number; status?: ProjectStatus }
export type EdgeKind = 'in' | 'myday' | 'related';
export interface GraphEdge { a: string; b: string; kind: EdgeKind; why: string }
// A group's nodes, placed relative to its top-left corner; w × h is the space they take (with room around them).
export interface GraphGroup { nodes: GraphNode[]; w: number; h: number }
export interface KnowledgeGraph {
  groups: GraphGroup[];   // largest first
  edges: GraphEdge[];
  loose: number;          // notes connected to nothing yet
  left: number;           // connected notes not drawn (beyond GRAPH.maxNotes: the least connected, then the oldest)
}

// maxNotes keeps the drawing readable (and quick to work out); `link` is the distance a link settles at, in pixels.
export const GRAPH = { maxNotes: 150, related: 3, link: 70, iterations: 300, pad: 26 };
// The longest a name is drawn, in pixels (longer ones are shortened; the full name is in the panel).
export const GRAPH_LABEL_MAX: Record<'project' | 'note', number> = { project: 190, note: 150 };

export const projectKey = (id: string) => 'p:' + id;
export const noteKey = (id: string) => 'n:' + id;

const cache = new WeakMap<MyDayData, KnowledgeGraph>();
export function knowledgeGraph(data: MyDayData): KnowledgeGraph {
  const hit = cache.get(data);
  if (hit) return hit;
  const g = build(data);
  cache.set(data, g);
  return g;
}

function build(data: MyDayData): KnowledgeGraph {
  // In id order, so the order notes happen to be saved in never changes the drawing.
  const notes = data.notes.items.filter(n => !isBlank(n)).sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const projects = new Map(data.projects.items.map(p => [p.id, p]));
  let edges: GraphEdge[] = [];
  for (const n of notes) {
    if (n.projectId && projects.has(n.projectId)) edges.push({ a: noteKey(n.id), b: projectKey(n.projectId), kind: n.linkedBy ? 'myday' : 'in', why: n.linkWhy ?? '' });
  }
  const pairs = new Set<string>();
  for (const n of notes) {
    for (const r of relatedNotes(data, n, GRAPH.related)) {
      if (n.projectId && r.note.projectId === n.projectId) continue;
      const pair = n.id < r.note.id ? `${n.id}|${r.note.id}` : `${r.note.id}|${n.id}`;
      if (pairs.has(pair)) continue;
      pairs.add(pair);
      edges.push({ a: noteKey(n.id), b: noteKey(r.note.id), kind: 'related', why: r.why });
    }
  }
  const degree = (es: GraphEdge[]) => { const d = new Map<string, number>(); for (const e of es) { d.set(e.a, (d.get(e.a) ?? 0) + 1); d.set(e.b, (d.get(e.b) ?? 0) + 1); } return d; };
  let deg = degree(edges);
  // Too many to read: keep the most connected notes (then the most recently changed).
  const linked = notes.filter(n => deg.has(noteKey(n.id)));
  let left = 0;
  if (linked.length > GRAPH.maxNotes) {
    const keep = new Set([...linked].sort((a, b) => (deg.get(noteKey(b.id))! - deg.get(noteKey(a.id))!) || b.updatedAt.localeCompare(a.updatedAt) || a.id.localeCompare(b.id))
      .slice(0, GRAPH.maxNotes).map(n => noteKey(n.id)));
    left = linked.length - keep.size;
    edges = edges.filter(e => (!e.a.startsWith('n:') || keep.has(e.a)) && (!e.b.startsWith('n:') || keep.has(e.b)));
    deg = degree(edges);
  }
  const nodes = new Map<string, GraphNode>();
  const add = (key: string, kind: NodeKind, id: string, label: string, status?: ProjectStatus) => nodes.set(key, { key, kind, id, label, degree: deg.get(key) ?? 0, x: 0, y: 0, ...(status ? { status } : {}) });
  for (const p of projects.values()) if (p.status !== 'done' || deg.has(projectKey(p.id))) add(projectKey(p.id), 'project', p.id, p.title.trim() || 'Untitled project', p.status);
  for (const n of notes) if (deg.has(noteKey(n.id))) add(noteKey(n.id), 'note', n.id, noteName(n));
  const loose = notes.filter(n => !deg.has(noteKey(n.id))).length - left;

  // The groups that go together (connected by any path), each laid out on its own.
  const parent = new Map([...nodes.keys()].map(k => [k, k]));
  const root = (k: string): string => { let r = k; while (parent.get(r) !== r) r = parent.get(r)!; parent.set(k, r); return r; };
  for (const e of edges) { const a = root(e.a), b = root(e.b); if (a !== b) parent.set(a < b ? b : a, a < b ? a : b); }
  const members = new Map<string, GraphNode[]>();
  for (const [k, n] of nodes) { const r = root(k); if (!members.has(r)) members.set(r, []); members.get(r)!.push(n); }
  const groups = [...members.values()].map(ns => layoutGroup(ns, edges.filter(e => ns.some(n => n.key === e.a))));
  groups.sort((a, b) => b.nodes.length - a.nodes.length || a.nodes[0].key.localeCompare(b.nodes[0].key));
  return { groups, edges, loose: Math.max(0, loose), left };
}

// One group: projects first, then notes, set out on a small grid, then 300 rounds of "push apart, pull together"
// that cool down as they go (Fruchterman–Reingold). Only plain arithmetic, so it comes out the same every time.
function layoutGroup(ns: GraphNode[], es: GraphEdge[]): GraphGroup {
  const nodes = [...ns].sort((a, b) => (a.kind === b.kind ? (a.key < b.key ? -1 : 1) : a.kind === 'project' ? -1 : 1));
  const n = nodes.length, at = new Map(nodes.map((nd, i) => [nd.key, i]));
  const cols = Math.ceil(Math.sqrt(n)), k = GRAPH.link;
  const x = nodes.map((_, i) => (i % cols) * k * 0.6 + (Math.floor(i / cols) % 2) * k * 0.3);
  const y = nodes.map((_, i) => Math.floor(i / cols) * k * 0.6);
  const links = es.map(e => [at.get(e.a)!, at.get(e.b)!, e.kind === 'related' ? 1.3 : 1] as const).sort((p, q) => p[0] - q[0] || p[1] - q[1]);
  for (let it = 0; it < GRAPH.iterations && n > 1; it++) {
    const t = k * 0.8 * (1 - it / GRAPH.iterations) + 1;
    const dx = new Array<number>(n).fill(0), dy = new Array<number>(n).fill(0);
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      let ux = x[i] - x[j], uy = y[i] - y[j], d2 = ux * ux + uy * uy;
      if (d2 < 0.01) { ux = (i - j) * 0.1; uy = 0.1; d2 = ux * ux + uy * uy; }
      const f = (k * k) / d2; // k²/d, along the unit vector (u/d)
      dx[i] += ux * f; dy[i] += uy * f; dx[j] -= ux * f; dy[j] -= uy * f;
    }
    for (const [i, j, len] of links) {
      const ux = x[i] - x[j], uy = y[i] - y[j], d = Math.sqrt(ux * ux + uy * uy) || 0.01, f = d / (k * len); // d²/k, along u/d
      dx[i] -= ux * f; dy[i] -= uy * f; dx[j] += ux * f; dy[j] += uy * f;
    }
    for (let i = 0; i < n; i++) {
      dx[i] -= x[i] * 0.03; dy[i] -= y[i] * 0.03; // a gentle pull to the middle keeps a group together
      const m = Math.sqrt(dx[i] * dx[i] + dy[i] * dy[i]);
      if (m > 0) { const s = Math.min(m, t) / m; x[i] += dx[i] * s; y[i] += dy[i] * s; }
    }
  }
  // Room around the nodes for their names (about half a name either side, a line below), so a group's words fit in it.
  const half = nodes.map(nd => Math.min(nd.label.length * 7.4, GRAPH_LABEL_MAX[nd.kind]) / 2 + 8);
  const minX = Math.min(...x.map((v, i) => v - half[i])), maxX = Math.max(...x.map((v, i) => v + half[i]));
  const minY = Math.min(...y) - GRAPH.pad, maxY = Math.max(...y) + GRAPH.pad + 14;
  const placed = nodes.map((nd, i) => ({ ...nd, x: x[i] - minX, y: y[i] - minY }));
  return { nodes: placed, w: maxX - minX, h: maxY - minY };
}

// The groups fitted into a width: side by side while they fit, then on the next row. A group wider than the space is
// drawn smaller (its words stay the same size). Returns each node's place in pixels and the height needed.
export interface PlacedNode extends GraphNode { gx: number; gy: number }
export function packGraph(g: KnowledgeGraph, width: number, gap = 18): { nodes: PlacedNode[]; height: number } {
  const out: PlacedNode[] = [];
  let x = 0, y = 0, row = 0;
  for (const gr of g.groups) {
    const s = Math.min(1, width / gr.w), w = gr.w * s, h = gr.h * s;
    if (x > 0 && x + w > width) { x = 0; y += row + gap; row = 0; }
    for (const nd of gr.nodes) out.push({ ...nd, gx: x + nd.x * s, gy: y + nd.y * s });
    x += w + gap; row = Math.max(row, h);
  }
  return { nodes: out, height: y + row };
}

// The note or project a node stands for (null once it's gone).
export const nodeNote = (data: MyDayData, nd: { kind: NodeKind; id: string }): Note | null => (nd.kind === 'note' ? data.notes.items.find(n => n.id === nd.id) ?? null : null);
export const nodeProject = (data: MyDayData, nd: { kind: NodeKind; id: string }): Project | null => (nd.kind === 'project' ? data.projects.items.find(p => p.id === nd.id) ?? null : null);
// The nodes linked to one node, and how.
export function neighbours(g: KnowledgeGraph, key: string): Map<string, GraphEdge> {
  const out = new Map<string, GraphEdge>();
  for (const e of g.edges) { if (e.a === key) out.set(e.b, e); else if (e.b === key) out.set(e.a, e); }
  return out;
}
