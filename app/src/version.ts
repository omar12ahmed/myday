// Which release of MyDay this is (filled in when the app is built; see vite.config.ts).
declare const __APP_VERSION__: string;
declare const __APP_COMMIT__: string;
declare const __APP_BUILT__: string;

export const APP_VERSION = __APP_VERSION__;
export const APP_COMMIT = __APP_COMMIT__;
export const APP_BUILT = __APP_BUILT__;
// e.g. "MyDay 1.0.0 · a1b2c3d · built 2026-10-02"
export const RELEASE = `MyDay ${APP_VERSION} · ${APP_COMMIT} · built ${APP_BUILT}`;
