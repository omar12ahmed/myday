// Where Ask MyDay's last Undo (ai/lastAsk.ts) and today's conversation (ai/keptConversation.ts) are kept on this device.
// On their own so sync can forget them when MyDay's data leaves the device (signing out, or another account's data
// cleared) without bringing in Ask's code.
export const LAST_ASK_KEY = 'myday.ask.lastUndo';
export const KEPT_CONVERSATION_KEY = 'myday.ask.conversation';
