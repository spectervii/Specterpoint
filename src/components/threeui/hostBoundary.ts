/* ─────────────────────────────────────────────────────────
 * HOST BOUNDARY
 * Both pages were authored to own the whole window. Embedded
 * in a scrolling portfolio they must hand vertical scrolling
 * back to the host page, or a visitor gets stuck inside them.
 * Nothing in the authored renderers is changed: these only
 * add a capture listener and one CSS rule at the frame edge.
 * ───────────────────────────────────────────────────────── */

const MARK = "data-specter-host";

/** Complete Shelf: its hero wheel handler turns every wheel tick into a
 *  shelf move. Vertical wheel scrolls the portfolio; horizontal wheel and
 *  trackpad swipes, arrows, markers and clicks still drive the shelf. On
 *  touch, vertical swipes over the shelf scroll the page (detail mode keeps
 *  its authored drag and orbit). */
export function shelfHost(frame: HTMLIFrameElement) {
  const win = frame.contentWindow;
  const doc = frame.contentDocument;
  if (!win || !doc?.documentElement || doc.documentElement.hasAttribute(MARK)) return;
  doc.documentElement.setAttribute(MARK, "");

  win.addEventListener(
    "wheel",
    (event) => {
      const experience = doc.getElementById("experience");
      if (experience?.classList.contains("mode-detail")) return;
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      event.stopPropagation();
      event.preventDefault();
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1;
      window.scrollBy({ top: event.deltaY * unit, left: 0, behavior: "instant" as ScrollBehavior });
    },
    { capture: true, passive: false },
  );

  const style = doc.createElement("style");
  style.textContent = `.experience:not(.mode-detail) #scene{touch-action:pan-y !important}`;
  doc.head.appendChild(style);
}

/** Field Manuals: the stage never scrolls on desktop, so wheel input is
 *  forwarded to the portfolio instead of dying inside the frame. Its own
 *  detail scroller keeps native behaviour. */
export function showcaseHost(frame: HTMLIFrameElement) {
  const win = frame.contentWindow;
  const doc = frame.contentDocument;
  if (!win || !doc?.documentElement || doc.documentElement.hasAttribute(MARK)) return;
  doc.documentElement.setAttribute(MARK, "");

  win.addEventListener(
    "wheel",
    (event) => {
      const target = event.target as Element | null;
      const scroller = target?.closest?.(".detail-scroll") as HTMLElement | null;
      if (scroller && scroller.scrollHeight > scroller.clientHeight) {
        const atTop = scroller.scrollTop <= 0 && event.deltaY < 0;
        const atEnd = scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 1 && event.deltaY > 0;
        if (!atTop && !atEnd) return;
      }
      const root = doc.scrollingElement;
      if (root && root.scrollHeight > root.clientHeight + 1) {
        const atTop = root.scrollTop <= 0 && event.deltaY < 0;
        const atEnd = root.scrollTop + root.clientHeight >= root.scrollHeight - 1 && event.deltaY > 0;
        if (!atTop && !atEnd) return;
      }
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      event.preventDefault();
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1;
      window.scrollBy({ top: event.deltaY * unit, left: 0, behavior: "instant" as ScrollBehavior });
    },
    { passive: false },
  );
}
