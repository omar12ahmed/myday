// Where the current MyDay (index.html) is, relative to the built new app (app/dist/index.html).
// Used to send you there when data from an older MyDay needs moving first (see StatusScreens). The dev server
// (npm run dev) doesn't serve the current MyDay, so there's no link there.
export const CURRENT_MYDAY_URL: string | null = import.meta.env.DEV ? null : '../../index.html';
