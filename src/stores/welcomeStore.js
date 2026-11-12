import { useSyncExternalStore } from "react";

/**
 * Tiny external store (no extra dependency) for the guest welcome screen.
 *
 * state.current  – the arrival being welcomed right now (or null = idle screen)
 * state.queue    – arrivals waiting their turn, so a burst of scans is never lost
 *
 * Arrivals reach the store from two live sources (see welcomeService.js):
 *   1. Firestore, so a TV on another device updates the moment a guest is approved.
 *   2. BroadcastChannel, so a second window on the same computer updates instantly.
 * The store de-duplicates them, so each guest is welcomed once.
 */
let state = { current: null, queue: [] };
const listeners = new Set();
const seen = new Set();

function emit(next) {
  state = next;
  listeners.forEach((listener) => listener());
}

export const welcomeStore = {
  getState: () => state,

  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  /** Remember a guest as already welcomed without showing them (existing approvals on page load). */
  markSeen(key) {
    seen.add(key);
  },

  /** Add an arrival. Returns false if this guest was already welcomed. */
  enqueue(arrival) {
    if (!arrival?.key || seen.has(arrival.key)) return false;
    seen.add(arrival.key);
    if (!state.current) emit({ current: arrival, queue: state.queue });
    else emit({ current: state.current, queue: [...state.queue, arrival] });
    return true;
  },

  /** Move on to the next waiting arrival, or back to the idle screen. */
  next() {
    const [head, ...rest] = state.queue;
    emit({ current: head || null, queue: rest });
  },

  reset() {
    seen.clear();
    emit({ current: null, queue: [] });
  },
};

export function useWelcomeState() {
  return useSyncExternalStore(welcomeStore.subscribe, welcomeStore.getState, welcomeStore.getState);
}
