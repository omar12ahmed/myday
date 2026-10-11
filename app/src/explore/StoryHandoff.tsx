// An editorial hinge; the same fine line becomes a relationship, a process and then a money flow.
export function StoryHandoff({ from, to, children }: { from: string; to: string; children: React.ReactNode }) {
  return <div className="ex-handoff" data-handoff=""><span className="ex-mono">{from}</span><span className="ex-handoff-line" aria-hidden="true" /><p>{children}</p><span className="ex-mono">{to} <span aria-hidden="true">↘</span></span></div>;
}
