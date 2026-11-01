// "Help me start" from Today's plan (specs/help-me-start.md): the Up next task's own page opens with the card already
// open. Kept here (not in the address) for that one arrival, like Ask's hand-over to Help me adjust today.
let pending: string | null = null;
export function openHelpMeStart(id: string) { pending = id; location.hash = `today/tasks/${id}`; }
// True once, for the task it was opened for.
export function takeHelpMeStart(id: string): boolean { if (pending !== id) return false; pending = null; return true; }
