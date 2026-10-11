import type { ExploreScene } from './schema';
// Each written line sits in its own mask, so the motion layer can raise it into view; the text itself is unchanged.
export function TitleLines({ text }: { text: string }) {
  return <>{text.split('\n').map((line, i) => <span key={i}>{i > 0 && ' '}<span className="ex-line"><span className="ex-line-inner">{line}</span></span></span>)}</>;
}
export function SceneHeading({ scene }: { scene: ExploreScene }) {
  return <div className="ex-scene-heading" data-reveal=""><p className="ex-kicker">{scene.eyebrow}</p><h2 id={`ex-title-${scene.id}`}><TitleLines text={scene.title} /></h2><p className="ex-basis">{scene.basis === 'brief' ? 'From the idea brief' : scene.basis === 'example' ? 'Placeholder figures · replace them as research finds real ones' : 'Working assumptions · to be validated'}</p></div>;
}
