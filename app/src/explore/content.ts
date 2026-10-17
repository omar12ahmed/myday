import { findOutTitle, isBusiness } from '../data/businessModel';
import type { BusinessModel, Project } from '../data/types';
import hargeisa from './content/hargeisa.json';
import { validateExplore, type ExploreData } from './schema';

// Your Hargeisa Marketplace project: any title naming Hargeisa (in any of its usual spellings) and a market,
// e.g. "Hargeisa Marketplace", "Hargesia market", "Online market – Hargeysa".
export const isHargeisa = (p: Project) => /\bharg(?:eisa|esia|eysa|aysa)\b/i.test(p.title) && /\bmarket/i.test(p.title);
export function contentForProject(project: Project, example = false): ExploreData {
  if (example || isHargeisa(project)) return validateExplore({ ...hargeisa, projectId: project.id });
  if (isBusiness(project) && project.model) return validateExplore(fromOnePage(project, project.model));
  return validateExplore({
    schemaVersion: 1, id: 'project-starter-v1', projectId: project.id, title: project.title, edition: 'starter',
    scenes: [
      { id: 'hero', type: 'hero', title: project.title, eyebrow: 'A starting point for your idea', basis: 'brief', proposition: project.summary.slice(0, 1000) || 'An intention worth understanding. Start with who it serves, what changes for them, and the smallest way to test it.', image: 'none', caption: 'Your project brief. The exploration below is a suggested framework, not researched findings.' },
      { id: 'architecture', type: 'architecture', title: 'Make the relationships visible.', eyebrow: 'A first working model', basis: 'assumption', description: 'Start with these roles, then test whether they describe your idea. This is a generic planning structure; no research or industry facts have been generated.',
        nodes: [{ id: 'idea', label: 'Your idea', detail: 'The value you want to create' }, { id: 'people', label: 'People', detail: 'Who might benefit?' }, { id: 'resources', label: 'Resources', detail: 'What would it need?' }, { id: 'outcome', label: 'Outcome', detail: 'What would change?' }],
        connections: [{ from: 'people', to: 'idea', label: 'A need to understand', kind: 'order' }, { from: 'resources', to: 'idea', label: 'Resources to identify', kind: 'goods' }, { from: 'idea', to: 'outcome', label: 'A change to validate', kind: 'goods' }],
      },
      { id: 'action', type: 'action', title: 'What should\nhappen next?', eyebrow: 'From intention to evidence', basis: 'assumption', description: 'Choose one assumption you could test with someone who might benefit from this idea.', task: { id: 'first-assumption', title: ('Write one testable assumption for ' + project.title).slice(0, 120), minutes: 15, notes: 'Write down who this idea serves, the problem you think they have, and one observation that would challenge your assumption. Choose one person to ask about a recent real experience. This is a suggested starting action, not a researched recommendation.' } },
    ],
  });
}

// A business idea's starting brief, built from its one page (1.33.0): your problem opens it, your answers are a chapter
// (in your words), the relationships stay a generic framework, and the last chapter offers to find out about the first
// thing that must be true and isn't checked yet — the same "Find out" task as on the Model tab, never a second one.
const generic = 'An intention worth understanding. Start with who it serves, what changes for them, and the smallest way to test it.';
function fromOnePage(project: Project, m: BusinessModel): unknown {
  const issues = [{ title: 'The problem', body: m.problem }, { title: 'Who it’s for', body: m.who }, { title: 'How it works and pays', body: m.how }].filter(x => x.body.trim());
  const open = m.assumptions.filter(a => a.state === 'open'), looks = m.assumptions.filter(a => a.state === 'looks-true'), first = open[0];
  const join = (list: typeof open) => list.map(a => a.text).join(' · ').slice(0, 1000);
  return {
    schemaVersion: 1, id: 'project-one-page-v1', projectId: project.id, title: project.title, edition: 'starter',
    scenes: [
      { id: 'hero', type: 'hero', title: project.title, eyebrow: 'Your idea on one page', basis: 'brief', proposition: (m.problem.trim() || project.summary.trim() || generic).slice(0, 1000), image: 'none', caption: 'Built from your one page, in your words. The chapters below are a framework to test it, not researched findings.' },
      ...(issues.length ? [{ id: 'one-page', type: 'problem', title: 'Your idea,\nin your words.', eyebrow: 'Your one page', basis: 'brief', description: 'What you wrote on the Model tab. Each answer is something to test — change it there whenever your thinking moves on.', issues }] : []),
      { id: 'architecture', type: 'architecture', title: 'Make the relationships visible.', eyebrow: 'A first working model', basis: 'assumption', description: 'Start with these roles, then test whether they describe your idea. This is a generic planning structure; no research or industry facts have been generated.',
        nodes: [{ id: 'idea', label: 'Your idea', detail: 'The value you want to create' }, { id: 'people', label: 'People', detail: 'Who might benefit?' }, { id: 'resources', label: 'Resources', detail: 'What would it need?' }, { id: 'outcome', label: 'Outcome', detail: 'What would change?' }],
        connections: [{ from: 'people', to: 'idea', label: 'A need to understand', kind: 'order' }, { from: 'resources', to: 'idea', label: 'Resources to identify', kind: 'goods' }, { from: 'idea', to: 'outcome', label: 'A change to validate', kind: 'goods' }],
      },
      first
        ? { id: 'action', type: 'action', title: 'What must\nbe true?', eyebrow: 'From belief to evidence', basis: 'assumption', description: 'One thing that must be true for this to work. Find out whether it is — one real conversation or observation is enough to start.',
            established: looks.length ? join(looks) : 'Nothing checked yet — that’s where every idea starts.', uncertain: join(open),
            task: { id: `find-out-${first.id}`, assumptionId: first.id, title: findOutTitle(first), minutes: 15, notes: 'Look for one real piece of evidence: ask someone it’s for about a recent time it mattered, or look at what they do today. Then mark what you found on your one page.' } }
        : { id: 'action', type: 'action', title: 'What must\nbe true?', eyebrow: 'From intention to evidence', basis: 'assumption', description: m.assumptions.length ? 'Everything on your one page has been checked. Add the next thing that must be true on the Model tab, and Explore will offer to find out about it.' : 'Add one thing that must be true for this to work on the Model tab, and Explore will offer to find out about it. Or start here:',
            task: { id: 'first-assumption', title: ('Write one testable assumption for ' + project.title).slice(0, 120), minutes: 15, notes: 'Write down who this idea serves, the problem you think they have, and one observation that would challenge your assumption. Choose one person to ask about a recent real experience. This is a suggested starting action, not a researched recommendation.' } },
    ],
  };
}
