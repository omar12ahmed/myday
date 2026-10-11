const fs=require('fs'),os=require('os'),path=require('path'),{pathToFileURL}=require('url');
const ROOT=process.env.MYDAY_ROOT||path.resolve(__dirname,'..');let pass=0,fail=0;
const check=(name,ok)=>{console.log(`  ${ok?'PASS':'FAIL'} ${name}`);ok?pass++:fail++;};
const rejects=fn=>{try{fn();return false;}catch{return true;}};
(async()=>{
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'myday-explore-assets-'));
 const {bundle}=await import(pathToFileURL(path.join(ROOT,'ai-eval/build.mjs')).href);
 fs.writeFileSync(path.join(tmp,'assets.ts'),['assets','schema','content'].map(f=>`export * from ${JSON.stringify(path.join(ROOT,'app/src/explore',f))};`).join('\n'));
 const C=await import(pathToFileURL(await bundle(path.join(tmp,'assets.ts'),path.join(tmp,'out'))).href);
 const assets=Object.entries(C.exploreAssets);let total=0,newTotal=0;
 check('deliberately bounded image catalogue: one photograph per story beat',assets.length===6);
 for(const[id,asset]of assets){
   const file=path.join(ROOT,'app/public',asset.src);const bytes=fs.statSync(file).size;total+=bytes;if(id!=='market-aerial')newTotal+=bytes;
   check(id+' is a local, nonempty asset within budget',fs.existsSync(file)&&bytes>1000&&bytes<250000);
   const commons=asset.sourceUrl.startsWith('https://commons.wikimedia.org/wiki/File:'),pexels=asset.sourceUrl.startsWith('https://www.pexels.com/photo/');
   check(id+' has open-licence provenance: its own page, author, matching licence and changes',(commons&&asset.source==='Wikimedia Commons'&&asset.licence==='CC0 1.0'||pexels&&asset.source==='Pexels'&&asset.licence==='Pexels License')&&asset.creator.length>1&&asset.changes.length>4);
   check(id+' has reserved dimensions and meaningful description',asset.width>0&&asset.height>0&&asset.alt.length>20&&asset.caption.length>30);
   if(file.endsWith('.webp')){const b=fs.readFileSync(file),i=b.indexOf(Buffer.from([0x9d,0x01,0x2a]),20);check(id+' dimensions match its encoded pixels',i>0&&(b.readUInt16LE(i+3)&16383)===asset.width&&(b.readUInt16LE(i+5)&16383)===asset.height);}
 }
 check('new photography stays under 400 KB',newTotal<400000);check('all Explore photography stays under 600 KB',total<600000);
 const doc=C.contentForProject({id:'pj',title:'Hargeisa Marketplace',summary:''}),ctx=doc.scenes.find(s=>s.type==='context');
 for(const image of ['https://example.com/image.jpg','javascript:alert(1)','../private/image.jpg','not-reviewed'])check('unapproved asset rejected: '+image,rejects(()=>C.validateExplore({...doc,scenes:doc.scenes.map(s=>s.type==='context'?{...s,image}:s)})));
 check('metadata rejects remote files',rejects(()=>C.AssetSchema.parse({...assets[0][1],src:'https://example.com/photo.jpg'})));
 check('metadata rejects a licence that has not been reviewed',rejects(()=>C.AssetSchema.parse({...assets[0][1],licence:'All rights reserved'})));
 check('metadata rejects a source outside Wikimedia Commons',rejects(()=>C.AssetSchema.parse({...assets[0][1],sourceUrl:'https://example.com/photo'})));
 check('metadata requires a credited author',rejects(()=>C.AssetSchema.parse({...assets[0][1],creator:''})));
 const used=JSON.stringify(C.contentForProject({id:'pj',title:'Hargeisa Marketplace',summary:''}).scenes);
 check('every photograph in the catalogue tells part of the curated story',assets.every(([id])=>used.includes(`"${id}"`)));
 check('every licence has a link to its terms',assets.every(([,a])=>/^https:\/\/(creativecommons\.org|www\.pexels\.com\/license)\//.test(C.licenceUrls[a.licence]??'')));
 check('invalid dimensions rejected',rejects(()=>C.AssetSchema.parse({...assets[0][1],height:0})));
 check('missing context relationships are rejected',rejects(()=>C.validateExplore({...doc,scenes:[doc.scenes[0],{...ctx,connections:[{from:'missing',to:'customers',kind:'goods',label:'bad'}]}]})));
 check('duplicate context participants rejected',rejects(()=>C.validateExplore({...doc,scenes:[doc.scenes[0],{...ctx,actors:[ctx.actors[0],ctx.actors[0]]}]})));
 check('seven scene types retained',doc.scenes.length===7);
 console.log(`\nMedia: ${newTotal} new bytes; ${total} total bytes`);
 fs.rmSync(tmp,{recursive:true,force:true});console.log(`\n${pass} passed, ${fail} failed`);process.exit(fail?1:0);
})().catch(e=>{console.error('HARNESS',e);process.exit(1)});
