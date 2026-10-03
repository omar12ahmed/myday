import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../components/Button';
import { Field, TextInput } from '../components/Field';
import { update } from '../data/storage';
import { toast } from '../data/toast';
import { addCourse } from '../data/study/topics';

// "Add a course": its name, how long a session usually is, and whether Today should suggest it (on unless you untick
// it — then it's added to your Learning list, linked to the course, like the courses you set up first).
export function CourseForm({ stageId, onAdded }: { stageId: string; onAdded: (courseId: string) => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [minutes, setMinutes] = useState('30');
  const [suggest, setSuggest] = useState(true);
  const fid = `cf-${stageId}`;

  if (!open) {
    return (
      <Button inline variant="ghost" className="st-add mt-2" data-action="s-add" data-level="course" data-parent={stageId} onClick={() => setOpen(true)}>
        <Plus size={16} aria-hidden="true" /> Add a course
      </Button>
    );
  }
  function save() {
    let id: string | null = null;
    update(d => { id = addCourse(d, stageId, title, Number(minutes), suggest); if (!id) return false; });
    if (!id) return;
    toast(suggest ? `Added “${title.trim()}”, and to your Learning list so Today can suggest it.` : `Added “${title.trim()}”.`);
    setOpen(false); setTitle(''); setMinutes('30'); setSuggest(true);
    onAdded(id);
  }
  return (
    <form className="course-form grid gap-3 mt-3 p-3.5 bg-surface-2 rounded-tile" data-parent={stageId} onSubmit={e => { e.preventDefault(); save(); }}>
      <Field label="Course name" htmlFor={`${fid}-t`}>
        <TextInput id={`${fid}-t`} value={title} maxLength={120} autoFocus onChange={e => setTitle(e.target.value)} placeholder="e.g. Duolingo Spanish, Evening class" />
      </Field>
      <Field label="A usual session (minutes)" htmlFor={`${fid}-m`}>
        <TextInput id={`${fid}-m`} type="number" inputMode="numeric" min={5} max={600} value={minutes} onChange={e => setMinutes(e.target.value)} className="!w-28" />
      </Field>
      <label className="flex items-start gap-3 cursor-pointer min-h-11">
        <input type="checkbox" className="size-[22px] accent-primary flex-none mt-0.5" data-s="course-suggest" checked={suggest} onChange={e => setSuggest(e.target.checked)} />
        <span><span className="block font-medium">Also suggest it on Today</span><span className="block text-sm text-fg-2">Adds it to your Learning list, so it can be one of the day's tasks.</span></span>
      </label>
      <span className="flex flex-wrap gap-2">
        <Button inline type="submit" variant="primary" data-action="course-save" disabled={!title.trim()}>Add the course</Button>
        <Button inline variant="ghost" data-action="course-cancel" onClick={() => setOpen(false)}>Cancel</Button>
      </span>
    </form>
  );
}
