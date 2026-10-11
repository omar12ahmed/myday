import { useSyncExternalStore } from 'react';
const query=window.matchMedia('(prefers-reduced-motion: reduce)');
const subscribe=(listener:()=>void)=>{query.addEventListener('change',listener);return ()=>query.removeEventListener('change',listener);};
export function useReducedMotion() { return useSyncExternalStore(subscribe,()=>query.matches); }
