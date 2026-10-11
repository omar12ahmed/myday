import { useId } from 'react';
import type { SceneOf } from './schema';
import './architecture.css';

const slots = [[600,360],[155,340],[1060,185],[1060,405],[605,145],[1030,665],[180,675]];
const layers = [
  {kind:'goods',name:'Physical goods',result:'Goods movement',question:'Who holds, moves and receives the goods?',code:'01'},
  {kind:'order',name:'Information',result:'Orders & availability',question:'Who knows what is available and what was requested?',code:'02'},
  {kind:'payment',name:'Money',result:'Payments & settlement',question:'Who collects payment, and who receives settlement?',code:'03'},
  {kind:'coordination',name:'Platform coordination',result:'Coordinated handovers',question:'Who confirms the order and arranges each handover?',code:'04'},
] as const;
// Drafting furniture: lettered column axes through the node columns, and registration marks in the sheet's corners.
const columns = [[168,'A'],[600,'B'],[1046,'C']] as const;
const corners = [[36,36],[1204,36],[36,784],[1204,784]] as const;
const plural = (n: number) => `${n} relationship${n === 1 ? '' : 's'}`;

function Schematic({ scene }: { scene: SceneOf<'architecture'> }) {
  const uid = useId().replaceAll(':','');
  const positions = new Map(scene.nodes.map((n,i)=>[n.id,slots[i]]));
  // A relationship's path, and its midpoint (where its layer's keynote sits).
  function edge(from:string,to:string): { d: string; mid: [number, number] } {
    const [x1,y1]=positions.get(from)!,[x2,y2]=positions.get(to)!;
    const horizontal=Math.abs(x2-x1)>Math.abs(y2-y1);
    const sx=x1+(horizontal?Math.sign(x2-x1)*114:0),sy=y1+(horizontal?0:Math.sign(y2-y1)*44);
    const ex=x2-(horizontal?Math.sign(x2-x1)*114:0),ey=y2-(horizontal?0:Math.sign(y2-y1)*44);
    const blocked=!horizontal&&scene.nodes.some((n,i)=>n.id!==from&&n.id!==to&&Math.abs(slots[i][0]-x1)<114&&slots[i][1]>Math.min(sy,ey)&&slots[i][1]<Math.max(sy,ey));
    const gutter=x1>600?1208:x1<600?26:810;
    if (blocked) return { d:`M${sx} ${sy} H${gutter} V${ey} H${ex}`, mid:[gutter,(sy+ey)/2] };
    return { d:horizontal?`M${sx} ${sy} C${(sx+ex)/2} ${sy},${(sx+ex)/2} ${ey},${ex} ${ey}`:`M${sx} ${sy} C${sx} ${(sy+ey)/2},${ex} ${(sy+ey)/2},${ex} ${ey}`, mid:[(sx+ex)/2,(sy+ey)/2] };
  }
  return (
    <svg className="ex-diagram-wide" viewBox="0 0 1240 820" role="img" aria-labelledby={`${uid}-title ${uid}-desc`}>
      <title id={`${uid}-title`}>{scene.title}</title><desc id={`${uid}-desc`}>{scene.connections.map(c=>`${scene.nodes.find(n=>n.id===c.from)?.label} to ${scene.nodes.find(n=>n.id===c.to)?.label}: ${c.label}`).join('. ')}</desc>
      <defs>
        <pattern id={`${uid}-grid`} width="32" height="32" patternUnits="userSpaceOnUse"><path d="M32 0 H0 V32" fill="none" stroke="currentColor" strokeOpacity=".07" /></pattern>
        <pattern id={`${uid}-major`} width="160" height="160" patternUnits="userSpaceOnUse" x="16" y="16"><path d="M160 0 H0 V160" fill="none" stroke="currentColor" strokeOpacity=".13" /></pattern>
        <marker id={`${uid}-arrow`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10" fill="none" stroke="currentColor" /></marker>
      </defs>
      {/* The camera group lets the motion layer pull back slightly as the drawing is produced. */}
      <g className="ex-camera" data-architecture-camera="">
        <g className="ex-sheet" aria-hidden="true"><rect x="16" y="16" width="1208" height="788" fill={`url(#${uid}-grid)`} /><rect x="16" y="16" width="1208" height="788" fill={`url(#${uid}-major)`} data-blueprint-sheet="" /></g>
        <g className="ex-axes" aria-hidden="true">{columns.map(([x,letter])=><g key={letter} data-blueprint-axis=""><path d={`M${x} 56 V800`} /><circle cx={x} cy="34" r="22" /><text x={x} y="42" textAnchor="middle">{letter}</text></g>)}</g>
        <g className="ex-construction" data-blueprint-foundation="" aria-hidden="true"><path data-construction-line="" d="M20 56 H1220 M56 20 V800 M20 780 H1220 M1184 20 V800 M20 56 H64 M56 20 V64 M1184 760 V800 M1160 780 H1220 M600 65 V765 M68 360 H1175" /><circle cx="600" cy="360" r="154" data-construction-arc="" /><ellipse cx="600" cy="390" rx="225" ry="142" data-construction-arc="" /><path data-construction-line="" d="M350 360 L600 210 L850 360 L600 510 Z M350 386 L600 536 L850 386" /></g>
        <g className="ex-registration" aria-hidden="true">{corners.map(([x,y])=><g key={`${x}-${y}`} data-registration-mark=""><circle cx={x} cy={y} r="10" /><path d={`M${x-17} ${y} H${x+17} M${x} ${y-17} V${y+17}`} /></g>)}</g>
        {layers.map(layer=><g key={layer.kind} className={`ex-architecture-layer ex-layer-${layer.kind}`} data-layer={layer.kind}>{scene.connections.filter(c=>c.kind===layer.kind).map((c,i)=>{const {d}=edge(c.from,c.to);return <g key={i}><path className={`ex-connection ex-connection-${c.kind}`} d={d} markerEnd={`url(#${uid}-arrow)`}><title>{c.label}</title></path><path className="ex-connection-accent" data-architecture-line={layer.kind} d={d} /></g>;})}</g>)}
        {scene.nodes.map((n,i)=>{const[x,y]=slots[i];return <g key={n.id} className={`ex-node ${i===0?'ex-node-hub':''}`} transform={`translate(${x-114},${y-44})`}><title>{n.label}: {n.detail}</title><path className="ex-node-plinth" data-node-line="" d="M0 78 L114 110 L228 78 M0 85 L114 117 L228 85" /><rect width="228" height="88" rx="1" strokeDasharray={n.optional?'5 5':undefined} data-node-outline={n.optional?'optional':''} /><path className="ex-node-corners" data-node-line="" d="M0 14 V0 H14 M214 0 H228 V14 M228 74 V88 H214 M14 88 H0 V74" /><text x="114" y="53" textAnchor="middle" className="ex-node-index" data-node-label="">{String(i+1).padStart(2,'0')}</text><text x="14" y="34" className="ex-node-name" data-node-label="">{n.label.length>13?n.label.slice(0,12)+'…':n.label}</text></g>;})}
        {/* Keynotes: each layer's number, placed on its first relationship — the same numbers as the proposed system. */}
        <g aria-hidden="true">{layers.map(layer=>{const first=scene.connections.find(c=>c.kind===layer.kind);if(!first)return null;const [x,y]=edge(first.from,first.to).mid;return <g key={layer.kind} className={`ex-keynote ex-layer-${layer.kind}`} data-keynote={layer.kind}><circle cx={x} cy={y} r="24" /><text x={x} y={y+8} textAnchor="middle">{layer.code}</text></g>;})}</g>
      </g>
    </svg>
  );
}

// The proposed system's depth: a receding floor grid behind the four planes (decorative only).
function PerspectiveGrid() {
  const rays = Array.from({ length: 17 }, (_, i) => -200 + i * 50);
  const rows = [300, 236, 188, 151, 122, 100, 82];
  return <svg className="ex-system-perspective" data-system-perspective="" viewBox="0 0 400 300" preserveAspectRatio="none" aria-hidden="true">
    {rays.map(x=><path key={`r${x}`} d={`M${x} 300 L200 -60`} />)}{rows.map(y=><path key={`h${y}`} d={`M0 ${y} H400`} />)}
  </svg>;
}

// Both panels project the same validated scene. No second graph, factual claims or saved state.
export function Blueprint({ scene }: { scene: SceneOf<'architecture'> }) {
  const label = (id: string) => scene.nodes.find(node => node.id === id)!.label;
  return <div className="ex-architecture-layout" data-architecture="">
    <div className="ex-architecture-sequence" data-architecture-sequence="">
      <div className="ex-architecture-board" data-architecture-board="">
        <div className="ex-construction-caption"><span className="ex-mono">One model / two readings</span><p>Blueprint first. The proposed system follows.</p></div>
        <div className="ex-architecture-panels">
          <figure className="ex-blueprint ex-architecture-panel">
            <header className="ex-panel-heading"><div><span className="ex-mono">01 / Blueprint</span><h3>Underlying structure</h3><p>Roles and relationships · proposed, not to scale</p></div><dl className="ex-title-block" aria-hidden="true"><div><dt>Sheet</dt><dd>01 / 02</dd></div><div><dt>Scale</dt><dd>None</dd></div></dl></header>
            <Schematic scene={scene} />
            <ol className="ex-participant-key" aria-label="Drawing participants">{scene.nodes.map((node,i)=><li key={node.id}><span>{String(i+1).padStart(2,'0')}</span><strong>{node.label}{node.optional?' · optional':''}</strong></li>)}</ol>
            <figcaption className="ex-diagram-key">Read the drawing by role. Full responsibilities follow below.</figcaption>
          </figure>
          <figure className="ex-proposed-system ex-architecture-panel">
            <header className="ex-panel-heading"><div><span className="ex-mono">02 / Proposed system</span><h3>Working together</h3><p>The same relationships, organised by responsibility</p></div><dl className="ex-title-block" aria-hidden="true"><div><dt>Sheet</dt><dd>02 / 02</dd></div><div><dt>View</dt><dd>Assembled</dd></div></dl></header>
            <div className="ex-system-assembly" data-system-assembly=""><PerspectiveGrid />{layers.map((layer,i)=>{const links=scene.connections.filter(c=>c.kind===layer.kind);return <section key={layer.kind} className={`ex-system-layer ex-layer-${layer.kind}`} data-system-layer={layer.kind}>
              <span className="ex-layer-plane" data-layer-plane="" aria-hidden="true" />{i>0&&<span className="ex-layer-joint" data-layer-joint="" aria-hidden="true" />}
              <div className="ex-system-heading"><span className="ex-system-number">{layer.code}</span><h4>{layer.result}</h4>{links.length>0&&<span className="ex-system-count" data-system-count="">{plural(links.length)}</span>}</div>
              <svg className="ex-system-rule" viewBox="0 0 100 2" preserveAspectRatio="none" aria-hidden="true"><path d="M0 1 H100" /><path d="M0 1 H100" data-system-line={layer.kind} /></svg>
              <ul>{links.map((c,i)=><li key={i} title={c.label} data-system-connection={layer.kind}><span>{label(c.from)}</span><span className="ex-system-arrow" aria-hidden="true">→</span><span>{label(c.to)}</span><span className="sr-only">: {c.label}</span></li>)}{!links.length&&<li className="ex-system-unspecified">Not specified in this brief.</li>}</ul>
            </section>;})}</div>
            <figcaption className="ex-system-key">A coordinated proposal, not an operating or validated business.</figcaption>
          </figure>
        </div>
        <ol className="ex-construction-order" aria-label="Construction order">{layers.map(layer=><li key={layer.kind} className={`ex-layer-${layer.kind}`}><span>{layer.code}</span>{layer.name}<i aria-hidden="true" data-blueprint-progress={layer.kind} /><b aria-hidden="true" data-system-progress={layer.kind} /></li>)}</ol>
        <p className="ex-construction-foot">Thin rule: blueprint. Solid rule: proposed system. Every relationship remains available in the reading below.</p>
      </div>
    </div>
    <div className="ex-architecture-reading">
      <div className="ex-responsibility-schedule"><span className="ex-mono">Read the responsibilities</span><h3>Each role has a part.</h3><ol className="ex-diagram-mobile">{scene.nodes.map((n,i)=><li key={n.id}><span className="ex-mono">{String(i+1).padStart(2,'0')}</span><div><strong>{n.label}{n.optional?' (optional)':''}</strong><p>{n.detail}</p><small>{scene.connections.filter(c=>c.from===n.id).map(c=>`${c.label} → ${label(c.to)}`).join(' · ')||'Responsibility described above; no outgoing connection specified.'}</small></div></li>)}</ol></div>
      <div className="ex-architecture-layers" aria-label="Four system layers">{layers.map(layer=><section className={`ex-layer-note ex-layer-${layer.kind}`} key={layer.kind} data-layer-note={layer.kind}><span className="ex-mono">{layer.code} / System layer</span><h3>{layer.name}</h3><p>{layer.question}</p><ul>{scene.connections.filter(c=>c.kind===layer.kind).map((c,i)=><li key={i}>{label(c.from)} → {label(c.to)}<small>{c.label}</small></li>)}{!scene.connections.some(c=>c.kind===layer.kind)&&<li>Not specified in this brief.</li>}</ul></section>)}</div>
    </div>
  </div>;
}
