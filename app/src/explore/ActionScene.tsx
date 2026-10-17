import { useState } from 'react';
import { ArrowUpRight, Check, Plus } from 'lucide-react';
import { assumptionTask, findOut, isBusiness } from '../data/businessModel';
import { addTask } from '../data/tasks';
import { updateSaved } from '../data/storage';
import { SceneHeading } from './SceneHeading';
import { ReferenceImage } from './ReferenceImage';
import { exploreHref, projectHref } from './route';
import type { SceneProps } from './sceneContext';

export function ActionScene({ scene, context }: SceneProps<'action'>) {
  const { data, doc, preview } = context;
  const marker=`[MyDay Explore: ${doc.id}/${scene.task.id}]`;
  // A business idea's "Find out" (built from its one page) is the Model tab's own task, remembered on the assumption.
  const project=data.projects.items.find(p=>p.id===doc.projectId), aid=scene.task.assumptionId;
  const assumption=aid?project?.model?.assumptions.find(a=>a.id===aid)??null:null;
  const existing=aid?(assumption?assumptionTask(data,assumption):null):data.tasks.items.find(t=>t.projectId===doc.projectId && t.notes.includes(marker));
  const [message,setMessage]=useState('');
  function create() {
    const saved=aid?updateSaved(d=>(findOut(d,doc.projectId,aid)?undefined:false)):updateSaved(d=>{
      if (!d.projects.items.some(p=>p.id===doc.projectId) || d.tasks.items.some(t=>t.projectId===doc.projectId&&t.notes.includes(marker))) return false;
      const id=addTask(d.tasks,{title:scene.task.title,minutes:scene.task.minutes,category:'admin',notes:`${scene.task.notes}\n\n${marker}`});
      if (!id) return false;
      d.tasks.items.find(t=>t.id===id)!.projectId=doc.projectId;
    });
    setMessage(saved==='saved'?'Added to this project’s tasks. Choose when to do it.':saved==='not-saved'?'The task could not be saved. Check available storage or changes in another tab, then try again.':'No new task was created. It may already exist or the project has changed.');
  }
  return <div className="ex-section-inner"><SceneHeading scene={scene} />{(scene.established || scene.uncertain) && <div className="ex-action-reflection"><div><span className="ex-mono">What the model makes clear</span><p>{scene.established}</p></div><div><span className="ex-mono">What still needs evidence</span><p>{scene.uncertain}</p></div></div>}<div className="ex-action-body"><div className="ex-action-lead"><p className="ex-lede">{scene.description}</p>{scene.image&&<ReferenceImage asset={scene.image} className="ex-action-photo" />}</div><div className="ex-next-action"><span className="ex-mono">One validation action / {scene.task.minutes} minutes</span><h3>{scene.task.title}</h3><p>{scene.task.notes}</p>{preview?<p className="ex-preview-action">This is Hargeisa Marketplace’s next step. <a href={exploreHref(doc.projectId)}>Return to your idea</a> to create its own validation task.</p>:<div className="ex-task-control">{existing?<a className="ex-primary-button" href={`#today/tasks/${encodeURIComponent(existing.id)}`}><Check size={17} aria-hidden="true" /> Task added · open task</a>:<button className="ex-primary-button" data-action="explore-create-task" onClick={create}><Plus size={17} aria-hidden="true" /> Create this task</button>}<span>No date assigned. Your current next step stays as it is.</span></div>}<p role="status" className="ex-save-message">{message}</p></div></div><div className="ex-action-links">{project&&isBusiness(project)&&<a href={`${projectHref(doc.projectId)}/model`} data-action="explore-one-page">Your one page <ArrowUpRight size={17} aria-hidden="true" /></a>}<a href={projectHref(doc.projectId)}>Return to project <ArrowUpRight size={17} aria-hidden="true" /></a><button className="ex-text-button" onClick={()=>context.jump(context.doc.scenes.find(s=>s.type==='economics')?.id??context.firstChapter)}>Continue exploring <ArrowUpRight size={17} aria-hidden="true" /></button></div></div>;
}
