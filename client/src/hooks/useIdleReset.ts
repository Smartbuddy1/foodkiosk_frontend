import { useEffect } from "react";

const events = ["pointerdown", "keydown", "touchstart", "mousemove"];

export function useIdleReset(active: boolean, timeoutMs: number, onIdle: () => void) {
  useEffect(() => {
    if (!active) return;
    let timer = window.setTimeout(onIdle, timeoutMs);
    const reset = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(onIdle, timeoutMs);
    };
    events.forEach((event) => window.addEventListener(event, reset, { passive: true }));
    return () => {
      window.clearTimeout(timer);
      events.forEach((event) => window.removeEventListener(event, reset));
    };
  }, [active, onIdle, timeoutMs]);
}
