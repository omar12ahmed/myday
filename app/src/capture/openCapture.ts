// Opens the + Capture sheet with something already typed — for a shortcut on a page (e.g. "Plan this course with Ask"
// on a Study course), so the same sheet, the same preview of what's sent and the same checks are used everywhere.
export const CAPTURE_EVENT = 'myday:capture';
// `focus` names the one thing the request is about when the page holds several (e.g. a decision, for "What am I missing?").
export interface AskFocus { decisionId?: string }
export function openCapture(text: string, focus?: AskFocus) { window.dispatchEvent(new CustomEvent(CAPTURE_EVENT, { detail: { text, focus } })); }
