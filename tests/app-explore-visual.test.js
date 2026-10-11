// Synthetic visual QA at requested widths. Images are written outside the repo and never include real user data.
const T=require('./cdp.js'),fs=require('fs'),path=require('path');
const {ev,send,sleep,check,click}=T,OUT='/tmp/myday-explore-phase2';fs.mkdirSync(OUT,{recursive:true});
const go=async()=>{T.setUrl('app/dist/index.html#projects/p/pjVisual/explore');await T.openAt(2026,10,6,9);await sleep(400);};
const capture=async name=>fs.writeFileSync(path.join(OUT,name+'.png'),Buffer.from((await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false})).data,'base64'));
const move=async selector=>{await ev(`window.scrollTo({top:document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect().top+scrollY-document.querySelector('.ex-topbar').getBoundingClientRect().height-16,behavior:'instant'})`);await sleep(260);};
(async()=>{
 await T.connect();await go();await ev('localStorage.clear()');await go();
 await ev(`(()=>{const d=JSON.parse(localStorage.getItem('myday.data.v4'));d.settings.motion='auto';d.projects.items=[{id:'pjVisual',title:'Hargeisa Marketplace',summary:'A local marketplace concept.',stage:'capture',status:'active',nextTaskId:null,commitmentIds:[],createdAt:'2026-10-06T09:00',updatedAt:'2026-10-06T09:00'}];localStorage.setItem('myday.data.v4',JSON.stringify(d));})()`);await go();
 const original=await ev(`localStorage.getItem('myday.data.v4')`);
 for(const width of [390,768,1440]){
   await send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<900});await sleep(200);
   for(const scene of ['hero','context','problem','flow','architecture','economics','action']){
     await move('#ex-'+scene);await capture(scene+'-'+width);
     check(scene+' fits at '+width,await ev('document.documentElement.scrollWidth===innerWidth'));
     if(scene==='context') {await move('.ex-context-composition');await capture('context-detail-'+width);}
     if(scene==='problem') {await move('.ex-problems>li');await capture('problem-detail-'+width);}
     if(scene==='architecture') {await move('[data-architecture]');await capture('architecture-detail-'+width);}
     if(scene==='economics') {await move('.ex-platform-ledger');await capture('economics-detail-'+width);}
     if(scene==='action') {await move('.ex-next-action');await capture('action-detail-'+width);}
   }
   check('images decode with reserved dimensions at '+width,await ev(`[...document.querySelectorAll('[data-asset] img')].every(i=>i.naturalWidth===Number(i.getAttribute('width'))&&i.naturalHeight===Number(i.getAttribute('height'))&&i.alt.length>20)`));
   check('every photo credits its author, its own page and its licence at '+width,await ev(`[...document.querySelectorAll('[data-asset]')].every(f=>f.querySelector('.ex-credit a[href^="https://commons.wikimedia.org/wiki/File:"],.ex-credit a[href^="https://www.pexels.com/photo/"]')&&f.querySelector('.ex-credit a[href^="https://creativecommons.org/"],.ex-credit a[href="https://www.pexels.com/license/"]'))`));
   check('photo credit links are not covered by other layers at '+width,await ev(`(async()=>{for(const a of document.querySelectorAll('.ex-credit a')){a.scrollIntoView({block:'center'});const f=a.closest('[data-asset]');for(let t=0;t<30&&!/^(none|inset\(0(%|px)?\))$/.test(getComputedStyle(f).clipPath);t++)await new Promise(r=>setTimeout(r,100));await new Promise(r=>setTimeout(r,120));if(![...a.getClientRects()].some(r=>{const hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return hit===a||a.contains(hit);}))return false;}return true;})()`));
   check('primary controls have touch targets at '+width,await ev(`[...document.querySelectorAll('.ex-primary-button,.ex-motion-toggle,.ex-chapter-picker select')].every(e=>e.getBoundingClientRect().height>=44)`));
 }
 check('four architecture layers have relationships',await ev(`document.querySelectorAll('[data-layer-note]').length===4&&[...document.querySelectorAll('[data-layer-note]')].every(el=>el.querySelectorAll('li').length>0)`));
 check('dark-scene headings have readable contrast',await ev(`(()=>{
   const luminance=rgb=>rgb.slice(0,3).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
   const rgb=value=>value.match(/[\\d.]+/g).map(Number);
   return [...document.querySelectorAll('.ex-layer-note h3,.ex-platform-ledger h3')].every(el=>{
     const fg=luminance(rgb(getComputedStyle(el).color));let ancestor=el,bg;
     while(ancestor){const c=rgb(getComputedStyle(ancestor).backgroundColor);if(c.length===3||c[3]===1){bg=luminance(c);break}ancestor=ancestor.parentElement}
     return bg!==undefined&&(Math.max(fg,bg)+.05)/(Math.min(fg,bg)+.05)>=4.5;
   });
 })()`));
 check('all photos use local sources',await ev(`[...document.querySelectorAll('[data-asset] img')].every(i=>new URL(i.src).origin===location.origin)`));
 await sleep(2200);
 check('played entrances leave every section exactly as the static page',await ev(`[...document.querySelectorAll('.ex-line-inner,.ex-reference-image:not(.ex-hero-image),.ex-reference-image:not(.ex-hero-image) img,.ex-problem-copy h3,.ex-problem-copy p,[data-money-stage],.ex-next-action,[data-flow-step],.ex-flow-number,.ex-lede')].every(e=>!e.style.clipPath&&!e.style.transform&&!e.style.opacity)`));
 await go();for(let i=0;i<30&&!(await ev(`!!document.querySelector('[data-motion-ready]')`));i++)await sleep(100);await sleep(300);
 check('an off-screen section waits for its entrance',await ev(`!!document.querySelector('#ex-economics .ex-line-inner').style.transform&&!!document.querySelector('[data-asset="cash-handover"]').style.clipPath`));
 check('content already on screen is never left hidden',await ev(`getComputedStyle(document.querySelector('#explore-title')).opacity==='1'&&!document.querySelector('#ex-hero .ex-kicker')?.style.opacity`));
 await move('#ex-economics');await sleep(1900);
 check('the section arrives once it is reached',await ev(`!document.querySelector('#ex-economics .ex-line-inner').style.transform&&!document.querySelector('#ex-economics .ex-lede').style.opacity`));
 check('only opening image loads eagerly',await ev(`document.querySelectorAll('[data-asset] img[loading=eager]').length===1&&document.querySelectorAll('[data-asset] img[loading=lazy]').length===5`));
 await move('#ex-architecture');await click('.ex-motion-toggle');await sleep(150);await capture('architecture-paused-1440');
 check('pause supplies a complete textual architecture',await ev(`getComputedStyle(document.querySelector('.ex-diagram-mobile')).display!=='none'&&!document.querySelector('[data-motion-ready]')`));
 await click('.ex-motion-toggle');await sleep(200);
 await ev(`Object.defineProperty(navigator,'hardwareConcurrency',{value:2,configurable:true})`);
 await click('.ex-motion-toggle');await click('.ex-motion-toggle');await sleep(200);
 check('low reported hardware capacity disables image parallax',await ev(`!!document.querySelector('[data-motion-ready]')&&!document.querySelector('.ex-hero-image img').style.transform&&!document.querySelector('.ex-hero-image').style.transform`));
 await ev(`Object.defineProperty(navigator,'hardwareConcurrency',{value:8,configurable:true});Object.defineProperty(navigator,'connection',{value:{saveData:true},configurable:true})`);
 await click('.ex-motion-toggle');await click('.ex-motion-toggle');await sleep(200);
 check('Save-Data disables image parallax',await ev(`!!document.querySelector('[data-motion-ready]')&&!document.querySelector('.ex-hero-image img').style.transform&&!document.querySelector('.ex-hero-image').style.transform`));
 await ev(`delete navigator.hardwareConcurrency;delete navigator.connection`);
 await click('.ex-motion-toggle');await click('.ex-motion-toggle');await sleep(200);
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await sleep(150);await capture('architecture-reduced-1440');
 check('reduced motion has no animated transforms',await ev(`[...document.querySelectorAll('[data-hero-entrance],[data-reveal],[data-money-stage]')].every(el=>!el.style.transform)`));
 check('reduced motion hides nothing behind an entrance',await ev(`[...document.querySelectorAll('.ex-line-inner,.ex-reference-image:not(.ex-hero-image),.ex-reference-image:not(.ex-hero-image) img,.ex-problem-copy h3,.ex-problem-copy p,[data-money-stage],.ex-next-action,[data-flow-step],.ex-flow-number,.ex-lede')].every(e=>!e.style.clipPath&&!e.style.transform&&!e.style.opacity)`));
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:1000,deviceScaleFactor:1,mobile:true});await move('#ex-hero');await capture('hero-reduced-390');
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});await sleep(150);
 for(let i=0;i<4;i++){await click('[data-action=explore-exit]');await sleep(180);await click('[data-action=project-explore]');await sleep(250);}
 check('repeated entry has one renderer and one chapter rail',await ev(`document.querySelectorAll('.explore').length===1&&document.querySelectorAll('.ex-chapter-rail').length===1&&document.querySelectorAll('[data-scene]').length===7`));
 await ev('navigator.serviceWorker.ready');await send('Page.reload');await sleep(650);
 await send('Network.enable');await send('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0});await send('Page.reload');await sleep(800);
 for(const selector of ['.ex-hero','.ex-context-composition','.ex-problem-image','.ex-problems li:nth-child(2)','.ex-problems li:nth-child(3)','.ex-action-photo'])await move(selector);
 check('all six photographs render after offline refresh',await ev(`[...document.querySelectorAll('[data-asset] img')].length===6&&[...document.querySelectorAll('[data-asset] img')].every(i=>i.complete&&i.naturalWidth>0)`));
 await move('#ex-context');await capture('context-offline-390');await move('#ex-action');await capture('action-offline-390');
 await send('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});await go();for(let i=0;i<30&&!(await ev(`!!document.querySelector('[data-motion-ready]')`));i++)await sleep(100);
 const split=()=>ev(`[...document.querySelectorAll('[data-split-label] strong')].map(e=>e.textContent).join(' ')`);
 check('the money split names every destination of the customer payment',await split()==='$36.00 $4.00 $3.00');
 check('the money split is drawn to scale',await ev(`(()=>{const h=[...document.querySelectorAll('[data-split-target]')].map(r=>+r.getAttribute('height'));return Math.abs(h[0]/h[1]-9)<.01&&Math.abs(h[1]/h[2]-4/3)<.01})()`));
 await ev(`(()=>{const s=document.querySelector('#ex-takeRate'),set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;set.call(s,'20');s.dispatchEvent(new Event('input',{bubbles:true}));s.dispatchEvent(new Event('change',{bubbles:true}))})()`);await sleep(150);
 check('the money split follows a changed assumption',await split()==='$32.00 $8.00 $3.00');
 await click('.ex-assumptions .ex-text-button');await sleep(150);
 const order=()=>ev(`(()=>{const t=document.querySelector('[data-flow-token]');return getComputedStyle(t).display+'|'+[...t.querySelectorAll('[data-flow-state]')].filter(e=>getComputedStyle(e).opacity==='1').map(e=>e.textContent).join(',')})()`);
 await ev(`scrollTo({top:document.querySelector('[data-flow]').getBoundingClientRect().top+scrollY-innerHeight*.8,behavior:'instant'})`);await sleep(300);
 check('one order sets out on the journey',await order()==='block|Order placed');
 await ev(`scrollTo({top:document.querySelector('[data-flow]').getBoundingClientRect().bottom+scrollY-innerHeight*.5,behavior:'instant'})`);await sleep(300);
 check('the order reaches the customer by the end of the journey',await order()==='block|Delivered'&&await ev(`[...document.querySelectorAll('.ex-flow-number')].every(n=>getComputedStyle(n).backgroundColor==='rgb(65, 101, 79)')`));
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await sleep(250);
 check('without motion the travelling order is not shown',(await order()).startsWith('none|')&&await split()==='$36.00 $4.00 $3.00');
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});await sleep(150);
 check('visual review never changes stored data',original===await ev(`localStorage.getItem('myday.data.v4')`));
 await send('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});
 const ROOT=process.env.MYDAY_ROOT||path.resolve(__dirname,'..'),dir=path.join(ROOT,'app/dist/assets');
 const chunk=fs.readdirSync(dir).find(f=>/^ExploreScreen-.*\.js$/.test(f)),motion=fs.readdirSync(dir).find(f=>/^Motion-.*\.js$/.test(f));
 check('Explore JS stays below 160 KB',fs.statSync(path.join(dir,chunk)).size<160000);check('motion chunk stays below 130 KB',fs.statSync(path.join(dir,motion)).size<130000);
 const s=T.summary();console.log(`\n${s.pass} passed, ${s.fail} failed`);process.exit(s.fail?1:0);
})().catch(e=>{console.error('HARNESS',e);process.exit(1)});
