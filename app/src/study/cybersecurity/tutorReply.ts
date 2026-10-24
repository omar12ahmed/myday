// A version-1 tutor reply, as the app before 1.75.0 showed it (TutorCard now asks for version 2: tutor-shape.ts). Kept
// for the evaluation and the tests that show version-1 replies are unchanged for the published app.
export function tutorReply(text: string, lessonId: string): { explanation: string; nextStep: string } | null {
  try {
    const x: unknown = JSON.parse(text);
    if (!x || typeof x !== 'object' || Array.isArray(x)) return null;
    const r = x as Record<string, unknown>;
    if (Object.keys(r).some(k => !['lessonId','explanation','nextStep'].includes(k)) || r.lessonId !== lessonId ||
      typeof r.explanation !== 'string' || !r.explanation.trim() || r.explanation.length > 2400 ||
      typeof r.nextStep !== 'string' || !r.nextStep.trim() || r.nextStep.length > 400) return null;
    return { explanation: r.explanation, nextStep: r.nextStep };
  } catch { return null; }
}
