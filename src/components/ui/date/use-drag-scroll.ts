"use client";

import * as React from "react";

// Click-and-drag horizontal scrolling for a scroll container — desktop mouse
// only. Touch/pen keep native momentum scrolling (we bail on non-mouse). A drag
// past a small threshold captures the pointer, scrolls the element, and swallows
// the trailing click so dragging across the day pills doesn't also select a day.
// Returns a ref to attach to the scroller.
export function useDragScroll<
  T extends HTMLElement,
>(): React.RefObject<T | null> {
  const ref = React.useRef<T>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let dragging = false;
    let moved = false;
    let startX = 0;
    let startScroll = 0;
    let dragEndedAt = 0; // timestamp of the last real drag's end
    const THRESHOLD = 4; // px before a press becomes a drag (vs a click)
    const CLICK_SUPPRESS_MS = 100; // only the drag's own trailing click

    const onPointerDown = (e: PointerEvent): void => {
      if (e.pointerType !== "mouse" || e.button !== 0) return; // touch = native
      dragging = true;
      moved = false;
      startX = e.clientX;
      startScroll = el.scrollLeft;
    };

    const onPointerMove = (e: PointerEvent): void => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      if (!moved && Math.abs(dx) > THRESHOLD) {
        moved = true;
        el.setPointerCapture(e.pointerId);
        document.body.style.cursor = "grabbing";
        document.body.style.userSelect = "none";
      }
      if (moved) {
        e.preventDefault();
        el.scrollLeft = startScroll - dx;
      }
    };

    const endDrag = (e: PointerEvent): void => {
      if (!dragging) return;
      dragging = false;
      if (moved) dragEndedAt = performance.now();
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
    };

    // Swallow ONLY the click that immediately ends a real drag, so dragging
    // doesn't select a day. Time-bounded (not a persistent flag) so a later
    // keyboard Space/Enter on a pill — which also fires a click — isn't eaten.
    const onClickCapture = (e: MouseEvent): void => {
      if (performance.now() - dragEndedAt < CLICK_SUPPRESS_MS) {
        e.stopPropagation();
        e.preventDefault();
      }
    };

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove, { passive: false });
    el.addEventListener("pointerup", endDrag);
    el.addEventListener("pointercancel", endDrag);
    el.addEventListener("click", onClickCapture, true); // capture phase

    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", endDrag);
      el.removeEventListener("pointercancel", endDrag);
      el.removeEventListener("click", onClickCapture, true);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, []);

  return ref;
}
