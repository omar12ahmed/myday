import type { Project } from '../data/types';
import hargeisa from './content/hargeisa.json';
import { validateExplore, type ExploreData } from './schema';

// Your Hargeisa Marketplace project: any title naming Hargeisa (in any of its usual spellings) and a market,
// e.g. "Hargeisa Marketplace", "Hargesia market", "Online market – Hargeysa".
export const isHargeisa = (p: Project) => /\bharg(?:eisa|esia|eysa|aysa)\b/i.test(p.title) && /\bmarket/i.test(p.title);
export function contentForProject(project: Project, example = false): ExploreData {
  if (example || isHargeisa(project)) return validateExplore({ ...hargeisa, projectId: project.id });
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
