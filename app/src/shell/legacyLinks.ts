// Older MyDay links, rewritten to where those screens are now (in place, so Back doesn't return to the old address):
//   #inbox                  → the Inbox's new name:                      #projects
//   #inbox/tasks…           → Tasks moved to Today in 1.12.0:            #today/tasks…
//   #inbox/notes…, #notes…  → Notes are in Projects:                     #projects/notes…
// Bookmarks, links inside notes and the installed app's shortcuts keep working.
export function modernHash(hash: string): string {
  const p = hash.replace(/^#/, '').split('/');
  if (p[0] === 'notes') return '#' + ['projects', 'notes', ...p.slice(1)].join('/');
  if (p[0] !== 'inbox') return hash;
  if (!p[1]) return '#projects';
  if (p[1] === 'notes') return '#' + ['projects', ...p.slice(1)].join('/');
  return '#' + ['today', 'tasks', ...p.slice(p[1] === 'tasks' ? 2 : 1)].join('/');
}
export function fixLegacyHash() {
  const now = modernHash(location.hash);
  if (now !== location.hash) history.replaceState(history.state, '', now);
}
