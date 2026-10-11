import { useId } from 'react';
import { Package } from 'lucide-react';
import { SceneHeading } from './SceneHeading';
import { ReferenceImage } from './ReferenceImage';
import { StoryHandoff } from './StoryHandoff';
import { FlowSymbol } from './FlowSymbol';
import type { SceneProps } from './sceneContext';

export function ContextScene({ scene }: SceneProps<'context'>) {
  const uid = useId();
  const slots = [[245,285],[625,155],[990,290],[635,475],[1060,555]];
  const positions = new Map(scene.actors.map((actor,i)=>[actor.id,slots[i]]));
  return <><div className="ex-section-inner"><div className="ex-context-header"><SceneHeading scene={scene} /><p className="ex-lede">{scene.description}</p></div>
    <figure className="ex-context-map" data-context-stage=""><div className="ex-map-caption"><span className="ex-mono">{scene.location} / relationship study</span><span>Schematic · not a verified geographic map</span></div>
      <div className="ex-context-composition">{scene.image && <ReferenceImage asset={scene.image} className="ex-context-photo" />}
        <svg viewBox="0 0 1240 660" role="img" aria-labelledby={`${uid}-title ${uid}-desc`}><title id={`${uid}-title`}>{scene.location}: proposed participants</title><desc id={`${uid}-desc`}>{scene.actors.map(a=>`${a.label}: ${a.detail}${a.optional?' (optional)':''}`).join('. ')}. {(scene.connections??[]).map(c=>c.label).join('. ')}</desc>
          <g className="ex-map-blocks" aria-hidden="true"><path d="M530 70 H730 V250 H530 Z M860 200 H1140 V380 H860 Z M535 380 H735 V570 H535 Z" /><path d="M495 110 H1210 M495 350 H1210 M495 590 H1210 M810 50 V625" className="ex-map-construction" /></g>
          {(scene.connections??[]).map((c,i)=>{const [x1,y1]=positions.get(c.from)!,[x2,y2]=positions.get(c.to)!;const optional=scene.actors.some(a=>(a.id===c.from||a.id===c.to)&&a.optional);const d=`M${x1} ${y1} C${(x1+x2)/2} ${y1} ${(x1+x2)/2} ${y2} ${x2} ${y2}`;return <g key={i} className="ex-map-routes"><path d={d} strokeDasharray={optional?'5 7':undefined} /><path d={d} className="ex-map-accent" data-context-line="" /></g>;})}
          {scene.actors.map((a,i)=>{const [x,y]=slots[i];return <g key={a.id} transform={`translate(${x},${y})`} className="ex-map-actor"><g data-context-actor=""><rect x="-104" y="-53" width="208" height="106" className={a.optional?'ex-map-optional':''} /><circle r="16" cy="-49" /><text y="-45" textAnchor="middle" className="ex-map-number">0{i+1}</text><text y="-6" textAnchor="middle" className="ex-map-name">{a.label}</text><text y="18" textAnchor="middle" className="ex-map-status">{a.optional?'OPTIONAL / LATER':'PROPOSED PARTICIPANT'}</text></g></g>;})}
        </svg>
      </div>
      <ol className="ex-context-actors">{scene.actors.map((a,i)=><li key={a.id} data-context-note=""><span className="ex-mono">0{i+1}</span><strong>{a.label}{a.optional?' · optional':''}</strong><p>{a.detail}</p>{scene.connections&&<small>{scene.connections.filter(c=>c.from===a.id).map(c=>`${c.label} → ${scene.actors.find(a=>a.id===c.to)?.label}`).join(' · ')}</small>}</li>)}</ol><figcaption className="ex-context-disclaimer">{scene.caption}</figcaption>
    </figure>
  </div><StoryHandoff from="The environment" to="The friction">A connected place does not yet mean a connected experience.</StoryHandoff></>;
}
export function ProblemScene({ scene }: SceneProps<'problem'>) {
  return <><div className="ex-section-inner"><div className="ex-problem-intro"><SceneHeading scene={scene} /><p className="ex-lede">{scene.description}</p></div><ol className="ex-problems">{scene.issues.map((issue,i)=><li key={issue.title} className={issue.image?'ex-problem-illustrated':'ex-problem-question'}>
    {issue.image&&<ReferenceImage asset={issue.image} className="ex-problem-image" />}<div className="ex-problem-copy" data-reveal=""><p className="ex-kicker">Question 0{i+1} / To validate</p><h3>{issue.title}</h3><p>{issue.body}</p><span className="ex-question-line" aria-hidden="true" /></div>
  </li>)}</ol></div><StoryHandoff from="Uncertainty" to="A proposed process">Make the handovers visible. Then test them, one by one.</StoryHandoff></>;
}
// What the travelling order says as it reaches each responsibility.
const orderStates: Record<string, string> = { order: 'Order placed', stock: 'Stock confirmed', payment: 'Payment agreed', fulfilment: 'Collected', delivery: 'Delivered' };
export function FlowScene({ scene }: SceneProps<'flow'>) {
  return <><div className="ex-section-inner"><SceneHeading scene={scene} /><p className="ex-lede ex-flow-intro">{scene.description}</p>
    <div className="ex-flow" data-flow="" style={{'--step-count':scene.steps.length} as React.CSSProperties}>
      <div className="ex-flow-coordination"><span className="ex-mono">A proposed order journey</span><span>Stock confirmed → payment agreed → goods handed over</span></div>
      <div className="ex-flow-canvas"><svg className="ex-flow-track" viewBox="0 0 1000 50" preserveAspectRatio="none" aria-hidden="true"><path className="ex-flow-baseline" d="M0 25 H1000" /><path className="ex-flow-progress" data-flow-line="" d="M0 25 H1000" /></svg>
      <div className="ex-flow-token" data-flow-token="" aria-hidden="true"><span className="ex-flow-token-dot" /><span className="ex-flow-token-chip"><Package size={13} /><span className="ex-flow-token-states">{scene.steps.map((step,i)=><span key={i} className="ex-flow-token-state" data-flow-state="">{orderStates[step.responsibility??'']??`Stage ${i+1}`}</span>)}</span></span></div>
      <ol>{scene.steps.map((step,i)=><li key={i} data-flow-step=""><div className="ex-flow-stage-visual"><FlowSymbol kind={step.responsibility} /><span className="ex-flow-number">0{i+1}</span></div><div className="ex-flow-stage-copy"><span className="ex-flow-duty">{step.responsibility??`Stage ${i+1}`}</span><h3>{step.title}</h3><p>{step.body}</p></div></li>)}</ol></div>
    </div><p className="ex-flow-note">The platform coordinates the journey. Each handover still needs a named owner.</p>
  </div><StoryHandoff from="One journey" to="The whole system">Separate the movement of goods, information and money.</StoryHandoff></>;
}
