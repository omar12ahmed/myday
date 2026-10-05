#!/usr/bin/env python3
"""Validate this package without external dependencies.

Implements every JSON Schema keyword used by the included schema, not the
entire JSON Schema specification. Also checks references, DAGs and path closure.
Usage: python3 validate_curriculum.py [directory]
"""
from pathlib import Path
import sys,json,re,hashlib,math

def schema_check(value,schema,path='$'):
    errors=[]
    if 'anyOf' in schema:
        trials=[schema_check(value,s,path) for s in schema['anyOf']]
        return [] if any(not e for e in trials) else [path+': no matching anyOf type']
    if 'const' in schema and value!=schema['const']:errors.append(path+': wrong constant')
    if 'enum' in schema and value not in schema['enum']:errors.append(path+': not in enum')
    kind=schema.get('type')
    ok={'object':lambda:isinstance(value,dict),'array':lambda:isinstance(value,list),'string':lambda:isinstance(value,str),
        'number':lambda:isinstance(value,(int,float)) and not isinstance(value,bool),'integer':lambda:isinstance(value,int) and not isinstance(value,bool),
        'boolean':lambda:isinstance(value,bool),'null':lambda:value is None}
    if kind and not ok[kind]():return errors+[path+': wrong type '+kind]
    if kind=='object':
        props=schema.get('properties',{})
        errors += [path+': missing '+k for k in schema.get('required',[]) if k not in value]
        if schema.get('additionalProperties') is False:errors += [path+': unexpected '+k for k in value if k not in props]
        for k,v in value.items():
            if k in props:errors+=schema_check(v,props[k],path+'.'+k)
    if kind=='array':
        if schema.get('uniqueItems') and len(set(json.dumps(x,sort_keys=True) for x in value))!=len(value):errors.append(path+': duplicate item')
        for i,v in enumerate(value):errors+=schema_check(v,schema.get('items',{}),path+'['+str(i)+']')
    if kind=='string':
        if len(value)<schema.get('minLength',0):errors.append(path+': too short')
        if 'pattern' in schema and not re.search(schema['pattern'],value):errors.append(path+': wrong pattern')
    if kind in ['number','integer']:
        if not math.isfinite(value):errors.append(path+': non-finite number')
        if value<schema.get('minimum',-math.inf) or value>schema.get('maximum',math.inf):errors.append(path+': outside bounds')
    return errors

def validate(root):
    data=json.loads((root/'MyDay_Cybersecurity_Curriculum.json').read_text())
    schema=json.loads((root/'MyDay_Curriculum.schema.json').read_text())
    errors=schema_check(data,schema); checks=[]
    def early_failure(stage):
        report={'status':'FAIL','stage':stage,'errors':errors}
        (root/'Validation_Report.json').write_text(json.dumps(report,indent=2)+'\n')
        print(json.dumps(report,indent=2))
        return True
    if errors:return early_failure('schema')
    checks.append('Schema types, required fields, enums, numeric bounds and stable-ID format')
    arrays={k:v for k,v in data.items() if isinstance(v,list)}
    records=[data['course']]+[x for v in arrays.values() for x in v]
    all_ids=[r['id'] for r in records]
    if len(set(all_ids))!=len(all_ids):errors.append('Duplicate top-level entity IDs')
    known=set(all_ids); byid={r['id']:r for r in records}
    required_lesson={'id','title','module_id','difficulty','estimated_duration_minutes','prerequisites','learning_objectives','key_concepts','practical_task_id','knowledge_check_id','mini_challenge_id','suggested_resource_types','completion_criteria','variants'}
    required_module={'id','name','purpose','prerequisites','difficulty','estimated_hours','learning_objectives','topic_ids','exercise_ids','lab_ids','project_ids','assessment_id','common_mistakes','understanding_before_progression','completion_capabilities'}
    for row in data['lessons']:
        if not required_lesson<=row.keys():errors.append(row['id']+': incomplete requested lesson fields')
    for row in data['modules']:
        if not required_module<=row.keys():errors.append(row['id']+': incomplete requested module fields')
    reference_keys={'module_id','topic_id','skill_id','lesson_id','assessment_id','practical_task_id','knowledge_check_id','mini_challenge_id','core_path_id'}
    def refs(obj,path='$'):
        if isinstance(obj,dict):
            for k,v in obj.items():
                if k in reference_keys and v is not None and v not in known:errors.append(path+': missing reference '+str(v))
                if k.endswith('_ids') and isinstance(v,list):
                    for item in v:
                        if item not in known:errors.append(path+': missing reference '+str(item))
                refs(v,path+'.'+k)
        elif isinstance(obj,list):
            for i,v in enumerate(obj):refs(v,path+'['+str(i)+']')
    refs(data);checks.append('All references resolve; requested module and lesson fields present')
    if errors:return early_failure('references_and_required_fields')
    lessons=byid
    for l in data['lessons']:
        if l['id'] not in byid[l['module_id']]['lesson_ids']:errors.append(l['id']+': missing module inverse')
        if l['id'] not in byid[l['topic_id']]['lesson_ids']:errors.append(l['id']+': missing topic inverse')
        for eid in [l['practical_task_id'],l['mini_challenge_id']]:
            if byid[eid]['lesson_id']!=l['id']:errors.append(eid+': wrong lesson owner')
        a=byid[l['knowledge_check_id']]
        if len(a['questions'])<2 or any(not q['expected_answer'] for q in a['questions']):errors.append(l['id']+': missing assessment answers')
        if a['skill_ids']!=l['skill_ids']:errors.append(l['id']+': mismatched assessment skills')
        if l['prerequisites']!=byid[l['skill_ids'][0]]['prerequisites']:errors.append(l['id']+': inconsistent skill prerequisites')
    for m in data['modules']:
        human_order=[lid for tid in m['topic_ids'] for lid in byid[tid]['lesson_ids']]
        if human_order!=m['lesson_ids']:errors.append(m['id']+': topic grouping changes the intended lesson order')
    checks.append('Lesson/topic/module ownership and assessment/skill alignment')
    graph={s['id']:[r['skill_id'] for r in s['prerequisites']['all']] for s in data['skills']}
    if any(s['prerequisites']['any'] for s in data['skills']):errors.append('Version 1.0.0 reserves any groups; nonempty alternatives need a schema and validator revision')
    visiting=set();visited=set();topo=[]
    def visit(s):
        if s in visiting:errors.append('Dependency cycle at '+s);return
        if s in visited:return
        visiting.add(s)
        for p in graph[s]:
            if p not in graph:errors.append('Unknown prerequisite '+p)
            else:visit(p)
        visiting.remove(s);visited.add(s);topo.append(s)
    for s in graph:visit(s)
    order={s['id']:i for i,s in enumerate(data['skills'])}
    for s,pres in graph.items():
        for p in pres:
            if order.get(p,0)>=order[s]:errors.append(s+': prerequisite appears after target '+p)
    checks.append('Acyclic skill graph; every prerequisite precedes dependent content')
    for p in data['paths']:
        mods=set(p['required_module_ids'])
        available={s['id'] for s in data['skills'] if s['module_id'] in mods and not s['optional']}
        for s in available:
            for pre in graph[s]:
                if pre not in available:errors.append(p['id']+': missing branch prerequisite '+pre+' for '+s)
        for pid in p['required_project_ids']:
            project=byid[pid]
            if not set(project['module_ids'])<=mods:errors.append(p['id']+': project modules missing '+pid)
            for pre in project['required_skills']:
                if pre['skill_id'] not in available:errors.append(p['id']+': project skill missing '+pre['skill_id'])
        if len(p['required_project_ids'])!=len(set(p['required_project_ids'])):errors.append(p['id']+': project double counted')
    checks.append('Every required path is prerequisite-closed; optional extensions do not block entry routes')
    for e in data['exercises']+data['assessments']:
        if e['rubric'] and sum(x['weight'] for x in e['rubric'])!=100:errors.append(e['id']+': rubric not 100')
    for p in data['projects']:
        if sum(x['weight'] for x in p['assessment_criteria'])!=100:errors.append(p['id']+': project rubric not 100')
    checks.append('Exercise, module and project rubric weights total 100')
    for m in data['modules']:
        for pid in m['project_gate_ids']:
            project=byid[pid]
            last=max(byid[mid]['sequence'] for mid in project['module_ids'])
            if m['sequence']!=last:errors.append(m['id']+': premature shared-project gate')
        h=m['estimated_hours']
        for bound in ['minimum','maximum']:
            estimate=h['lessons_standard']+h['labs_'+bound]+h['assessment_and_delayed_check_'+bound]+h['project_share_'+bound]
            if abs(estimate-h['total_'+bound])>0.21:errors.append(m['id']+': time sum mismatch')
    for path in data['paths']:
        ms=[byid[x] for x in path['required_module_ids']]
        ps=[byid[x] for x in path['required_project_ids']]
        for bound in ['minimum','maximum']:
            total=sum(m['estimated_hours']['lessons_standard']+m['estimated_hours']['labs_'+bound]+m['estimated_hours']['assessment_and_delayed_check_'+bound] for m in ms)+sum(p['estimated_hours'][bound] for p in ps)
            if abs(round(total)-path['estimated_hours'][bound])>0:errors.append(path['id']+': path total mismatch')
    checks.append('Shared-project gates occur at their final contribution; time totals avoid duplicate projects')
    policy=json.loads((root/'MyDay_Adaptive_Tutor_Spec.json').read_text())
    if abs(sum(policy['mastery']['dimensions'].values())-1)>1e-9:errors.append('Mastery dimension weights do not total 1')
    if not policy['separate_from_curriculum'] or policy['model_dependency'] is not None:errors.append('Adaptive separation or model independence violated')
    for t in policy['adaptation']['session_templates']:
        if t['recall']+t['main_task']+t['record_next_step']!=t['minutes']:errors.append('Session duration mismatch')
    checks.append('Separate model-independent policy; scoring and session budgets reconcile')
    md=root/'MyDay_Cybersecurity_Curriculum.md'
    if md.exists():
        text=md.read_text()
        for r in data['modules']+data['lessons']+data['projects']:
            if r['id'] not in text:errors.append(r['id']+': missing from human output')
        checks.append('All modules, lessons and projects represented in human output')
    report={'status':'PASS' if not errors else 'FAIL','curriculum_version':data['curriculum_version'],
      'counts':{k:len(v) for k,v in arrays.items()},'checks_passed':checks if not errors else [],'errors':errors,
      'skill_dependency_edges':sum(len(v) for v in graph.values()),'topological_skill_order':topo,
      'validation_scope':'Static structure, references, field coverage, path closure, time arithmetic and policy consistency. Labs, accounts, installs, learning outcomes and employment outcomes were not executed or empirically validated.',
      'human_review':['Security and scope begin in the first module','C and assembly precede reverse engineering','AD requires Windows identity, DNS and Kerberos','Cloud operations and cost controls precede cloud security projects','CTFs supplement rather than replace assessment','Every entry-focus path uses the common core plus one focus; advanced branches are optional'],
      'sha256':{f.name:hashlib.sha256(f.read_bytes()).hexdigest() for f in [root/'MyDay_Cybersecurity_Curriculum.json',root/'MyDay_Adaptive_Tutor_Spec.json',root/'MyDay_Curriculum.schema.json']}}
    (root/'Validation_Report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({k:report[k] for k in ['status','counts','skill_dependency_edges','errors']},indent=2))
    return bool(errors)

if __name__=='__main__':sys.exit(validate(Path(sys.argv[1]) if len(sys.argv)>1 else Path(__file__).resolve().parent))
