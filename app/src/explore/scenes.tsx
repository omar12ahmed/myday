import type { ComponentType } from 'react';
import { ArrowDown } from 'lucide-react';
import { Blueprint } from './Diagram';
import type { ExploreScene } from './schema';
import type { SceneContext, SceneProps as Props } from './sceneContext';
import { SceneHeading, TitleLines } from './SceneHeading';
import { ContextScene, ProblemScene, FlowScene } from './NarrativeScenes';
import { EconomicsScene } from './EconomicsScene';
import { ActionScene } from './ActionScene';
import { ReferenceImage } from './ReferenceImage';
import { StoryHandoff } from './StoryHandoff';

function Hero({ scene, context }: Props<'hero'>) {
  const photographic = scene.image !== 'none';
  return <>
    <div className={`ex-hero ${photographic ? 'ex-hero-photo' : 'ex-hero-type'}`}>
      {photographic ? <ReferenceImage asset={scene.image as 'market-aerial'} className="ex-hero-image" priority /> : <div className="ex-hero-drawing" aria-hidden="true"><svg viewBox="0 0 500 600"><path d="M80 480 V170 L260 80 L430 180 V480 L260 570 Z M80 170 L260 275 L430 180 M260 275 V570 M80 480 L260 375 L430 480 M260 80 V375" /><circle cx="260" cy="275" r="90" /><path d="M20 275 H480 M260 25 V590" strokeDasharray="3 9" /></svg></div>}
      <div className="ex-hero-opening"><p className="ex-kicker" data-hero-entrance="">Explore / {scene.eyebrow}</p><h1 id="explore-title" tabIndex={-1} data-hero-entrance=""><TitleLines text={scene.title} /></h1><span className="ex-hero-rule" aria-hidden="true" /></div>
      <div className="ex-hero-bottom"><p className="ex-proposition" data-hero-entrance="">{scene.proposition}</p><div className="ex-hero-invitation"><button className="ex-text-button" onClick={() => context.jump(context.firstChapter)}>Step inside the idea <ArrowDown size={18} aria-hidden="true" /></button><p className="ex-hero-foot">A working concept.<br />An invitation to investigate.</p></div></div>
      {photographic && <div className="ex-hero-annotation" data-hero-detail=""><span className="ex-mono">A proposed connection</span><span>People. Goods. One coordinated journey.</span></div>}
    </div>
    <StoryHandoff from="The idea" to={context.firstChapter === 'context' ? 'The environment' : 'The relationships'}>Begin with the people and the world this idea would serve.</StoryHandoff>
  </>;
}
function Architecture({ scene, context }: Props<'architecture'>) {
  const hasEconomics = context.doc.scenes.some(s => s.type === 'economics');
  return <><div className="ex-section-inner"><SceneHeading scene={scene} /><p className="ex-lede ex-architecture-intro">{scene.description}</p><Blueprint scene={scene} /></div><StoryHandoff from="Responsibilities" to={hasEconomics ? 'The economics' : 'A next step'}>{hasEconomics ? 'Every handover has a cost. Follow who pays, and who earns.' : 'Choose one relationship to understand better. Turn the question into a next step.'}</StoryHandoff></>;
}

// A finite registry: unknown scene types are rejected at the data boundary.
const sceneRegistry: { [K in ExploreScene['type']]: ComponentType<Props<K>> } = { hero: Hero, context: ContextScene, problem: ProblemScene, flow: FlowScene, architecture: Architecture, economics: EconomicsScene, action: ActionScene };
export function SceneRenderer({ scene, context }: { scene: ExploreScene; context: SceneContext }) {
  switch (scene.type) {
    case 'hero': return <sceneRegistry.hero scene={scene} context={context} />;
    case 'context': return <sceneRegistry.context scene={scene} context={context} />;
    case 'problem': return <sceneRegistry.problem scene={scene} context={context} />;
    case 'flow': return <sceneRegistry.flow scene={scene} context={context} />;
    case 'economics': return <sceneRegistry.economics scene={scene} context={context} />;
    case 'action': return <sceneRegistry.action scene={scene} context={context} />;
    case 'architecture': return <sceneRegistry.architecture scene={scene} context={context} />;
  }
}
