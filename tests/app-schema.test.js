// Release schema 4 -> 5 and actual previous React code, using only made-up data.
const fs=require('fs'), path=require('path');
const T=require('./cdp.js');
const {ev,click,text,exists,check,sleep}=T;
const KEY='myday.data.v4', APP='app/dist/index.html';
const data=()=>ev(`JSON.parse(localStorage.getItem('${KEY}'))`);
const raw=()=>ev(`localStorage.getItem('${KEY}')`);
const go=async(url=APP)=>{T.setUrl(url);await T.openAt(2026,11,2,10);};
(async()=>{
 await T.connect(); await go(); await ev('localStorage.clear()'); await go();
 check('new React data uses schema 5 under the same key',(await data()).schemaVersion===5);
 const original=await data();original.schemaVersion=4;
 original.projects={items:[{id:'pjSchema',title:'Synthetic schema project',summary:'Kept across versions',stage:'decide',status:'active',nextTaskId:null,commitmentIds:[],createdAt:'2026-10-20T09:00',updatedAt:'2026-10-22T09:00',future:{kept:['文','😀']},
 milestones:[{id:'msSchema',title:'A synthetic marker',aim:null,reachedOn:null,createdAt:'2026-10-20T09:00'}],
 decisions:[{id:'dcSchema',question:'Which chair?',options:[{id:'opSchema',text:'Wooden chair',pros:[],cons:[]}],chosen:null,why:'Kept reason',decidedOn:null,createdAt:'2026-10-20T09:00',updatedAt:'2026-10-22T09:00',lastChoice:{text:'Old chair',on:'2026-10-22',future:{kept:true}},history:[{id:'dhSchema',text:'Old chair',on:'2026-10-22',why:'First line\nSecond line 文 😀',future:{kept:true}},{id:'dhBlank',text:'Another chair',on:'2026-10-22',why:null}]}]}]};
 await ev(`localStorage.setItem('${KEY}',${JSON.stringify(JSON.stringify(original))})`);
 const oldText=await raw();await go(APP+'#projects/p/pjSchema/decisions');
 check('schema-4 data opens without a read-time rewrite',(await raw())===oldText && (await text('#app')).includes('Which chair?'));
 const history=original.projects.items[0].decisions[0].history;
 await ev(`location.hash='projects/p/pjSchema/milestones'`);await sleep(200);await click('[data-action=ms-reach]');await sleep(200);
 check('the next action explicitly saves schema 5, preserving complete history and unknown fields',(await data()).schemaVersion===5 && JSON.stringify((await data()).projects.items[0].decisions[0].history)===JSON.stringify(history) && (await data()).projects.items[0].future.kept[1]==='😀');
 await go('index.html#today'); const beforeClassic=await data();await click('#themeBtn');await sleep(200);
 check('the updated classic app can save schema 5 while preserving projects unread',(await data()).schemaVersion===5 && JSON.stringify((await data()).projects)===JSON.stringify(beforeClassic.projects));
 const beforePrevious=await raw();await go('previous/index.html#today');
 check('the actual previous React release explains that the data is newer',(await text('#app')).includes('saved by a newer version of MyDay'));
 check('returning to that release never rewrites version-5 saved data',(await raw())===beforePrevious && !(await exists('[data-action=build]')));
 await go(APP+'#today');
 for(const f of fs.readdirSync(T.S+'/dl')) fs.unlinkSync(path.join(T.S,'dl',f));
 await click('[data-action=export]');await sleep(700);
 const file=path.join(T.S,'dl','myday-export-2026-11-02.json');const exported=JSON.parse(fs.readFileSync(file,'utf8'));
 check('a fresh export identifies both envelope and complete data as schema 5',exported.schemaVersion===5 && exported.data.schemaVersion===5 && JSON.stringify(exported.data.projects.items[0].decisions[0].history)===JSON.stringify(history));
 await ev(`(()=>{const d=JSON.parse(localStorage.getItem('${KEY}'));d.projects.items[0].title='Changed after export';localStorage.setItem('${KEY}',JSON.stringify(d));})()`);await go();
 await T.setFile(file);await click('[data-action=dialog-confirm]');await sleep(250);
 check('the new app restores its own schema-5 export completely',(await data()).projects.items[0].title==='Synthetic schema project' && JSON.stringify((await data()).projects.items[0].decisions[0].history)===JSON.stringify(history));
 const oldFile=path.join(T.S,'dl','synthetic-schema4.json');fs.writeFileSync(oldFile,JSON.stringify({format:'myday-export',schemaVersion:4,exportedAt:'2026-10-22T09:00',data:original}));
 await T.setFile(oldFile);await click('[data-action=dialog-confirm]');await sleep(250);
 check('a previous schema-4 export still restores completely, writing schema 5',(await data()).schemaVersion===5 && JSON.stringify((await data()).projects.items[0].decisions[0].history)===JSON.stringify(history));
 check('the storage key is unchanged and no duplicate MyDay data key appears',JSON.stringify(await ev(`Object.keys(localStorage).filter(k=>k.startsWith('myday.data.'))`))===JSON.stringify([KEY]));
 const errors=T.events.filter(e=>e.method==='Runtime.exceptionThrown');check('no uncaught errors',errors.length===0);
 const r=T.summary();console.log(`\n${r.pass} passed, ${r.fail} failed`);process.exit(r.fail?1:0);
})().catch(e=>{console.error('HARNESS',e);process.exit(2)});
