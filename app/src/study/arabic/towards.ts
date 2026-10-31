// Whether Study home's Arabic card says what your next lesson is a step towards (specs/arabic-route.md): shown unless
// you hide it there; brought back from "Your route" on the Arabic map. Remembered on this device
// (myday.arabic.towardshome), not part of your MyDay data.
export const TOWARDS_HOME_KEY = 'myday.arabic.towardshome';
export const towardsOnHome = () => { try { return localStorage.getItem(TOWARDS_HOME_KEY) !== 'hidden'; } catch { return true; } };
export const setTowardsOnHome = (on: boolean) => { try { localStorage.setItem(TOWARDS_HOME_KEY, on ? 'shown' : 'hidden'); } catch { /* For this visit only if storage is unavailable. */ } };
