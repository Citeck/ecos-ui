import throttle from 'lodash/throttle';

/** How often the open hover tooltips are re-checked against the pointer, ms. */
const POINTER_WATCHDOG_THROTTLE = 50;

/**
 * Tooltips that are open because the pointer is on their target.
 *
 * Such a tooltip has exactly one reason to close — `mouseout` on the target node — and the page is
 * free to take that node out from under a pointer that never moves: the tab strip scrolls itself to
 * the active tab, an arrow button is swapped for a placeholder, a dragged tab is replaced by a
 * clone. No `mouseout`, no `hide()`, and the portal in `body` outlives everything that could still
 * refer to it (COREDEV-356).
 *
 * So the pointer is watched centrally instead: while at least one such tooltip is open, the
 * document is asked where the pointer actually is — one `elementFromPoint` per tick, since the
 * answer is the same for every participant — and every tooltip that is no longer under it closes
 * itself: each participant judges `checkPointerAt(element)` and closes with `hide()`. One pair of
 * listeners serves the whole page and both are dropped as soon as the last tooltip closes, so
 * nothing is paid for on an idle page.
 *
 * Only pointer-opened tooltips take part. A click- or focus-opened one is not tied to the pointer
 * at all and must survive it moving away.
 */
const openPointerTooltips = new Set();
let lastPointerPosition = null;
let pointerWatched = false;

const runPointerWatchdog = throttle(
  () => {
    if (!lastPointerPosition || !openPointerTooltips.size || typeof document.elementFromPoint !== 'function') {
      return;
    }

    // `elementFromPoint` is used rather than the targets' own rectangles because it answers the
    // same question the browser's own hover does — it respects stacking and `pointer-events`, so a
    // target scrolled under a toolbar or covered by a dialog counts as left, exactly as it looks.
    const element = document.elementFromPoint(lastPointerPosition.x, lastPointerPosition.y);

    Array.from(openPointerTooltips).forEach(tooltip => tooltip.checkPointerAt(element));
  },
  POINTER_WATCHDOG_THROTTLE,
  { leading: true, trailing: true }
);

function handleDocumentPointerMove(e) {
  lastPointerPosition = { x: e.clientX, y: e.clientY };

  if (openPointerTooltips.size) {
    runPointerWatchdog();
  }
}

/**
 * A scroll moves the target, not the pointer, so nothing else would ever re-check it — this is the
 * page tabs' own case, where the strip scrolls to the active tab under a pointer standing still.
 */
function handleDocumentScroll() {
  runPointerWatchdog();
}

/**
 * Where the pointer is has to be known *before* the watchdog starts: the very case this guards
 * against is a pointer that then never moves again, so the opening `mouseover` may be the last word
 * on its position — and it is the one event that is guaranteed to have happened, since only a
 * pointer-opened tooltip is watched at all. Hence the seed here instead of a document-wide
 * `pointermove` listener kept alive for the lifetime of the page.
 */
export function rememberPointerPosition(e) {
  if (e && typeof e.clientX === 'number' && typeof e.clientY === 'number') {
    lastPointerPosition = { x: e.clientX, y: e.clientY };
  }
}

export function registerOpenTooltip(tooltip) {
  openPointerTooltips.add(tooltip);

  if (!pointerWatched && typeof document !== 'undefined') {
    document.addEventListener('pointermove', handleDocumentPointerMove, true);
    document.addEventListener('scroll', handleDocumentScroll, { capture: true, passive: true });
    pointerWatched = true;
  }
}

export function unregisterOpenTooltip(tooltip) {
  openPointerTooltips.delete(tooltip);

  if (!openPointerTooltips.size && pointerWatched) {
    document.removeEventListener('pointermove', handleDocumentPointerMove, true);
    document.removeEventListener('scroll', handleDocumentScroll, { capture: true });
    runPointerWatchdog.cancel();
    pointerWatched = false;
  }
}

/**
 * Closes every tooltip the pointer is currently holding open.
 *
 * For the places that know beforehand that they are about to move their own targets around — the
 * tab strip scrolling itself, a drag starting or ending — waiting for the watchdog to notice is a
 * frame too late: the tooltip is visibly left behind first.
 *
 * Click- and focus-opened tooltips are deliberately left alone; they are not the pointer's to close.
 */
export function closeAllTooltips() {
  Array.from(openPointerTooltips).forEach(tooltip => tooltip.hide());
}
