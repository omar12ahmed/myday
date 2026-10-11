#!/usr/bin/env python3
"""Validate the MyDay Arabic package with the Python standard library.

Usage: python3 validate_arabic_curriculum.py [package-directory]
The schema checker implements the subset used by the bundled schema, not all
of JSON Schema. Graph, curriculum and cross-file checks are independent below.
"""
import json, re, sys, unicodedata, hashlib
from pathlib import Path
from collections import Counter
from datetime import datetime, timezone

def validate(base):
    errors=[]; checks=0
    def check(ok,message):
        nonlocal checks
        checks+=1
        if not ok:errors.append(message)
    def read(name):return json.loads((base/name).read_text(encoding='utf-8'))
    d=read('MyDay_Arabic_Fusha_Curriculum.json')
    schema=read('MyDay_Arabic_Curriculum.schema.json')
    policy=read('MyDay_Arabic_Adaptive_Tutor_Spec.json')
    keys=read('MyDay_Arabic_Assessment_Keys.json')
    starter=read('MyDay_Arabic_Starter_Materials.json')
    def istype(v,t):
        return {'object':isinstance(v,dict),'array':isinstance(v,list),'string':isinstance(v,str),
            'boolean':isinstance(v,bool),'null':v is None,'integer':isinstance(v,int) and not isinstance(v,bool),
            'number':isinstance(v,(int,float)) and not isinstance(v,bool)}[t]
    def structural(v,s,path='$'):
        if 'type' in s:
            ts=s['type'] if isinstance(s['type'],list) else [s['type']]
            if not any(istype(v,t) for t in ts):check(False,f'{path}: wrong type');return
        if 'const' in s:check(v==s['const'],f'{path}: wrong constant')
        if isinstance(v,dict):
            for k in s.get('required',[]):check(k in v,f'{path}: missing {k}')
            if s.get('additionalProperties') is False:
                check(set(v)<=set(s.get('properties',{})),f'{path}: unexpected properties')
            for k,x in v.items():
                if k in s.get('properties',{}):structural(x,s['properties'][k],path+'.'+k)
        if isinstance(v,list):
            if 'minItems' in s:check(len(v)>=s['minItems'],f'{path}: too few items')
            for i,x in enumerate(v):structural(x,s.get('items',{}),f'{path}[{i}]')
        if isinstance(v,str) and 'pattern' in s:check(bool(re.search(s['pattern'],v)),f'{path}: invalid pattern')
        if isinstance(v,(int,float)) and not isinstance(v,bool):
            if 'minimum' in s:check(v>=s['minimum'],f'{path}: below minimum')
            if 'maximum' in s:check(v<=s['maximum'],f'{path}: above maximum')
    structural(d,schema)
    collections=['modules','topics','skills','lessons','exercises','labs','assessments','projects','resources','paths','assets','lexicon_seed','milestones']
    index={}; types={}
    for col in collections:
        for x in d[col]:
            check(x['id'] not in index,'Duplicate global ID: '+x['id'])
            index[x['id']]=x;types[x['id']]=col
    def refs(values,col,context):
        for v in values:
            check(v in index and types.get(v)==col,f'{context}: unresolved {col} reference {v}')
    def nonempty_fields(x,fields):
        for f in fields:check(f in x and bool(x[f]),x['id']+': missing/empty '+f)
    for m in d['modules']:
        nonempty_fields(m,['name','purpose','learning_objectives','lesson_ids','topic_ids','exercise_ids','lab_ids','project_ids','assessment_id','common_mistakes','understanding_before_entry','understanding_before_progression','completion_capabilities'])
        for f,col in [('lesson_ids','lessons'),('topic_ids','topics'),('skill_ids','skills'),('exercise_ids','exercises'),('lab_ids','labs'),('project_ids','projects'),('resource_ids','resources'),('starter_asset_ids','assets')]:refs(m[f],col,m['id'])
        refs([m['assessment_id']],'assessments',m['id'])
        refs(m['prerequisites']['entry_skill_ids'],'skills',m['id'])
        refs(m['prerequisites']['external_skill_ids_used'],'skills',m['id'])
        for lid in m['lesson_ids']:check(index[lid]['module_id']==m['id'],m['id']+': wrong lesson parent')
        h=m['estimated_hours']
        for side in ('minimum','maximum'):
            total=h['lessons_standard']+h['labs']+h['assessment_and_delayed_check']+h['project_share_'+side]+h['distributed_practice_'+side]
            check(abs(total-h['total_'+side])<0.03,m['id']+': hour mismatch '+side)
        check(h['total_minimum']<=h['total_maximum'],m['id']+': reversed hours')
        check(h['distributed_practice_minimum']>=0,m['id']+': negative practice')
    for t in d['topics']:
        refs([t['module_id']],'modules',t['id']);refs(t['lesson_ids'],'lessons',t['id'])
        for lid in t['lesson_ids']:check(index[lid]['topic_id']==t['id'],t['id']+': wrong lesson topic')
    # Topic grouping also determines the human reader order, not just database sequence.
    reader_order=[lid for m in d['modules'] for tid in m['topic_ids'] for lid in index[tid]['lesson_ids']]
    check(len(reader_order)==len(set(reader_order))==len(d['lessons']),'Reader omits or duplicates lessons')
    reader_position={lid:i for i,lid in enumerate(reader_order)}
    for m in d['modules']:
        grouped=[lid for tid in m['topic_ids'] for lid in index[tid]['lesson_ids']]
        check(grouped==m['lesson_ids'],m['id']+': topic grouping disagrees with intended lesson sequence')
    answer_ids=[k['id'] for k in keys['answer_keys']]
    check(len(answer_ids)==len(set(answer_ids)),'Duplicate answer key')
    answer_set=set(answer_ids); answer_refs=set()
    for l in d['lessons']:
        nonempty_fields(l,['title','module_id','difficulty','estimated_duration_minutes','learning_objectives','key_concepts','practical_task_id','knowledge_check_id','mini_challenge_id','suggested_resource_types','completion_criteria'])
        refs([l['module_id']],'modules',l['id']);refs([l['topic_id']],'topics',l['id']);refs(l['skill_ids'],'skills',l['id'])
        refs([l['practical_task_id'],l['mini_challenge_id']],'exercises',l['id']);refs([l['knowledge_check_id']],'assessments',l['id'])
        refs(l['resource_ids'],'resources',l['id']);refs(l['starter_asset_ids'],'assets',l['id'])
        for a in ('all','any'):refs(l['prerequisites'][a],'skills',l['id'])
        check(not l['prerequisites']['any'],l['id']+': alternative prerequisite semantics need an explicit validator update')
        for dep in l['prerequisites']['all']:
            for prior in index[dep]['taught_by_lesson_ids']:
                check(reader_position[prior]<reader_position[l['id']],l['id']+': prerequisite appears later in human reader: '+prior)
        check(l['prerequisites']==index[l['skill_ids'][0]]['prerequisites'],l['id']+': lesson/skill prerequisite mismatch')
        check(len(index[l['knowledge_check_id']]['questions'])>=2,l['id']+': insufficient checks')
        check(set(v['mode'] for v in l['variants'])=={'short','standard','extended','revision','practical'},l['id']+': missing adaptation variant')
        check(all(0<v['minutes']<=90 for v in l['variants']),l['id']+': invalid session length')
        check(bool(re.search('[\u0600-\u06ff]',l['example']['text_ar'])),l['id']+': missing Arabic example')
    for col in ('exercises','labs','assessments','projects'):
        for x in d[col]:
            if x.get('rubric'):check(sum(r['weight'] for r in x['rubric'])==100,x['id']+': rubric weights')
            if x.get('assessment_criteria'):check(sum(r['weight'] for r in x['assessment_criteria'])==100,x['id']+': project weights')
            refs(x.get('skill_ids',x.get('required_skill_ids',[])),'skills',x['id'])
            if x.get('module_id'):refs([x['module_id']],'modules',x['id'])
            if x.get('lesson_id'):refs([x['lesson_id']],'lessons',x['id'])
            for q in x.get('questions',[]):
                check(q['answer_key_id'] in answer_set,x['id']+': missing answer key');answer_refs.add(q['answer_key_id'])
                check('expected_answer' not in q,x['id']+': key leaked into learner curriculum')
    for a in d['assets']:
        refs(a['module_ids'],'modules',a['id'])
        for q in a.get('comprehension_questions',[]):
            check(q['answer_key_id'] in answer_set,a['id']+': missing asset answer');answer_refs.add(q['answer_key_id'])
        check(a['audio_status']=='not_included',a['id']+': unsupported supplied audio claim')
        if a['type']=='original_text':check(a.get('text_ar') and a.get('text_unvowelled'),a['id']+': missing text versions')
    check(answer_refs==answer_set,'Orphaned or missing answer keys')
    check(keys['curriculum_version']==d['curriculum_version'],'Answer key curriculum version mismatch')
    for k in keys['answer_keys']:check(bool(k.get('expected_answer')) and bool(k.get('acceptable_variation')),k['id']+': incomplete answer key')
    check(starter['assets']==d['assets'] and starter['lexicon_seed']==d['lexicon_seed'],'Starter subset drift')
    graph={s['id']:s['prerequisites']['all'] for s in d['skills']}
    skill_order={s['id']:i for i,s in enumerate(d['skills'])}
    visiting=set();visited=set()
    def visit(sid):
        if sid in visiting:check(False,'Prerequisite cycle at '+sid);return
        if sid in visited:return
        visiting.add(sid)
        for dep in graph[sid]:
            if dep in graph:visit(dep)
        visiting.remove(sid);visited.add(sid)
    for sid in graph:visit(sid)
    for sid,deps in graph.items():
        for dep in deps:check(dep in skill_order and skill_order[dep]<skill_order[sid],sid+': forward prerequisite '+dep)
    for p in d['projects']:
        refs(p['module_ids'],'modules',p['id']);refs([p['time_owner_module_id']],'modules',p['id'])
        check(p['time_owner_module_id'] in p['module_ids'],p['id']+': invalid time owner')
    for path in d['paths']:
        mids=path['required_module_ids'];refs(mids,'modules',path['id']);refs(path['required_project_ids'],'projects',path['id'])
        check(len(mids)==len(set(mids)),path['id']+': duplicate module')
        sids=set(s for m in mids for s in index[m]['skill_ids'])
        for sid in sids:check(set(graph[sid])<=sids,path['id']+': missing prerequisite closure for '+sid)
        for pid in path['required_project_ids']:check(set(index[pid]['required_skill_ids'])<=sids,path['id']+': project prerequisites missing '+pid)
        for side in ('minimum','maximum'):
            check(sum(index[m]['estimated_hours']['total_'+side] for m in mids)==path['estimated_hours'][side],path['id']+': path time mismatch')
    for milestone in d['milestones']:
        refs([milestone['path_id']],'paths',milestone['id']);refs([milestone['assessment_id']],'assessments',milestone['id'])
        check(set(milestone['sample_tasks'])=={'listening','speaking','reading','writing'},milestone['id']+': missing modality')
    urls=[]
    for r in d['resources']:
        check(r['url'].startswith('https://'),r['id']+': malformed URL')
        check(r['verified_on']=='2026-10-10',r['id']+': unexpected verification date')
        check(not r['required'],r['id']+': provider dependency')
        urls.append(r['url'])
    check(len(urls)==len(set(urls)),'Duplicate resource URL')
    def string_walk(v,path='$'):
        if isinstance(v,str):
            check('\ufffd' not in v,path+': replacement character')
            check(unicodedata.is_normalized('NFC',v),path+': authored text is not NFC')
            check(not any(0x202a<=ord(c)<=0x202e or 0x2066<=ord(c)<=0x2069 for c in v),path+': hidden bidi controls')
        elif isinstance(v,dict):
            for k,x in v.items():string_walk(x,path+'.'+k)
        elif isinstance(v,list):
            for i,x in enumerate(v):string_walk(x,f'{path}[{i}]')
    string_walk(d)
    string_walk(keys)
    string_walk(policy)
    check(abs(sum(policy['mastery']['dimensions'].values())-1)<1e-9,'Mastery dimension weights')
    check(policy['separate_from_curriculum'] and policy['model_dependency'] is None,'Policy not model-independent')
    bands=policy['mastery']['bands'];check([(b['minimum'],b['maximum']) for b in bands]==[(0,20),(21,40),(41,60),(61,80),(81,100)],'Mastery bands')
    for t in policy['adaptation']['session_templates_minutes']:
        check(sum(v for k,v in t.items() if k!='available')==t['available'],'Session budget mismatch')
    check('daily_assignment' not in d and 'learner_progress' not in d,'Learner state in static data')
    check(len(policy['acceptance_scenarios'])>=10,'Missing policy acceptance cases')
    check(len([m for m in d['modules'] if m['path_class']=='core'])==24,'Core scope changed without expected review')
    counts={col:len(d[col]) for col in collections}
    files=[base/n for n in ['MyDay_Arabic_Fusha_Curriculum.json','MyDay_Arabic_Curriculum.schema.json','MyDay_Arabic_Adaptive_Tutor_Spec.json','MyDay_Arabic_Assessment_Keys.json','MyDay_Arabic_Starter_Materials.json']]
    return {'status':'pass' if not errors else 'fail','validated_at_utc':datetime.now(timezone.utc).isoformat(),
        'checks_run':checks,'errors':errors,'counts':counts,'prerequisite_edges':sum(map(len,graph.values())),
        'core_estimated_hours':index['path.arabic-core-b2']['estimated_hours'],
        'sha256':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in files},
        'limitations':['Structural and semantic package checks are not independent Arabic-language proofreading.','External pages were researched separately; no automated live-link or media-playback guarantee.','Adaptive behaviour is a specification, not a deployed tutor or validated proficiency test.']}

if __name__=='__main__':
    base=Path(sys.argv[1]).resolve() if len(sys.argv)>1 else Path(__file__).resolve().parent
    try: report=validate(base)
    except Exception as e:
        print(json.dumps({'status':'fail','error':str(e)},ensure_ascii=False,indent=2));sys.exit(1)
    (base/'MyDay_Arabic_Validation_Report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(report,ensure_ascii=False,indent=2))
    sys.exit(0 if report['status']=='pass' else 1)
