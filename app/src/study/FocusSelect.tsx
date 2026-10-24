import { Field, Select } from '../components/Field';
import { updateSaved } from '../data/storage';
import { stIndex } from '../data/study/roadmap';
import { chooseFocus, focusChoices, focusValue } from '../data/study/yourFocus';
import type { MyDayData } from '../data/types';

// "Your focus": Cybersecurity, Arabic or one of your own courses, the one choice Today and Study home both follow
// (data/study/yourFocus.ts). In Study settings and under Study home's Now card.
export function FocusSelect({ data, id }: { data: MyDayData; id: string }) {
  const ix = stIndex(data.study), choices = focusChoices(data.study, ix), courses = choices.filter(c => c.course);
  return <Field label="Your focus" htmlFor={id}>
    <Select id={id} data-s="study-primary-subject" value={focusValue(data.study, ix)} onChange={e => { const v = e.target.value; updateSaved(d => { if (!chooseFocus(d, v)) return false; }); }}>
      {choices.filter(c => !c.course).map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
      {courses.length > 0 && <optgroup label="Your courses">{courses.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</optgroup>}
    </Select>
  </Field>;
}
