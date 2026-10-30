// Where Ask MyDay's last Undo is kept on this device (ai/lastAsk.ts). On its own so sync can forget it when MyDay's data
// leaves the device (signing out, or another account's data cleared) without bringing in Ask's code.
export const LAST_ASK_KEY = 'myday.ask.lastUndo';
