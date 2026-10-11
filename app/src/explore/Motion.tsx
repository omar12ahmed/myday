import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { RefObject } from 'react';
gsap.registerPlugin(useGSAP, ScrollTrigger);

// Reverting leaves a matrix on SVG elements GSAP transformed. These start without one, so a full revert removes it.
const svgMotionTargets='[data-architecture-camera],[data-registration-mark],[data-blueprint-axis],[data-construction-arc],[data-keynote],[data-node-label],[data-node-outline],[data-context-actor],.ex-money-bar';
function clearSvgTransforms(root: ParentNode | null | undefined) {
  root?.querySelectorAll<SVGElement>(svgMotionTargets).forEach(target=>{ target.removeAttribute('transform'); target.style.removeProperty('transform-origin'); });
}

// Every enhancement lives here. Baseline diagrams and all text are complete before this chunk loads.
export default function Motion({ root }: { root: RefObject<HTMLDivElement | null> }) {
  useGSAP(() => {
    const element=root.current;
    if (!element) return;
    const media=gsap.matchMedia();
    try {
      media.add({ desktop:'(min-width: 901px) and (pointer: fine)', mobile:'(max-width: 900px), (pointer: coarse)', reduce:'(prefers-reduced-motion: reduce)' },context=>{
        if (context.conditions?.reduce) return;
        const desktop=!!context.conditions?.desktop;
        const connection=(navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
        const depth=desktop&&navigator.hardwareConcurrency>4&&!connection?.saveData;
        const far=desktop?1:.6; // phones travel shorter distances
        // Entrances: each section arrives once, as it comes into view. Anything already on screen (a refresh,
        // a chapter link) is shown finished, never hidden. Masks, clips and scale do the work, not just fades.
        // Each entrance clears its own styles when it ends, so a finished section is exactly the static page.
        type Target=Element|null|undefined;
        const arrive=(trigger:Target,build:(timeline:gsap.core.Timeline)=>void,start=.86)=>{
          if(!trigger) return;
          const timeline=gsap.timeline({paused:true,defaults:{ease:'expo.out'}});
          build(timeline);
          if(trigger.getBoundingClientRect().top<innerHeight*start) timeline.progress(1);
          else ScrollTrigger.create({trigger,start:`top ${start*100}%`,once:true,onEnter:()=>timeline.play()});
        };
        const lines=(timeline:gsap.core.Timeline,within:Target,at:number)=>within?.querySelectorAll('.ex-line-inner').forEach((line,i)=>{timeline.fromTo(line,{yPercent:115},{yPercent:0,duration:1.15,clearProps:'transform'},at+i*.09);});
        const wipe=(timeline:gsap.core.Timeline,target:Target,at:number,from='inset(0% 100% 0% 0%)',duration=.85)=>{if(target) timeline.fromTo(target,{clipPath:from},{clipPath:'inset(0% 0% 0% 0%)',duration,ease:'power3.inOut',clearProps:'clipPath'},at);};
        const rise=(timeline:gsap.core.Timeline,target:Target,at:number,distance=24,duration=.95)=>{if(target) timeline.fromTo(target,{y:distance*far,opacity:0},{y:0,opacity:1,duration,clearProps:'transform,opacity'},at);};
        const draw=(timeline:gsap.core.Timeline,target:Target,at:number,duration=1)=>{if(target) timeline.fromTo(target,{scaleX:0,transformOrigin:'left center'},{scaleX:1,duration,clearProps:'transform,transformOrigin'},at);};
        // Opening: the city opens out, the title rises line by line, then the proposition settles.
        // Each element has one animation per property, so stopping motion always restores it exactly.
        const hero=element.querySelector('.ex-hero');
        if(hero){
          const opening=gsap.timeline({defaults:{ease:'expo.out'}});
          const frame=hero.querySelector('.ex-hero-image'),photo=hero.querySelector('.ex-hero-image img'),annotation=hero.querySelector('[data-hero-detail]');
          wipe(opening,frame,0,'inset(14% 12% 14% 12%)',1.5);
          wipe(opening,hero.querySelector('.ex-kicker'),.3);
          lines(opening,hero.querySelector('h1'),.35);
          draw(opening,hero.querySelector('.ex-hero-rule'),.8,1.1);
          rise(opening,hero.querySelector('.ex-proposition'),.8);
          rise(opening,hero.querySelector('.ex-hero-invitation'),1,16);
          wipe(opening,annotation,1.1,'inset(0% 100% 0% 0%)',1);
          if(depth&&frame) opening.fromTo(frame,{scale:1.14},{scale:1,duration:2.2,clearProps:'transform'},0);
          // Resuming further down the page: the opening is already over.
          if(hero.getBoundingClientRect().bottom<=0) opening.progress(1);
          if(depth){
            // Leaving: the city closes in and drifts while the title lifts away more quickly. Only the picture
            // moves, so its caption and credit stay where they are.
            const leaving={trigger:hero,start:'top top',end:'bottom top',scrub:true};
            if(photo) gsap.fromTo(photo,{scale:1,yPercent:0},{scale:1.1,yPercent:5,ease:'none',scrollTrigger:leaving});
            gsap.fromTo(hero.querySelector('.ex-hero-opening'),{y:0},{y:-110,ease:'none',scrollTrigger:leaving});
            if(annotation) gsap.fromTo(annotation,{y:12},{y:-40,ease:'none',scrollTrigger:leaving});
          }
        }
        // Section headings: the kicker is wiped in, each title line rises out of its mask, the lede follows.
        element.querySelectorAll('.ex-scene .ex-scene-heading').forEach(heading=>arrive(heading,timeline=>{
          wipe(timeline,heading.querySelector('.ex-kicker'),0);
          lines(timeline,heading.querySelector('h2'),.08);
          rise(timeline,heading.querySelector('.ex-basis'),.4,12);
          rise(timeline,heading.parentElement?.querySelector(':scope > .ex-lede'),.35,28);
        }));
        // Photographs open like a curtain while the picture settles from a slight zoom; the caption follows.
        element.querySelectorAll('.ex-reference-image:not(.ex-hero-image)').forEach(figure=>arrive(figure,timeline=>{
          wipe(timeline,figure,0,'inset(100% 0% 0% 0%)',1.25);
          const photo=figure.querySelector('img');
          if(photo) timeline.fromTo(photo,{scale:1.24},{scale:1,duration:1.9,clearProps:'transform'},0);
          rise(timeline,figure.querySelector('figcaption'),.8,14);
        },.92));
        // Problems: each question is revealed, then its line is drawn under it.
        element.querySelectorAll('.ex-problem-copy').forEach(copy=>arrive(copy,timeline=>{
          wipe(timeline,copy.querySelector('.ex-kicker'),0);
          const title=copy.querySelector('h3');
          if(title) timeline.fromTo(title,{clipPath:'inset(0% 0% 100% 0%)',y:34*far},{clipPath:'inset(0% 0% 0% 0%)',y:0,duration:1.15,clearProps:'clipPath,transform'},.1);
          rise(timeline,copy.querySelector('p:not(.ex-kicker)'),.4,20);
          draw(timeline,copy.querySelector('.ex-question-line'),.6);
        }));
        // Story handoffs: the next chapter is announced as the line draws.
        element.querySelectorAll('[data-handoff]').forEach(handoff=>arrive(handoff,timeline=>{
          handoff.querySelectorAll('.ex-mono').forEach((label,i)=>{timeline.fromTo(label,{x:-18,opacity:0},{x:0,opacity:1,duration:.8,clearProps:'transform,opacity'},i*.15);});
          rise(timeline,handoff.querySelector('p'),.2,14);
        },.95));
        element.querySelectorAll('[data-handoff]').forEach(target=>{
          gsap.fromTo(target.querySelector('.ex-handoff-line'),{scaleX:.25},{scaleX:1,ease:'none',scrollTrigger:{trigger:target,start:'top 95%',end:'top 68%',scrub:true}});
        });
        // The context map's participants arrive one by one; on phones, the reading sequence does.
        arrive(element.querySelector('.ex-context-composition'),timeline=>{
          element.querySelectorAll('[data-context-actor]').forEach((actor,i)=>{timeline.fromTo(actor,{scale:.82,opacity:0,transformOrigin:'50% 50%'},{scale:1,opacity:1,duration:.9,clearProps:'transform,opacity,transformOrigin'},.3+i*.12);});
        });
        element.querySelectorAll('[data-context-note]').forEach((note,i)=>arrive(note,timeline=>{timeline.fromTo(note,{x:-24*far,opacity:0},{x:0,opacity:1,duration:.9,clearProps:'transform,opacity'},(i%2)*.05);},.92));
        // The order journey: steps arrive in order, each number stamped in after its card.
        arrive(element.querySelector('[data-flow]'),timeline=>{
          element.querySelectorAll('[data-flow-step]').forEach((step,i)=>{
            rise(timeline,step,i*.13,46);
            const number=step.querySelector('.ex-flow-number');
            if(number) timeline.fromTo(number,{scale:.3,opacity:0},{scale:1,opacity:1,duration:.7,ease:'back.out(2)',clearProps:'transform,opacity'},i*.13+.3);
          });
        },.8);
        // Money: each ledger slides open from the left; the chart's bars grow out from zero.
        element.querySelectorAll('[data-money-stage]').forEach(stage=>arrive(stage,timeline=>{
          wipe(timeline,stage,0,'inset(0% 100% 0% 0%)',1.1);
          rise(timeline,stage,0,20,1.1);
          stage.querySelectorAll('.ex-money-bar').forEach((bar,i)=>{timeline.fromTo(bar,{scaleX:0,svgOrigin:'365 0'},{scaleX:1,svgOrigin:'365 0',duration:1.1,clearProps:'transform'},.35+i*.1);});
        },.9));
        // Where the money goes: the streams draw out from the customer's payment, the destinations take
        // their share, and one highlight runs along each stream once.
        const split=element.querySelector('[data-money-split]');
        arrive(split,timeline=>{
          if(!split) return;
          wipe(timeline,split.querySelector('svg'),0,'inset(0% 100% 0% 0%)',1.5);
          const source=split.querySelector('[data-split-source]');
          if(source) timeline.fromTo(source,{scaleY:0,transformOrigin:'50% 0%'},{scaleY:1,duration:.9,clearProps:'transform,transformOrigin'},0);
          split.querySelectorAll('[data-split-target]').forEach((bar,i)=>{timeline.fromTo(bar,{scaleX:0,transformOrigin:'0% 50%'},{scaleX:1,duration:.8,clearProps:'transform,transformOrigin'},.9+i*.12);});
          split.querySelectorAll('[data-split-label]').forEach((label,i)=>wipe(timeline,label,1+i*.12,'inset(0% 100% 0% 0%)',.9));
          split.querySelectorAll<SVGPathElement>('[data-split-pulse]').forEach((pulse,i)=>{
            const length=()=>{const m=pulse.getScreenCTM();return pulse.getTotalLength()*(m?Math.hypot(m.a,m.b):1);};
            timeline.fromTo(pulse,{strokeDasharray:()=>`46 ${length()}`,strokeDashoffset:46,opacity:1},{strokeDashoffset:()=>-length(),opacity:0,duration:1.4,ease:'power2.inOut',clearProps:'strokeDasharray,strokeDashoffset,opacity'},1.2+i*.15);
          });
        });
        // The next step: what is known and unknown, then one task card assembled piece by piece.
        arrive(element.querySelector('.ex-action-reflection'),timeline=>{
          element.querySelectorAll('.ex-action-reflection>div').forEach((column,i)=>rise(timeline,column,i*.15,30));
        });
        arrive(element.querySelector('.ex-action-body'),timeline=>{
          rise(timeline,element.querySelector('.ex-action-lead .ex-lede'),0,28);
          const card=element.querySelector('.ex-next-action');
          wipe(timeline,card,.15,'inset(0% 100% 0% 0%)',1.2);
          rise(timeline,card?.querySelector('h3'),.35,26);
          rise(timeline,card?.querySelector('.ex-task-control, .ex-preview-action'),.6,18);
        });
        // Context: a photographic environment becomes a set of proposed relationships.
        const setting=element.querySelector('[data-context-stage]');
        if (setting&&desktop) {
          const diagram=setting.querySelector('.ex-context-composition');
          const timeline=gsap.timeline({scrollTrigger:{trigger:diagram,start:'top 83%',end:'bottom 64%',scrub:true}});
          setting.querySelectorAll<SVGPathElement>('[data-context-line]').forEach((line,i)=>{
            const length=line.getTotalLength();
            timeline.fromTo(line,{strokeDasharray:length,strokeDashoffset:length},{strokeDashoffset:0,duration:.55,ease:'none'},i*.24);
          });
        } else if(setting) {
          // The narrow layout replaces the map with a reading sequence. Draw its connectors in view.
          setting.querySelectorAll('[data-context-note]').forEach(target=>{
            gsap.fromTo(target,{'--ex-context-progress':0},{'--ex-context-progress':1,ease:'none',scrollTrigger:{trigger:target,start:'top 82%',end:'bottom 58%',scrub:true}});
          });
        }
        // Flow: the travelling line and sequential symbols explain the order of responsibility.
        const flow=element.querySelector('[data-flow]');
        if (flow&&desktop) {
          const timeline=gsap.timeline({scrollTrigger:{trigger:flow,start:'top 86%',end:'bottom 60%',scrub:true,invalidateOnRefresh:true}});
          timeline.fromTo(flow.querySelectorAll('.ex-flow-symbol'),{y:22,opacity:.48},{y:0,opacity:1,duration:.65,stagger:.28,ease:'none'},0);
          const line=flow.querySelector<SVGPathElement>('[data-flow-line]');
          if(line&&desktop){const length=line.getTotalLength();timeline.fromTo(line,{strokeDasharray:length,strokeDashoffset:length},{strokeDashoffset:0,duration:1.77,ease:'none'},0);}
          // One order rides the tip of the line. Its status changes as it reaches each responsibility,
          // and each stage's number fills in as the order passes it.
          const token=flow.querySelector('[data-flow-token]'),track=flow.querySelector('.ex-flow-track');
          if(token&&track){
            const travel=1.77,states=[...token.querySelectorAll('[data-flow-state]')],numbers=[...flow.querySelectorAll('.ex-flow-number')],last=Math.max(1,states.length-1);
            gsap.set(token,{display:'block'});
            timeline.fromTo(token,{x:0},{x:()=>track.getBoundingClientRect().width,duration:travel,ease:'none'},0);
            states.forEach((state,i)=>{
              if(i===0) return;
              const at=travel*i/last;
              timeline.fromTo(states[i-1],{opacity:1,yPercent:0},{opacity:0,yPercent:-70,duration:.07,ease:'none',immediateRender:false},at-.07);
              timeline.fromTo(state,{opacity:0,yPercent:70},{opacity:1,yPercent:0,duration:.07,ease:'none'},at);
            });
            numbers.forEach((number,i)=>{timeline.fromTo(number,{backgroundColor:'#f8f6f0',color:'#16272d'},{backgroundColor:'#41654f',color:'#ffffff',duration:.05,ease:'none'},Math.max(0,travel*i/last-.05));});
          }
        } else if(flow) {
          flow.querySelectorAll('[data-flow-step]').forEach(target=>{
            const timeline=gsap.timeline({scrollTrigger:{trigger:target,start:'top 85%',end:'bottom 55%',scrub:true}});
            timeline.fromTo(target.querySelector('.ex-flow-symbol'),{y:16,opacity:.45},{y:0,opacity:1,duration:.4,ease:'none'},0);
            timeline.fromTo(target,{'--ex-flow-progress':0},{'--ex-flow-progress':1,duration:.6,ease:'none'},.4);
          });
        }
      });
      // Architecture owns one scroll clock. The system resolves exactly 0.12 later in that clock.
      media.add({ board:'(min-width: 901px) and (min-height: 900px), (min-width: 680px) and (max-width: 900px) and (min-height: 980px)', wide:'(min-width: 680px)', stacked:'(max-width: 679px)', reduce:'(prefers-reduced-motion: reduce)' },context=>{
        const architecture=element.querySelector<HTMLElement>('[data-architecture]');
        if(!architecture||context.conditions?.reduce) return;
        const sequence=architecture.querySelector<HTMLElement>('[data-architecture-sequence]')!;
        const board=architecture.querySelector<HTMLElement>('[data-architecture-board]')!;
        const drawing=architecture.querySelector<SVGSVGElement>('.ex-diagram-wide')!;
        const kinds=['goods','order','payment','coordination'];
        const all=<T extends Element>(selector:string,within:ParentNode=architecture)=>[...within.querySelectorAll<T>(selector)];
        // Dash lengths in screen space, so a line is drawn at the same pace however large the SVG is shown.
        const drawPaths=(timeline:gsap.core.Timeline,lines:SVGGeometryElement[],at:number,duration:number,stagger=0)=>{
          lines.forEach((line,i)=>{
            const length=()=>{
              const units=line.getTotalLength();
              // Non-scaling strokes also measure dashes in screen space. These SVGs scale uniformly.
              const matrix=getComputedStyle(line).vectorEffect==='non-scaling-stroke'?line.getScreenCTM():null;
              return units*(matrix?Math.hypot(matrix.a,matrix.b):1);
            };
            timeline.fromTo(line,{strokeDasharray:length,strokeDashoffset:length},{strokeDashoffset:0,duration,ease:'none'},at+i*stagger);
          });
        };
        const draw=(timeline:gsap.core.Timeline,selector:string,at:number,duration:number)=>drawPaths(timeline,all<SVGGeometryElement>(selector),at,duration);
        const rule=(timeline:gsap.core.Timeline,side:string,kind:string,at:number,duration:number)=>{
          timeline.fromTo(architecture.querySelector(`[data-${side}-progress="${kind}"]`),{scaleX:0},{scaleX:1,duration,ease:'none'},at);
        };
        const resolve=(timeline:gsap.core.Timeline,kind:string,at:number,duration:number)=>{
          timeline.fromTo(architecture.querySelectorAll(`[data-system-connection="${kind}"] .ex-system-arrow`),{scaleX:.2,opacity:.35},{scaleX:1,opacity:1,duration,ease:'none'},at);
        };
        // The drawing is produced, not faded in: the sheet unrolls, construction lines and registration marks are set
        // out, then each role is outlined, filled and labelled. Positions are fractions of the given span.
        // One tween per element (not a stagger), so every element shows its starting state before its turn.
        const each=(timeline:gsap.core.Timeline,targets:Element[],from:gsap.TweenVars,to:gsap.TweenVars,at:number,duration:number,stagger=0)=>{
          targets.forEach((target,i)=>timeline.fromTo(target,from,{...to,duration,ease:'none'},at+i*stagger));
        };
        const draft=(timeline:gsap.core.Timeline,at:number,span:number)=>{
          const t=(f:number)=>at+span*f;
          timeline.fromTo(drawing.querySelector('[data-blueprint-sheet]'),{clipPath:'inset(0% 100% 0% 0%)'},{clipPath:'inset(0% 0% 0% 0%)',duration:span*.45,ease:'none'},t(0));
          drawPaths(timeline,all<SVGGeometryElement>('[data-construction-line]',drawing),t(.05),span*.4,span*.1);
          each(timeline,all('[data-construction-arc]',drawing),{scale:.72,opacity:0,transformOrigin:'50% 50%'},{scale:1,opacity:1},t(.22),span*.3,span*.06);
          each(timeline,all('[data-registration-mark]',drawing),{scale:1.8,opacity:0,transformOrigin:'50% 50%'},{scale:1,opacity:1},t(.14),span*.16,span*.04);
          each(timeline,all('[data-blueprint-axis]',drawing),{y:-14,opacity:0},{y:0,opacity:1},t(.2),span*.2,span*.05);
          drawPaths(timeline,all<SVGGeometryElement>('[data-node-outline=""]',drawing),t(.4),span*.28,span*.03);
          each(timeline,all('[data-node-outline="optional"]',drawing),{scale:.94,strokeOpacity:0,transformOrigin:'50% 50%'},{scale:1,strokeOpacity:1},t(.5),span*.25);
          drawPaths(timeline,all<SVGGeometryElement>('[data-node-line]',drawing),t(.56),span*.22,span*.012);
          each(timeline,all('.ex-node rect',drawing),{fillOpacity:0},{fillOpacity:1},t(.62),span*.25);
          each(timeline,all('[data-node-label]',drawing),{y:8,opacity:0},{y:0,opacity:1},t(.66),span*.14,span*.006);
          // Faint relationship baselines are pencilled in last, ready for each layer to ink its own.
          each(timeline,all('.ex-connection',drawing),{opacity:0},{opacity:.5},t(.82),span*.18);
        };
        // Each layer's keynote lands as its line passes the midpoint.
        const keynote=(timeline:gsap.core.Timeline,kind:string,at:number,duration:number)=>{
          const note=drawing.querySelector(`[data-keynote="${kind}"]`);
          if(note) timeline.fromTo(note,{scale:.3,opacity:0,transformOrigin:'50% 50%'},{scale:1,opacity:1,duration,ease:'none'},at);
        };
        // A proposed-system layer starts as a tilted plane, apart in depth, and locks into the assembly.
        const plane={boxShadow:'rgba(170,186,166,0) 16px 16px 0px 0px, rgba(20,44,34,0.3) 0px 30px 34px -18px'},seated={boxShadow:'rgba(170,186,166,1) 5px 5px 0px 0px, rgba(20,44,34,0.55) 0px 14px 24px -18px'};
        const assemble=(timeline:gsap.core.Timeline,kind:string,at:number,duration:number,tilt:number,spread:number)=>{
          const layer=architecture.querySelector(`[data-system-layer="${kind}"]`)!;
          timeline.fromTo(layer,{rotationX:tilt,y:spread,z:-70,scale:.96,transformOrigin:'50% 0%',...plane},{rotationX:0,y:0,z:0,scale:1,...seated,duration,ease:'none'},at);
          const joint=layer.querySelector('[data-layer-joint]');
          if(joint) timeline.fromTo(joint,{scaleY:0},{scaleY:1,duration:duration*.4,ease:'none'},at+duration*.6);
          const count=layer.querySelector('[data-system-count]');
          if(count) timeline.fromTo(count,{x:10,opacity:0},{x:0,opacity:1,duration:duration*.35,ease:'none'},at+duration*.65);
        };
        if(context.conditions?.wide){
          const held=!!context.conditions.board;
          architecture.dataset.constructionMotion=held?'dual':'dual-flow';
          const timeline=gsap.timeline({scrollTrigger:{
            id:'explore-architecture',trigger:held?sequence:architecture.querySelector('.ex-architecture-panels'),
            start:held?()=>`top ${parseFloat(getComputedStyle(architecture).getPropertyValue('--ex-board-top'))}px`:'top 78%',
            end:held?()=>`+=${Math.max(1,sequence.offsetHeight-board.offsetHeight)}`:'bottom 42%',
            scrub:true,invalidateOnRefresh:true,
          }});
          // 0–12%: the blueprint is drafted, the perspective grid rises behind the proposed system.
          draft(timeline,0,.12);
          timeline.fromTo(architecture.querySelector('[data-system-perspective]'),{clipPath:'inset(100% 0% 0% 0%)'},{clipPath:'inset(0% 0% 0% 0%)',duration:.12,ease:'none'},.02);
          timeline.fromTo(architecture.querySelector('[data-system-perspective]'),{y:18},{y:-8,duration:.93,ease:'none'},.02);
          // A slow camera pull-back across the whole construction, settling as the system completes.
          timeline.fromTo(drawing.querySelector('[data-architecture-camera]'),{scale:1.075,x:-18,y:12,svgOrigin:'620 400'},{scale:1,x:0,y:0,svgOrigin:'620 400',duration:.95,ease:'none'},0);
          kinds.forEach((kind,i)=>{
            const left=.12+i*.18,right=left+.12,duration=.17;
            draw(timeline,`[data-architecture-line="${kind}"]`,left,duration);
            keynote(timeline,kind,left+duration*.45,duration*.3);
            draw(timeline,`[data-system-line="${kind}"]`,right,duration);
            rule(timeline,'blueprint',kind,left,duration);rule(timeline,'system',kind,right,duration);
            resolve(timeline,kind,right,duration);
            assemble(timeline,kind,right,duration,28,i*9);
          });
          // The last five percent holds the completed drawing before CSS sticky releases.
          timeline.to({}, {duration:.05}, .95);
        } else if(context.conditions?.stacked){
          architecture.dataset.constructionMotion='stacked';
          // On phones the drawing is drafted as it rises into view, then its relationships draw while it is read.
          draft(gsap.timeline({scrollTrigger:{id:'explore-architecture-draft',trigger:drawing,start:'top bottom',end:'top 82%',scrub:true,invalidateOnRefresh:true}}),0,1);
          const blueprint=gsap.timeline({scrollTrigger:{id:'explore-architecture-blueprint',trigger:architecture.querySelector('.ex-diagram-wide'),start:'top 82%',end:'top 25%',scrub:true,invalidateOnRefresh:true}});
          kinds.forEach((kind,i)=>{
            draw(blueprint,`[data-architecture-line="${kind}"]`,i*.2,.2);
            keynote(blueprint,kind,i*.2+.09,.06);
            rule(blueprint,'blueprint',kind,i*.2,.2);
            const system=gsap.timeline({scrollTrigger:{id:`explore-architecture-${kind}`,trigger:architecture.querySelector(`[data-system-layer="${kind}"]`),start:'top 90%',end:'top 65%',scrub:true}});
            draw(system,`[data-system-line="${kind}"]`,0,1);rule(system,'system',kind,0,1);
            resolve(system,kind,0,1);
            assemble(system,kind,0,.7,12,18);
          });
        }
        return ()=>{delete architecture.dataset.constructionMotion;clearSvgTransforms(architecture);};
      });
      element.setAttribute('data-motion-ready','true');
    } catch {
      media.revert();
      // A setup exception can happen before matchMedia receives its cleanup callback.
      element.querySelector('[data-architecture]')?.removeAttribute('data-construction-motion');
      clearSvgTransforms(element);
    }
    return ()=>{media.revert();clearSvgTransforms(element);element.removeAttribute('data-motion-ready');};
  },{scope:root});
  return null;
}
