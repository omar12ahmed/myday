// True while Delete everything runs on this page, so the sign-in gate doesn't cover its steps when this device's
// sync notes are cleared half-way (specs/delete-everything.md).
let on = false;
export const setWiping = (v: boolean) => { on = v; };
export const isWiping = () => on;
