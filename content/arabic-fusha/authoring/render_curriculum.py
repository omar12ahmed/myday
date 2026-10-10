import json,re,html
from pathlib import Path
P=Path(__file__).resolve().parent.parent
W=P/'authoring'
d=json.loads((P/'MyDay_Arabic_Fusha_Curriculum.json').read_text())
policy=json.loads((P/'MyDay_Arabic_Adaptive_Tutor_Spec.json').read_text())
index={x['id']:x for k,v in d.items() if isinstance(v,list) for x in v if isinstance(x,dict) and 'id' in x}
parts=[(W/'architecture.md').read_text()]
def add(s=''):parts.append(s+'\n')
def ids(xs):return ', '.join('`'+x+'`' for x in xs) if xs else 'None.'
def bullets(xs):
    for x in xs:add('- '+x)
    add()
def named(xs):return '; '.join(index[x].get('name',index[x].get('title',x))+' (`'+x+'`)' for x in xs) if xs else 'None.'
def project(p):
    add('##### Project: '+p['name']);add('**ID:** `'+p['id']+'`')
    add('**Goal:** '+p['goal']);add('**Required skills:** '+ids(p['required_skill_ids']))
    add(f"**Study time:** {p['estimated_hours']['minimum']}–{p['estimated_hours']['maximum']} hours; allocated once to `{p['time_owner_module_id']}`.")
    add('**Deliverables:**');bullets(p['deliverables'])
    add('**Assessment criteria:**');bullets([f"{r['weight']}% — {r['criterion']}" for r in p['assessment_criteria']])
    add(f"**Pass:** {p['pass_score']}/100, with honest conditions and evidence. **Portfolio value:** {p['portfolio_value']}")
    add('**Evidence conditions:**');bullets(p['evidence_conditions']);add('**Retake:** '+p['retake_rule']);add()
for m in d['modules']:
    add('<a id="'+m['id']+'"></a>')
    add(f"### Module {m['sequence']:02d} — {m['name']}")
    add(f"**ID:** `{m['id']}` · **Path:** {m['path_class']} · **Target:** {m['stage_target']} · **Difficulty:** {m['difficulty']}/6")
    add('**Purpose:** '+m['purpose'])
    add('**Entry prerequisites:** '+ids(m['prerequisites']['entry_skill_ids']))
    add('**Other skills used by particular lessons:** '+ids(m['prerequisites']['external_skill_ids_used']))
    add('**Before entry:** '+' '.join(m['understanding_before_entry']))
    h=m['estimated_hours']
    add(f"**Estimated study time:** {h['total_minimum']}–{h['total_maximum']} hours. Initial lessons: {h['lessons_standard']:g} h; labs: {h['labs']:g} h; assessment and delayed check: {h['assessment_and_delayed_check']:g} h; allocated project work: {h['project_share_minimum']:g}–{h['project_share_maximum']:g} h; distributed practice/review: {h['distributed_practice_minimum']:g}–{h['distributed_practice_maximum']:g} h.")
    add('**Learning objectives:**');bullets(m['learning_objectives'])
    add('**Topics:** '+named(m['topic_ids']));add()
    add('**Common mistakes:**');bullets(m['common_mistakes'])
    add('**Understand before progressing:**');bullets(m['understanding_before_progression'])
    add('**Able to do after completion:**');bullets(m['completion_capabilities'])
    add('**Practice across the module:**');bullets([x['task']+f" Suggested unit: {x['session_minutes']} minutes." for x in m['practice_menu']])
    for tid in m['topic_ids']:
        t=index[tid];add('#### Topic — '+t['name']);add('**ID:** `'+tid+'`');add()
        for lid in t['lesson_ids']:
            l=index[lid];e=index[l['practical_task_id']];c=index[l['mini_challenge_id']];a=index[l['knowledge_check_id']]
            dur=l['estimated_duration_minutes']
            add('<a id="'+lid+'"></a>');add('##### Lesson — '+l['title'])
            add(f"**ID:** `{lid}` · **Module:** `{l['module_id']}` · **Difficulty:** {l['difficulty']}/6 · **Target:** {l['stage_target']}")
            add(f"**Duration:** {dur['standard']} min standard; {dur['short']} min partial session; {dur['minimum_full']}–{dur['extended']} min for a complete/expanded encounter. Further module practice builds retention.")
            add('**Prerequisites:** '+ids(l['prerequisites']['all']))
            add('**Skill:** '+ids(l['skill_ids']))
            add('**Learning objectives:**');bullets(l['learning_objectives'])
            add('**Key concepts:** '+'; '.join(l['key_concepts'])+'.')
            add('**Arabic example:** '+l['example']['text_ar']+' — '+l['example']['meaning_en'])
            add('**Practical exercise** (`'+e['id']+'`): '+e['instruction'])
            add('**Evidence to keep:** '+'; '.join(e['expected_evidence'])+'.')
            add('**Knowledge check** (`'+a['id']+'`):');bullets([q['prompt'] for q in a['questions']])
            add('**Mini challenge** (`'+c['id']+'`): '+c['instruction'])
            add('**Suggested resource types:** '+', '.join(l['suggested_resource_types']).replace('_',' ')+'.')
            add('**Resource pointers:** '+ids(l['resource_ids'])+'. The catalogue below gives verified links.')
            if l['starter_asset_ids']:add('**Optional starter material:** '+ids(l['starter_asset_ids'])+'. Match its actual difficulty to the lesson; shorten or preteach if necessary.')
            add('**Completion criteria:**');bullets(l['completion_criteria'])
            add('**Adaptable versions:**');bullets([f"{v['mode'].capitalize()} ({v['minutes']} min): {v['activity']} Evidence: {v['evidence_scope']}." for v in l['variants']])
    add('#### Module labs and assessment')
    for labid in m['lab_ids']:
        lab=index[labid]
        add('**'+lab['name']+'** (`'+labid+'`, '+str(lab['estimated_minutes'])+' min, splittable): '+lab['task'])
        add('Deliver: '+'; '.join(lab['deliverables'])+'. Use the common practical rubric; pass at 75/100.')
    a=index[m['assessment_id']]
    add('**Assessment:** `'+a['id']+'` — '+a['task'])
    add(f"Allow {a['estimated_minutes']} minutes across short sessions, plus {a['delayed_check_minutes']} minutes for a changed task on another day.")
    bullets(a['pass_criteria'])
    add('**Project connections:** '+named(m['project_ids']))
    for pid in m['project_ids']:
        p=index[pid]
        if p['time_owner_module_id']==m['id']:project(p)
    add('---');add()

add('## 13. Paths and milestone evidence')
for p in d['paths']:
    add('### '+p['name']);add('**ID:** `'+p['id']+'`')
    add(f"**Cumulative budget:** {p['estimated_hours']['minimum']}–{p['estimated_hours']['maximum']} hours.")
    add('**Required module route:** '+named(p['required_module_ids']))
    add('**Required projects:** '+named(p['required_project_ids']))
    add(p['note']+' '+p['completion_rule']);add()
for m in d['milestones']:
    add('### '+m['stage_target']+' target checkpoint')
    bullets([f"{k.capitalize()}: {v}." for k,v in m['sample_tasks'].items()])
    add(m['interpretation']);bullets(m['conditions'])

add('## 14. Original starter practice materials')
add('All people, events and data here are fictional or generic teaching examples. These short texts are not long-form B2/C1 assessment passages. Written scripts do not provide audio. Reference answers are in `MyDay_Arabic_Assessment_Keys.json`; reveal them after an attempt.')
for a in d['assets']:
    add('### '+a['title']);add('**ID:** `'+a['id']+'` · **Target:** '+a['stage_target'])
    if 'text_ar' in a:
        for line in a['text_ar'].splitlines():add(line);add()
        if a['text_ar']!=a['text_unvowelled']:
            add('**Unvowelled practice display:**');add(a['text_unvowelled']);add()
        bullets([q['prompt'] for q in a['comprehension_questions']])
        add(a['use_note'])
    elif 'rows' in a:
        bullets([f"{r['day_ar']} — {r['time']} — {r['activity_ar']} — {r['place_ar']}" for r in a['rows']]);add(a['task'])
    else:
        bullets([f"{r['a']} / {r['b']} — {r['meaning_a']} / {r['meaning_b']}" for r in a['pairs']]);add(a['task']);add(a['use_note'])
    add('**Audio:** Not included.');add()
add('### Starter vocabulary: 48 records')
add('Each record is a beginning point for separately tested written recognition, audio recognition, spoken retrieval and written retrieval. Add plurals, past–present pairs and collocations as taught. These are not a complete frequency list or a level threshold.')
for v in d['lexicon_seed']:add('- **'+v['form_ar']+'** — '+v['meaning_en']+'; '+v['part_of_speech']+'. Example: '+v['example_ar']+' — '+v['example_meaning_en']+' (`'+v['id']+'`)')
add()
add('## 15. Verified resource catalogue')
add('Checked 10 October 2026. Verification scope and access limitations are stated per entry. No paid purchase or account creation is required by the curriculum itself.')
for r in d['resources']:
    add('### '+r['title']);add('**ID:** `'+r['id']+'` · **Type:** '+r['type'].replace('_',' ')+' · **Provider:** '+r['provider'])
    add('['+r['title']+']('+r['url']+')');add('**Use:** '+r['use_note']);add('**Stage fit:** '+r['stage_fit'])
    add('**Access:** '+r['access_note']);add('**Verification:** '+r['verification']);add('**Replacement:** '+r['replacement_rule']);add('**Reuse:** '+r['reuse_rule']);add()
add('## 16. Files and validation')
bullets(['`MyDay_Arabic_Fusha_Curriculum.json` — canonical static course.',
         '`MyDay_Arabic_Curriculum.schema.json` — structural schema.',
         '`MyDay_Arabic_Adaptive_Tutor_Spec.json` — separate model-independent policy and learner-state contract.',
         '`MyDay_Arabic_Assessment_Keys.json` — reference answers for 425 lesson questions and 42 starter-text questions.',
         '`MyDay_Arabic_Starter_Materials.json` — subset export using the same asset and lexicon IDs.',
         '`validate_arabic_curriculum.py` — standard-library package validator.',
         '`MyDay_Arabic_Validation_Report.json` — results, counts and hashes.',
         '`MyDay_Arabic_README.md` — import guidance and starting instructions.'])
add('Run `python3 validate_arabic_curriculum.py` from the extracted package directory. The validator checks structure, references and curriculum invariants. It does not replace Arabic-teacher review, external media checks or proficiency assessment.')
md='\n'.join(parts)
(P/'MyDay_Arabic_Fusha_Curriculum.md').write_text(md,encoding='utf-8')

def inline(s):
    s=html.escape(s)
    s=re.sub(r'`([^`]+)`',r'<code>\1</code>',s)
    s=re.sub(r'\*\*([^*]+)\*\*',r'<strong>\1</strong>',s)
    s=re.sub(r'\[([^\]]+)\]\((https://[^)]+)\)',r'<a href="\2" rel="noreferrer">\1</a>',s)
    # Direction isolation is applied to contiguous Arabic runs, leaving source order unchanged.
    s=re.sub(r'([\u0600-\u06ff][\u0600-\u06ff\s،؛؟–/]*[\u0600-\u06ff]|[\u0600-\u06ff])',r'<bdi class="ar" lang="ar" dir="rtl">\1</bdi>',s)
    return s
rendered=[];inlist=False;listtag='';paras=[]
def flush():
    if paras:rendered.append('<p>'+inline(' '.join(paras))+'</p>');paras.clear()
def close_list():
    global inlist
    if inlist:rendered.append('</'+listtag+'>');inlist=False
for line in md.splitlines():
    line=line.strip()
    if not line:flush();close_list();continue
    if line.startswith('<a id='):flush();close_list();rendered.append(line);continue
    if line=='---':flush();close_list();rendered.append('<hr>');continue
    match=re.match(r'^(#{1,6}) (.*)',line)
    if match:
        flush();close_list();level=len(match.group(1));rendered.append(f'<h{level}>'+inline(match.group(2))+f'</h{level}>');continue
    bullet=re.match(r'^(- |\d+\. )(.*)',line)
    if bullet:
        flush();tag='ul' if bullet.group(1)=='- ' else 'ol'
        if inlist and tag!=listtag:close_list()
        if not inlist:rendered.append('<'+tag+'>');inlist=True;listtag=tag
        rendered.append('<li>'+inline(bullet.group(2))+'</li>');continue
    close_list();paras.append(line)
flush();close_list()
nav=''.join('<a href="#'+m['id']+'"><span>'+f"{m['sequence']:02d}"+'</span> '+html.escape(m['name'])+'</a>' for m in d['modules'])
page='''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>MyDay · Arabic Fuṣḥā Curriculum</title><style>
:root{color-scheme:light;--ink:#18343c;--accent:#136b68;--paper:#fffdf7;--line:#d4e3df}*{box-sizing:border-box}html{scroll-behavior:smooth;scroll-padding-top:30px}
body{margin:0;background:var(--paper);color:var(--ink);font:17px/1.65 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
aside{position:fixed;inset:0 auto 0 0;width:300px;padding:28px 22px;background:#edf4f0;overflow-y:auto;border-right:1px solid var(--line)}
aside h2{font-size:23px;margin:0 0 8px}aside p{font-size:13px;color:#496568}aside a{display:block;padding:9px 0;color:var(--ink);font-size:13px;line-height:1.4;text-decoration:none;border-bottom:1px solid var(--line)}aside a:hover{text-decoration:underline}aside span{color:var(--accent);font-weight:700}
main{margin-left:300px;max-width:1160px;padding:45px 60px 100px}h1{font-size:44px;line-height:1.12;letter-spacing:-1.3px;max-width:780px}h2{font-size:29px;line-height:1.25;margin-top:55px;color:var(--accent)}h3{font-size:25px;line-height:1.3;margin-top:40px;border-top:2px solid var(--line);padding-top:25px}h4{font-size:21px;margin-top:32px}h5{font-size:20px;margin-top:34px;border-left:4px solid var(--accent);padding:9px 15px;background:#f0f6f2}p{margin:10px 0 15px}ul,ol{padding-left:25px}li{padding:3px 0}a{color:var(--accent);overflow-wrap:anywhere}code{font:13px/1.5 ui-monospace,monospace;background:#edf3ef;padding:2px 5px;border-radius:4px;overflow-wrap:anywhere}.ar{font-family:"Noto Naskh Arabic","Geeza Pro","Amiri",serif;font-size:1.22em;line-height:2.1}hr{border:0;border-top:1px solid var(--line);margin:40px 0}
.topnote{border:1px solid var(--line);border-radius:12px;background:#edf4f0;padding:18px 22px;font-size:15px;margin-bottom:28px}
@media(max-width:900px){aside{position:static;width:auto;max-height:310px;border-right:0;border-bottom:1px solid var(--line)}main{margin:0;padding:28px 22px}h1{font-size:34px}}
@media print{aside,.topnote{display:none}main{margin:0;max-width:none;padding:0}h3{break-before:page}h4,h5{break-after:avoid}body{font-size:11pt}.ar{font-size:15pt}a{color:inherit}}
</style></head><body><aside><h2>MyDay · العربية</h2><p>Fuṣḥā from foundations to independent use. Jump to a module below. Use your browser’s Find command to search all lessons.</p>'''+nav+'''</aside><main><div class="topnote"><strong>Complete curriculum · 30 modules · 152 lessons</strong><br>Modern Standard Arabic core with six optional branches. This reader works offline; linked external resources require internet access.</div>'''+''.join(rendered)+'</main></body></html>'
(P/'MyDay_Arabic_Fusha_Curriculum.html').write_text(page,encoding='utf-8')
print(json.dumps({'markdown_words':len(md.split()),'markdown_bytes':len(md.encode()),'html_bytes':len(page.encode())}))
