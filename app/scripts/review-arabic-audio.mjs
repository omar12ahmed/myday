// A local listening checklist for unheard clips. Never changes the audit or the app's shipped clip list.
// node app/scripts/review-arabic-audio.mjs reading-texts
// Then serve site/audio-review/ on a fresh localhost port. Downloaded choices identify each exact clip file.
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { voiceSources } from './arabic-voice-sources.mjs';

const root = new URL('../../', import.meta.url);
const source = voiceSources(root).find(s => s.id === process.argv[2]);
if (!source) throw new Error('Name a voiced source, for example reading-texts.');
const audit = JSON.parse(readFileSync(new URL('content/arabic-audio/audio-audit.json', root), 'utf8'));
const clips = source.texts.filter(t => ['to check', 'redo'].includes(audit.clips[t]?.check)).map(text => ({ text, file: audit.clips[text].file }));
if (!clips.length) throw new Error('This source has no clips waiting to be listened to.');
const out = new URL('site/audio-review/', root);
mkdirSync(new URL('clips/', out), { recursive: true });
for (const c of clips) copyFileSync(new URL('content/arabic-audio/clips/' + c.file, root), new URL('clips/' + c.file, out));
const data = JSON.stringify({ source: source.id, label: source.label, clips }).replace(/</g, '\\u003c');
const key = 'myday.audio-review.' + createHash('sha256').update(data).digest('hex').slice(0, 16);
const html = `<!doctype html>
<html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>MyDay — reading audio to listen to</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#f7f5ef;color:#212a25;font:16px/1.55 system-ui,sans-serif}main{max-width:820px;margin:auto;padding:24px 18px 64px}h1{line-height:1.2;font-size:30px}p{margin:12px 0}.tools{position:sticky;top:0;background:#f7f5ef;padding:12px 0;border-bottom:1px solid #d4d8d3;z-index:1;display:flex;flex-wrap:wrap;gap:8px;align-items:center}button,.choice{min-height:44px;padding:9px 14px;border:1px solid #b5c0b9;border-radius:8px;background:white;color:#155e52;font:inherit;cursor:pointer}button:focus-visible,input:focus-visible{outline:3px solid #0f766e;outline-offset:3px}article{background:white;border:1px solid #d4d8d3;border-radius:12px;padding:18px;margin:16px 0}article[data-choice="redo"]{border-color:#a34b23}.arabic{font-family:"Noto Naskh Arabic","Geeza Pro",serif;font-size:29px;line-height:1.9;overflow-wrap:anywhere}audio{width:100%;margin:8px 0}fieldset{border:0;padding:0;display:flex;flex-wrap:wrap;gap:8px}legend{font-size:14px;color:#526158}.choice{display:inline-flex;gap:8px;align-items:center;color:#212a25}small{color:#526158}#progress{font-size:14px}#playing{font-weight:600;min-height:25px}
</style>
<main><h1>A voice for the eight reading texts</h1>
<p>Listen to these ${clips.length} new clips against the Arabic. Choose <strong>Sounds fine</strong> or <strong>Another take</strong>. At a sentence's end, the voice may leave off the final vowel, as speakers do.</p>
<p><small>${audit.label} Your choices stay in this browser until you download them. They do not change MyDay.</small></p>
<div class="tools"><button id="listen">Listen from the start</button><button id="stop">Stop</button><button id="download">Download choices</button><span id="progress" aria-live="polite"></span></div>
<p id="playing" role="status"></p><div id="clips"></div></main>
<script>
const review=${data}, key=${JSON.stringify(key)};
let choices={};try{choices=JSON.parse(localStorage.getItem(key)||'{}')}catch{}
const list=document.getElementById('clips');
review.clips.forEach((clip,i)=>{
 const card=document.createElement('article');card.id='clip-'+i;
 const num=document.createElement('small');num.textContent='Clip '+(i+1)+' of '+review.clips.length;card.append(num);
 const text=document.createElement('p');text.className='arabic';text.lang='ar';text.dir='rtl';text.textContent=clip.text;card.append(text);
 const audio=document.createElement('audio');audio.controls=true;audio.preload='none';audio.src='clips/'+clip.file;audio.setAttribute('aria-label','Listen to clip '+(i+1));card.append(audio);
 const field=document.createElement('fieldset'),legend=document.createElement('legend');legend.textContent='How did it sound?';field.append(legend);
 [['checked','Sounds fine'],['redo','Another take']].forEach(([value,label])=>{
  const wrap=document.createElement('label');wrap.className='choice';const input=document.createElement('input');input.type='radio';input.name='clip-'+i;input.value=value;input.checked=choices[clip.file]===value;
  input.onchange=()=>{choices[clip.file]=value;try{localStorage.setItem(key,JSON.stringify(choices))}catch{};card.dataset.choice=value;progress()};wrap.append(input,document.createTextNode(label));field.append(wrap);
 });card.dataset.choice=choices[clip.file]||'';card.append(field);list.append(card);
});
const players=[...document.querySelectorAll('audio')];let queue=false,index=0;
function progress(){const n=review.clips.filter(c=>choices[c.file]).length;document.getElementById('progress').textContent=n+' of '+review.clips.length+' chosen'}progress();
function stop(){queue=false;players.forEach(p=>p.pause());document.getElementById('playing').textContent='Stopped.'}
function play(i){index=i;players[i].play().catch(()=>{stop();document.getElementById('playing').textContent='Could not play clip '+(i+1)+'. Try its play button.'})}
players.forEach((p,i)=>{p.onplay=()=>{index=i;players.forEach(other=>{if(other!==p)other.pause()});document.getElementById('playing').textContent='Playing clip '+(i+1)+' of '+players.length};p.onended=()=>{if(queue&&index===i){if(i+1<players.length)play(i+1);else{queue=false;document.getElementById('playing').textContent='That is every clip. Download your choices when ready.'}}}});
document.getElementById('listen').onclick=()=>{stop();queue=true;players[0].currentTime=0;play(0)};
document.getElementById('stop').onclick=stop;
document.getElementById('download').onclick=()=>{
 const result={source:review.source,choices:review.clips.map(c=>({...c,choice:choices[c.file]||'pending'}))};
 const url=URL.createObjectURL(new Blob([JSON.stringify(result,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='myday-audio-review-'+review.source+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
};window.addEventListener('pagehide',stop);
</script></html>`;
writeFileSync(new URL('index.html', out), html);
console.log(`${clips.length} clips ready to listen to: ${fileURLToPath(new URL('index.html', out))}`);
