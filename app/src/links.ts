// Where the current MyDay (index.html) is, relative to the built new app (app/dist/index.html).
// Used to send you there when data from an older MyDay needs moving first (see StatusScreens). The dev server
// (npm run dev) doesn't serve the current MyDay, so there's no link there.
// When building for the website, VITE_CLASSIC_URL says where the current MyDay is published (see deploy/).
export const CURRENT_MYDAY_URL: string | null = import.meta.env.DEV ? null : (import.meta.env.VITE_CLASSIC_URL || '../../index.html');
