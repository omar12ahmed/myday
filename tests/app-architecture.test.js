// Architecture construction checks use the runner's disposable profile and synthetic project records only.
const T=require('./cdp.js'),fs=require('fs'),path=require('path');
const {ev,send,sleep,check,click}=T,OUT='/tmp/myday-architecture-review';fs.mkdirSync(OUT,{recursive:true});
const go=async id=>{T.setUrl('app/dist/index.html#projects/p/'+id+'/explore');await T.openAt(2026,10,6,9);await sleep(450)};
const capture=async name=>fs.writeFileSync(path.join(OUT,name+'.png'),Buffer.from((await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false})).data,'base64'));
const progress=async p=>{await ev(`(()=>{const a=document.querySelector('[data-architecture]'),s=a.querySelector('[data-architecture-sequence]'),b=a.querySelector('[data-architecture-board]');window.scrollTo({top:s.getBoundingClientRect().top+scrollY-parseFloat(getComputedStyle(a).getPropertyValue('--ex-board-top'))+${p}*(s.offsetHeight-b.offsetHeight),behavior:'instant'})})()`);await sleep(100)};
const drawn=async(side,kind)=>ev(`(()=>{const p=document.querySelector('[data-${side}-line="${kind}"]');return 1-(parseFloat(p.style.strokeDashoffset)||0)/(parseFloat(p.style.strokeDasharray)||p.getTotalLength())})()`);
const move=async s=>{await ev(`window.scrollTo({top:document.querySelector(${JSON.stringify(s)}).getBoundingClientRect().top+scrollY-document.querySelector('.ex-topbar').getBoundingClientRect().height-16,behavior:'instant'})`);await sleep(120)};
const flat=async s=>ev(`(()=>{const t=getComputedStyle(document.querySelector(${JSON.stringify(s)})).transform;return t==='none'||t==='matrix(1, 0, 0, 1, 0, 0)'||t==='matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'})()`);
const shown=async s=>ev(`[...document.querySelectorAll(${JSON.stringify(s)})].every(e=>getComputedStyle(e).opacity==='1')`);
const camera=async()=>ev(`document.querySelector('[data-architecture-camera]').transform.baseVal.consolidate()?.matrix.a??1`);
const settled=`[...document.querySelectorAll('[data-node-label],[data-architecture-camera],[data-keynote],[data-registration-mark],[data-blueprint-axis],[data-construction-arc]')].every(e=>!e.getAttribute('transform')&&!e.style.opacity)&&[...document.querySelectorAll('[data-system-layer],[data-layer-joint],[data-system-count],[data-blueprint-sheet],[data-system-perspective]')].every(e=>!e.style.transform&&!e.style.boxShadow&&!e.style.clipPath&&!e.style.opacity)`;
const complete=`document.querySelectorAll('[data-registration-mark]').length===4&&document.querySelectorAll('[data-blueprint-axis]').length===3&&document.querySelectorAll('[data-keynote]').length===4&&document.querySelectorAll('[data-layer-joint]').length===3&&[...document.querySelectorAll('[data-keynote],[data-node-label],[data-layer-joint]')].every(e=>getComputedStyle(e).opacity==='1')`;
const enter=async(s,ratio)=>{await ev(`window.scrollTo({top:document.querySelector(${JSON.stringify(s)}).getBoundingClientRect().top+scrollY-innerHeight*${ratio},behavior:'instant'})`);await sleep(150)};
(async()=>{
 await T.connect();await go('pjArch');await ev('localStorage.clear()');await go('pjArch');
 await ev(`(()=>{const d=JSON.parse(localStorage.getItem('myday.data.v4'));d.settings.motion='auto';d.projects.items=['Hargeisa Marketplace','Community garden'].map((title,i)=>({id:i?'pjOther':'pjArch',title,summary:'A proposed idea to investigate.',stage:'capture',status:'active',nextTaskId:null,commitmentIds:[],createdAt:'2026-10-06T09:00',updatedAt:'2026-10-06T09:00'}));localStorage.setItem('myday.data.v4',JSON.stringify(d))})()`);await go('pjArch');
 const original=await ev(`localStorage.getItem('myday.data.v4')`);
 for(const width of [1440,768]){
  await send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<900});await sleep(250);
  check('dual timeline mounts at '+width,await ev(`document.querySelector('[data-architecture]').dataset.constructionMotion==='dual'`));
  await progress(0);
  check('the blueprint starts as an undrafted sheet at '+width,await ev(`getComputedStyle(document.querySelector('[data-node-label]')).opacity==='0'&&getComputedStyle(document.querySelector('[data-blueprint-sheet]')).clipPath.includes('100%')`));
  check('proposed-system planes start apart in depth at '+width,!(await flat('[data-system-layer="goods"]'))&&!(await flat('[data-system-layer="coordination"]')));
  check('the camera starts slightly closer at '+width,await camera()>1.05);
  await progress(.12);
  check('roles are drafted, filled and labelled before any relationship is inked at '+width,await shown('[data-node-label]')&&await drawn('architecture','goods')<.01);
  check('a keynote waits for its line at '+width,await ev(`getComputedStyle(document.querySelector('[data-keynote="goods"]')).opacity==='0'`));
  await progress(.3);check('the keynote lands as its line passes at '+width,await shown('[data-keynote="goods"]'));
  await progress(.42);check('a plane locks in when its layer completes at '+width,await flat('[data-system-layer="goods"]')&&!(await flat('[data-system-layer="order"]')));
  await progress(1);check('every plane is assembled and the camera settled at '+width,await flat('[data-system-layer="goods"]')&&await flat('[data-system-layer="coordination"]')&&Math.abs(await camera()-1)<.001&&await shown('[data-layer-joint]'));
  for(const p of [0,.25,.5,.75,1]){await progress(p);await capture('architecture-'+width+'-'+Math.round(p*100));
   check('panels fit viewport at '+width+'/'+p,await ev(`(()=>{const b=document.querySelector('[data-architecture-board]').getBoundingClientRect();return document.documentElement.scrollWidth===innerWidth&&b.bottom<=innerHeight+2&&b.top>=document.querySelector('.ex-topbar').getBoundingClientRect().bottom})()`));
  }
  check('left and right complete at '+width,await drawn('architecture','coordination')>.999&&await drawn('system','coordination')>.999);
  let last=0,monotonic=true;for(let step=0;step<=20;step++){await progress(step/20);const current=await drawn('system','order');monotonic&&=current>=last-.001;last=current;}
  check('small forward scroll steps construct progressively at '+width,monotonic&&last>.999);
  await progress(.18);const left=await drawn('architecture','goods'),right=await drawn('system','goods');
  check('blueprint begins before system at '+width,left>.25&&left<.5&&right<.01);
  await progress(.30);check('system follows the same state 12% later at '+width,Math.abs(await drawn('system','goods')-left)<.015);
  const still=await drawn('architecture','order');await sleep(450);check('stationary scroll does not autoplay at '+width,Math.abs(await drawn('architecture','order')-still)<.001);
  await progress(.75);const y=await ev(`document.querySelector('[data-architecture-board]').getBoundingClientRect().top`);await progress(.25);
  check('sticky board stays aligned at '+width,Math.abs(await ev(`document.querySelector('[data-architecture-board]').getBoundingClientRect().top`)-y)<1);
  const backward=await drawn('architecture','goods');await progress(1);await progress(0);await progress(.25);
  check('fast forward/back restores deterministic state at '+width,Math.abs(await drawn('architecture','goods')-backward)<.001);
  await progress(1.25);check('sticky board releases naturally at '+width,await ev(`document.querySelector('[data-architecture-board]').getBoundingClientRect().top<parseFloat(getComputedStyle(document.querySelector('[data-architecture]')).getPropertyValue('--ex-board-top'))-20`));
 }
 for(const width of [1440,768]){
  await send('Emulation.setDeviceMetricsOverride',{width,height:800,deviceScaleFactor:1,mobile:width<900});await sleep(250);
  await enter('.ex-architecture-panels',.78);
  check('short viewport starts with an undrawn accent at '+width,await drawn('architecture','goods')<.01);
  await move('.ex-architecture-panels');
  check('short viewport keeps scroll animation without a sticky hold at '+width,await ev(`document.querySelector('[data-construction-motion]')?.dataset.constructionMotion==='dual-flow'&&getComputedStyle(document.querySelector('[data-architecture-board]')).position==='static'&&!!document.querySelector('[data-architecture-line]').style.strokeDashoffset`));
  check('short viewport constructs the visible drawing at '+width,await drawn('architecture','goods')>.99&&await drawn('architecture','coordination')<.01);
 }
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});await sleep(250);await progress(.5);
 check('900px desktop keeps both panels in view',await ev(`document.querySelector('[data-architecture]').dataset.constructionMotion==='dual'&&document.querySelector('[data-architecture-board]').getBoundingClientRect().bottom<=innerHeight`));
 for(const width of [662,390,320]){
  await send('Emulation.setDeviceMetricsOverride',{width,height:width===662?827:900,deviceScaleFactor:1,mobile:true});await sleep(250);
  check('phone uses stacked timeline at '+width,await ev(`document.querySelector('[data-architecture]').dataset.constructionMotion==='stacked'`));
  await move('[data-architecture-sequence]');await capture('architecture-'+width+'-beginning');
  check('drawing strokes remain visible at '+width,await ev(`getComputedStyle(document.querySelector('[data-architecture-line]')).vectorEffect==='non-scaling-stroke'`));
  check('drawing distance matches the visible path at '+width,await ev(`(()=>{const p=document.querySelector('[data-architecture-line]'),m=p.getScreenCTM();return Math.abs(parseFloat(p.style.strokeDasharray)-p.getTotalLength()*Math.hypot(m.a,m.b))<1})()`));
  check('drawing uses the available narrow-panel width at '+width,await ev(`(()=>{const b=document.querySelector('.ex-diagram-wide').getBoundingClientRect();return Math.abs(b.height-b.width*820/1240)<2})()`));
  await enter('.ex-diagram-wide',.97);
  check('phone drawing is still being drafted as it enters at '+width,await ev(`getComputedStyle(document.querySelector('[data-node-label]')).opacity==='0'`));
  await enter('.ex-diagram-wide',.82);
  check('drawing starts when its SVG enters view at '+width,await drawn('architecture','goods')<.01);
  check('phone drawing is fully drafted before its relationships draw at '+width,await shown('[data-node-label]'));
  await enter('.ex-diagram-wide',.5);check('drawing develops while its SVG is visible at '+width,await drawn('architecture','goods')>.99&&await drawn('architecture','coordination')<.01);
  await capture('architecture-'+width+'-drawing');
  await enter('.ex-diagram-wide',.18);check('drawing finishes before leaving view at '+width,await drawn('architecture','coordination')>.99&&await ev(`document.querySelector('.ex-diagram-wide').getBoundingClientRect().bottom>document.querySelector('.ex-topbar').getBoundingClientRect().bottom`));
  check('phone panels are stacked at '+width,await ev(`document.querySelector('.ex-proposed-system').getBoundingClientRect().top>=document.querySelector('.ex-blueprint').getBoundingClientRect().bottom-1`));
  await enter('[data-system-layer="order"]',.95);check('phone plane is apart before it is reached at '+width,!(await flat('[data-system-layer="order"]')));
  await enter('[data-system-layer="order"]',.5);check('phone plane locks in once reached at '+width,await flat('[data-system-layer="order"]'));
  await move('.ex-proposed-system');await capture('architecture-'+width+'-middle');await move('[data-system-layer="coordination"]');await capture('architecture-'+width+'-complete');
  check('phone relationships stay readable at '+width,await ev(`getComputedStyle(document.querySelector('[data-system-connection]')).fontSize==='15px'&&document.querySelectorAll('.ex-participant-key li').length===7&&document.documentElement.scrollWidth===innerWidth`));
  check('phone has no sticky hold at '+width,await ev(`getComputedStyle(document.querySelector('[data-architecture-board]')).position==='static'&&parseFloat(getComputedStyle(document.querySelector('[data-architecture-sequence]')).paddingBottom)===0`));
  for(const [selector,property] of [['[data-context-note]','--ex-context-progress'],['[data-flow-step]','--ex-flow-progress']]){
   await enter(selector,.86);const before=await ev(`parseFloat(getComputedStyle(document.querySelector('${selector}')).getPropertyValue('${property}'))`);
   await move(selector);const after=await ev(`parseFloat(getComputedStyle(document.querySelector('${selector}')).getPropertyValue('${property}'))`);
   check('mobile connector develops in view '+selector+' at '+width,before<.01&&after>.4);
  }
  await click('.ex-motion-toggle');await sleep(150);
  check('mobile pause restores complete connectors and arrows at '+width,await ev(`[...document.querySelectorAll('[data-context-note],[data-flow-step],.ex-system-arrow')].every(e=>!e.style.getPropertyValue('--ex-context-progress')&&!e.style.getPropertyValue('--ex-flow-progress')&&!e.style.transform&&!e.style.opacity)`));
  await click('.ex-motion-toggle');await sleep(200);
 }
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});await sleep(200);await progress(.5);
 const beforePause=await ev('scrollY');await click('.ex-motion-toggle');await sleep(200);await capture('architecture-paused');
 check('pause presents complete paths and releases transforms',await ev(`[...document.querySelectorAll('[data-architecture-line],[data-system-line],[data-system-connection]')].every(e=>!e.style.strokeDashoffset&&!e.style.transform)&&!document.querySelector('[data-construction-motion]')`));
 check('pause leaves every drafting mark and plane complete and untransformed',await ev(settled)&&await ev(complete));
 check('pause preserves reading position',Math.abs(await ev('scrollY')-beforePause)<2);
 await progress(.65);await click('.ex-motion-toggle');await sleep(200);
 check('resume follows current scroll position',await drawn('architecture','payment')>.99&&await drawn('system','payment')>.25&&await drawn('system','payment')<.35);
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await sleep(200);await capture('architecture-reduced');
 check('OS reduced motion keeps every drafting mark and assembled plane',await ev(settled)&&await ev(complete));
 check('OS reduced motion gives complete, readable final state',await ev(`!document.querySelector('[data-construction-motion]')&&[...document.querySelectorAll('[data-system-line]')].every(e=>!e.style.strokeDashoffset)&&getComputedStyle(document.querySelector('.ex-diagram-mobile')).display!=='none'`));
 check('panel text meets AA contrast in the completed state',await ev(`(()=>{
  const rgb=v=>v.match(/[\\d.]+/g).map(Number),lum=c=>c.slice(0,3).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
  return [...document.querySelectorAll('.ex-panel-heading span,.ex-panel-heading h3,.ex-panel-heading p,.ex-participant-key span,.ex-participant-key strong,.ex-system-heading h4,.ex-system-number,[data-system-connection] span,.ex-diagram-key,.ex-system-key,.ex-construction-foot')].filter(e=>!e.classList.contains('sr-only')).every(e=>{
   const fg=lum(rgb(getComputedStyle(e).color));let a=e,bg;while(a){const c=rgb(getComputedStyle(a).backgroundColor);if(c.length===3||c[3]===1){bg=lum(c);break}a=a.parentElement}
   return bg!==undefined&&(Math.max(fg,bg)+.05)/(Math.min(fg,bg)+.05)>=4.5;
  });
 })()`));
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});await sleep(200);
 await send('Page.reload');await sleep(600);await progress(.3);check('refresh restores the sequence',await ev(`document.querySelectorAll('[data-architecture-board]').length===1`)&&await drawn('system','goods')>.3);
 for(let i=0;i<3;i++){await progress(1);await progress(0);await ev(`void(window.__oldBoard=document.querySelector('[data-architecture]'))`);await click('[data-action=explore-exit]');await sleep(150);
  check('route exit reverts old animated elements '+i,await ev(`[...window.__oldBoard.querySelectorAll('[data-architecture-line],[data-system-line],[data-system-connection]')].every(el=>!el.style.strokeDashoffset&&!el.style.transform)`));
  await click('[data-action=project-explore]');await sleep(250);await progress(.3);
 }
 check('repeated navigation has one board and consistent progress',await ev(`document.querySelectorAll('[data-architecture-board]').length===1`)&&await drawn('system','goods')>.3&&await drawn('system','goods')<.4);
 await ev(`location.hash='#projects/p/pjOther/explore'`);await sleep(400);check('another project uses its existing roles without reloading',await ev(`document.querySelectorAll('.ex-node').length===4&&document.querySelector('.ex-participant-key').textContent.includes('Your idea')&&!document.querySelector('.ex-proposed-system').textContent.includes('Retailer')`));
 check('navigation and construction preserve stored data',original===await ev(`localStorage.getItem('myday.data.v4')`));
 await ev(`(()=>{const d=JSON.parse(localStorage.getItem('myday.data.v4'));d.settings.motion='off';localStorage.setItem('myday.data.v4',JSON.stringify(d))})()`);await go('pjArch');await progress(.5);await capture('architecture-app-motion-off');
 check('MyDay animations off keeps the assembled drawing set',await ev(settled)&&await ev(complete));
 check('MyDay animations off preserves both final panels',await ev(`!document.querySelector('[data-construction-motion]')&&document.querySelectorAll('.ex-architecture-panel').length===2&&[...document.querySelectorAll('[data-system-line]')].every(e=>!e.style.strokeDashoffset)`));
 await ev(`(()=>{const d=JSON.parse(localStorage.getItem('myday.data.v4'));d.settings.motion='auto';localStorage.setItem('myday.data.v4',JSON.stringify(d))})()`);await go('pjArch');await ev('navigator.serviceWorker.ready');await send('Page.reload');await sleep(600);
 await send('Network.enable');await send('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0});await send('Page.reload');await sleep(800);await progress(.5);await capture('architecture-offline');
 check('offline refresh retains dual sequence',await ev(`document.querySelector('[data-architecture]').dataset.constructionMotion==='dual'`)&&await drawn('architecture','order')>.99);
 await send('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});await send('Network.setBypassServiceWorker',{bypass:true});await send('Network.setCacheDisabled',{cacheDisabled:true});await send('Network.setBlockedURLs',{urls:['*Motion-*.js']});await go('pjArch');await move('[data-architecture-sequence]');await capture('architecture-no-animation');
 check('failed animation download leaves complete two-panel architecture',await ev(`document.querySelectorAll('.ex-architecture-panel').length===2&&!document.querySelector('[data-construction-motion]')&&[...document.querySelectorAll('[data-architecture-line],[data-system-line]')].every(e=>!e.style.strokeDashoffset)&&document.querySelectorAll('[data-layer-note]').length===4`));
 await send('Network.setBlockedURLs',{urls:[]});
 const failure=await send('Page.addScriptToEvaluateOnNewDocument',{source:`(()=>{const original=SVGPathElement.prototype.getTotalLength;SVGPathElement.prototype.getTotalLength=function(){if(this.hasAttribute('data-architecture-line'))throw new Error('Synthetic architecture setup failure');return original.call(this)}})()`});await go('pjArch');await move('[data-architecture-sequence]');
 check('animation setup failure leaves the drafted, assembled state',await ev(settled)&&await ev(complete));
 check('animation setup failure reverts partial enhancements',await ev(`!document.querySelector('[data-motion-ready]')&&!document.querySelector('[data-construction-motion]')&&document.querySelectorAll('.ex-architecture-panel').length===2&&[...document.querySelectorAll('[data-architecture-line],[data-system-line]')].every(e=>!e.style.strokeDashoffset)`));
 await send('Page.removeScriptToEvaluateOnNewDocument',{identifier:failure.identifier});
 await send('Network.setBypassServiceWorker',{bypass:false});await send('Network.setCacheDisabled',{cacheDisabled:false});await send('Emulation.clearDeviceMetricsOverride');
 const s=T.summary();console.log(`\n${s.pass} passed, ${s.fail} failed`);process.exit(s.fail?1:0);
})().catch(e=>{console.error('HARNESS',e);process.exit(1)});
