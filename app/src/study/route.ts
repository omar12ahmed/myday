// Study's screens live under #study/… in the address, as in the current MyDay:
//   #study · #study/roadmap · #study/course/<id> · #study/task/<id> · #study/session · #study/checkin/<id>
//   #study/revise · #study/concepts · #study/concept/<id> · #study/progress · #study/settings
export function studyRoute(hash: string): { view: string; id: string } {
  const parts = hash.replace('#', '').split('/').map(decodeURIComponent);
  return { view: parts[1] || 'home', id: parts[2] || '' };
}

// Go to a Study screen (or redraw, if already there).
export function go(hash: string) {
  if (location.hash !== '#' + hash) location.hash = hash;
}
