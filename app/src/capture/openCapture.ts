// Opens the + Capture sheet with something already typed — for a shortcut on a page (e.g. "Plan this course with Ask"
// on a Study course), so the same sheet, the same preview of what's sent and the same checks are used everywhere.
export const CAPTURE_EVENT = 'myday:capture';
export function openCapture(text: string) { window.dispatchEvent(new CustomEvent(CAPTURE_EVENT, { detail: { text } })); }
