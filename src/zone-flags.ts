// zone-flags.ts
export {}; // <-- Makes this file a module, allowing 'declare global'

declare global {
  interface Window {
    __zone_symbol__UNPATCHED_EVENTS?: string[];
  }
}

// Tell Zone.js not to patch these high-frequency events
window.__zone_symbol__UNPATCHED_EVENTS = [
  "scroll",
  "mousemove",
  "touchmove",
  "mousewheel",
];
