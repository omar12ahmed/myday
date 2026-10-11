import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import type { MyDayData } from '../data/types';
import { contentForProject, isHargeisa } from './content';
import { exploreHref, projectHref } from './route';
import { SceneRenderer } from './scenes';
import './explore.css';
import { ExploreBoundary } from './ExploreBoundary';
import { useReducedMotion } from './useMotionPreference';
const Motion = lazy(() => import('./Motion'));

export default function ExploreScreen({ data, projectId, example }: { data: MyDayData; projectId: string; example: boolean }) {
  const project = data.projects.items.find(p => p.id === projectId);
  const root = useRef<HTMLDivElement>(null);
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const attachRoot = useCallback((node: HTMLDivElement | null) => { root.current = node; setContainer(node); }, []);
  const [active, setActive] = useState('hero');
  const [paused, setPaused] = useState(false);
  const reduced = useReducedMotion();
  const allowed = data.settings.motion !== 'off' && !reduced;
  const motion = allowed && !paused;
  const result = useMemo(() => { if (!project) return null; try { return { doc: contentForProject(project, example), error: false }; } catch { return { doc: null, error: true }; } }, [project, example]);
  const doc = result?.doc;
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    document.getElementById('explore-title')?.focus({ preventScroll: true });
  }, [projectId, example]);
  useEffect(() => {
    if (!root.current || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(entries => { for (const e of entries) if (e.isIntersecting) setActive((e.target as HTMLElement).dataset.scene!); }, { rootMargin: '-15% 0px -45% 0px' });
    root.current.querySelectorAll('[data-scene]').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [doc]);
  function jump(id: string) { document.getElementById(`ex-${id}`)?.scrollIntoView({ behavior: motion ? 'smooth' : 'instant', block: 'start' }); setActive(id); }
  return <div className="explore" ref={attachRoot} data-edition={doc?.edition} data-motion-enabled={motion}>
    <header className="ex-topbar"><a href={projectHref(projectId)} data-action="explore-exit"><ArrowLeft size={18} aria-hidden="true" /><span>Project</span></a><span className="ex-project-name">{project?.title || 'Explore'}</span><span className="ex-topbar-word">Explore</span><button className="ex-motion-toggle" disabled={!allowed} aria-pressed={paused} onClick={() => setPaused(!paused)}>{reduced ? 'Reduced motion' : !allowed ? 'Motion off' : paused ? 'Resume motion' : 'Pause motion'}</button>{doc && <label className="ex-chapter-picker"><span className="sr-only">Explore chapter</span><select value={active} onChange={e => jump(e.target.value)}>{doc.scenes.map((s, i) => <option key={s.id} value={s.id}>{String(i + 1).padStart(2, '0')} / {s.id === 'hero' ? 'Introduction' : s.eyebrow}</option>)}</select></label>}</header>
    {!project || !doc ? <div className="ex-unavailable"><h1>{!project ? 'This project isn’t here.' : 'This exploration could not be opened.'}</h1><p>{!project ? 'It may have been removed or this link may be incomplete.' : 'Your project is safe. Return to it and try again.'}</p><a href="#projects">Back to projects</a></div> : <>
      {!isHargeisa(project) && <div className="ex-example-note">{example ? <><span>Hargeisa Marketplace’s exploration, shown for reference. This project is unchanged.</span><a href={exploreHref(projectId)}>Return to your idea</a></> : <><span>A starting brief for your idea. No research has been generated.</span><a href={`${exploreHref(projectId)}?example=hargeisa`}>See how Hargeisa Marketplace is explored <ArrowUpRight size={15} aria-hidden="true" /></a></>}</div>}
      <nav className="ex-chapter-rail" aria-label="Explore chapters">{doc.scenes.map((s, i) => <button key={s.id} aria-label={s.eyebrow} aria-current={active === s.id ? 'step' : undefined} onClick={() => jump(s.id)}>{String(i + 1).padStart(2, '0')}</button>)}</nav>
      <article aria-labelledby="explore-title">{doc.scenes.map(s => <section key={s.id} id={`ex-${s.id}`} data-scene={s.id} className={`ex-scene ex-scene-${s.type}`} aria-labelledby={s.type === 'hero' ? 'explore-title' : `ex-title-${s.id}`}><SceneRenderer scene={s} context={{ jump, firstChapter: doc.scenes[1].id, data, doc, preview: example && !isHargeisa(project) }} /></section>)}</article>
      {motion && container && <ExploreBoundary><Suspense fallback={null}><Motion root={root} /></Suspense></ExploreBoundary>}
      <footer className="ex-footer"><span>MyDay / Explore</span><span>A concept to test. Room to change your mind.</span><a href={projectHref(projectId)}>Return to project <ArrowUpRight size={16} aria-hidden="true" /></a></footer>
    </>}
  </div>;
}
