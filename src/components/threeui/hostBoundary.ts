/* ─────────────────────────────────────────────────────────
 * HOST BOUNDARY
 * Both pages were authored to own the whole window. Embedded
 * in a scrolling portfolio they must hand vertical scrolling
 * back to the host page, or a visitor gets stuck inside them.
 * Nothing in the authored renderers is changed: these only
 * add a capture listener and one CSS rule at the frame edge.
 * ───────────────────────────────────────────────────────── */

const MARK = "data-specter-host";

/** the blank document a frame shows before its page loads. Browsers keep the
 *  same window object when the real page replaces it, so anything attached
 *  to the placeholder would end up attached twice. */
export const isPlaceholder = (doc: Document) => doc.URL === "about:blank";

/** Complete Shelf: its hero wheel handler turns every wheel tick into a
 *  shelf move. Vertical wheel scrolls the portfolio; horizontal wheel and
 *  trackpad swipes, arrows, markers and clicks still drive the shelf. On
 *  touch, vertical swipes over the shelf scroll the page (detail mode keeps
 *  its authored drag and orbit). */
export function shelfHost(frame: HTMLIFrameElement) {
  const win = frame.contentWindow;
  const doc = frame.contentDocument;
  if (!win || !doc?.documentElement || isPlaceholder(doc) || doc.documentElement.hasAttribute(MARK)) return;
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

/* Phones and tablets. The authored page assumes a mouse: books react on
   hover, which iOS turns into "first tap hovers, second tap opens". And
   on a phone an opened volume puts its text below the fold inside the
   frame's own scroll. These rules show the "Read" badge up front on touch
   screens and fit an opened volume into one screen, with its text in the
   panel's own (authored) scroll box. */
const SHOWCASE_TOUCH_CSS = `
@media (hover: none) {
  .book-card:hover { --hover-y: 0px; }
  .book-card:hover .book { transform: none; }
  /* nothing may appear on a touch "hover", or iOS treats the tap as a hover */
  .book-card:hover .open-badge,
  .book-card[data-hovered="true"] .open-badge {
    opacity: 0;
    transform: translate(-50%, -50%) scale(.76) rotate(-3deg);
  }
  [data-mode="gallery"] .book-card[data-book="data"] .open-badge {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1) rotate(-3deg);
  }
}
@media (max-width: 560px) {
  [data-mode="detail"] .stage { min-height: 100svh !important; overflow: hidden !important; }
  [data-mode="detail"] .book-card.selected { left: 27% !important; top: 28svh !important; width: min(32vw, 140px) !important; }
  .detail-panel { top: calc(28svh + 112px) !important; padding-bottom: 0 !important; }
  .detail-title { font-size: 40px !important; margin-bottom: 10px !important; }
  .detail-scroll { max-height: calc(72svh - 112px - 54px - 104px) !important; padding-bottom: 36px !important; }
  .detail-description, .doc-step-copy span, .doc-review { font-size: 15px !important; }
  .bottom-dock .meta-row, .bottom-dock .detail-rule { display: none !important; }
}`;

/** Field Manuals: the stage never scrolls on desktop, so wheel input is
 *  forwarded to the portfolio instead of dying inside the frame. Its own
 *  detail scroller keeps native behaviour. On touch screens a tap opens a
 *  book at once and an opened volume fits the screen. */
export function showcaseHost(frame: HTMLIFrameElement) {
  const win = frame.contentWindow;
  const doc = frame.contentDocument;
  if (!win || !doc?.documentElement || isPlaceholder(doc) || doc.documentElement.hasAttribute(MARK)) return;
  doc.documentElement.setAttribute(MARK, "");

  const style = doc.createElement("style");
  style.textContent = SHOWCASE_TOUCH_CSS;
  doc.head.appendChild(style);

  // a touch never "hovers": keep the authored hover handler from turning
  // the first tap into a hover (iOS then swallows the click)
  win.addEventListener(
    "pointerenter",
    (event) => {
      if (event.pointerType !== "mouse") event.stopPropagation();
    },
    { capture: true },
  );

  // backup: a clean tap on a book opens it even if the browser drops the click
  let start: { x: number; y: number; t: number } | null = null;
  win.addEventListener("touchstart", (e) => {
    const t = e.touches[0];
    start = e.touches.length === 1 ? { x: t.clientX, y: t.clientY, t: Date.now() } : null;
  }, { passive: true, capture: true });
  win.addEventListener("touchend", (e) => {
    const t = e.changedTouches[0];
    const card = (e.target as Element | null)?.closest?.(".book-card") as HTMLButtonElement | null;
    if (!start || !card || !t) return;
    const clean = Math.hypot(t.clientX - start.x, t.clientY - start.y) < 12 && Date.now() - start.t < 600;
    start = null;
    if (!clean) return;
    win.setTimeout(() => {
      if (doc.body.dataset.mode === "gallery") card.click();
    }, 380);
  }, { passive: true, capture: true });

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
