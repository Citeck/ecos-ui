import { act, render } from '@testing-library/react';
import React, { useEffect, useState } from 'react';

import Tooltip from '../Tooltip';
import { TooltipWrapper } from '../TooltipWrapper';
import { closeAllTooltips } from '../pointerWatchdog';

const TARGET_ID = 'tooltip-target';

/** A child that puts its target into the DOM only after it has mounted, the way `Import` does. */
const LateTarget = () => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    Promise.resolve().then(() => setIsReady(true));
  }, []);

  return isReady ? <div id={TARGET_ID}>tab</div> : null;
};

const renderTooltip = (props = {}) =>
  render(
    <Tooltip target={TARGET_ID} text="Tab title" uncontrolled placement="bottom" hideArrow autohide {...props}>
      <div id={TARGET_ID}>tab</div>
    </Tooltip>
  );

const target = () => document.getElementById(TARGET_ID);
const tooltip = () => document.querySelector('[role="tooltip"]');
/** The `Fade` wrapper: it holds `fade` (opacity 0) until `show` makes the tooltip visible. */
const fade = () => document.querySelector('.ecos-base-tooltip');

/** Native events: the wrapper listens with addEventListener, not through React's synthetic system. */
const fire = (type, init) => target().dispatchEvent(new MouseEvent(type, { bubbles: true, ...init }));

/** The pointer moved, and it is now over `element` — jsdom has no layout, so the hit test is stubbed. */
const movePointerOver = element => {
  document.elementFromPoint = () => element;
  document.dispatchEvent(new MouseEvent('pointermove', { bubbles: true, clientX: 10, clientY: 10 }));
};

/** A bare wrapper with an owner that can be told to ignore what it is asked for. */
const renderWrapper = (props = {}) =>
  render(
    <>
      <div id={TARGET_ID}>tab</div>
      <TooltipWrapper target={TARGET_ID} isOpen={false} needTooltip modifiers={[]} {...props}>
        Tab title
      </TooltipWrapper>
    </>
  );

const openRequests = toggle => toggle.mock.calls.filter(call => call[1] === true);

describe('Tooltip (hover)', () => {
  let elementFromPoint;

  beforeEach(() => {
    jest.useFakeTimers();
    elementFromPoint = document.elementFromPoint;
  });

  afterEach(() => {
    jest.useRealTimers();
    document.elementFromPoint = elementFromPoint;
  });

  it('opens on mouseover and closes on mouseout', async () => {
    renderTooltip();

    fire('mouseover');
    await act(async () => {
      jest.advanceTimersByTime(10);
    });
    expect(tooltip()).not.toBeNull();

    fire('mouseout');
    await act(async () => {
      jest.advanceTimersByTime(10);
    });
    expect(tooltip()).toBeNull();
  });

  // COREDEV-356: on a loaded page React can commit the "open" state only after the
  // pointer has already left the target. Hiding must not depend on that commit having
  // happened, otherwise the tooltip latches open and never goes away.
  it('closes when the pointer leaves before the open state is committed', async () => {
    renderTooltip();

    fire('mouseover');
    jest.advanceTimersByTime(10); // show() runs, React has not re-rendered yet
    fire('mouseout');
    jest.advanceTimersByTime(10); // hide() runs in the same, still uncommitted window

    await act(async () => {});

    expect(tooltip()).toBeNull();
  });

  // The mirror case: the tooltip must still appear when the pointer comes back
  // before the "closed" state has been committed.
  it('opens when the pointer returns before the closed state is committed', async () => {
    renderTooltip();

    fire('mouseover');
    await act(async () => {
      jest.advanceTimersByTime(10);
    });
    expect(tooltip()).not.toBeNull();

    fire('mouseout');
    jest.advanceTimersByTime(10); // hide() runs, not committed yet
    fire('mouseover');
    jest.advanceTimersByTime(10); // show() runs in the same window

    await act(async () => {});

    expect(tooltip()).not.toBeNull();
  });

  // COREDEV-408: `Fade` only puts its `show` class on once the transition timeout has run out, and
  // the CSS fade starts from there — so the tooltip used to sit in the DOM fully transparent for one
  // timeout and half-transparent for the next, which reads as a hint crawling out from under the
  // toolbar. The CSS owns the animation; the class has to be there from the start.
  it('becomes visible without waiting out the fade timeout', async () => {
    renderTooltip();

    fire('mouseover');
    await act(async () => {
      jest.advanceTimersByTime(20); // the tooltip is mounted, still transparent
    });
    await act(async () => {
      jest.advanceTimersByTime(20); // the very next tick has to make it visible
    });

    expect(tooltip()).not.toBeNull();
    expect(fade().className).toContain('show'); // 40 ms in, far short of reactstrap's 150
  });

  // COREDEV-408: the hover listeners are bound to whatever the target id resolves to, and a child
  // that renders nothing until its data arrives is not there yet at that moment. Without picking the
  // target up later the button keeps its silent hover for the rest of the page's life.
  it('opens on a target that appears after it has mounted', async () => {
    render(
      <Tooltip target={TARGET_ID} text="Tab title" uncontrolled placement="bottom" hideArrow autohide>
        <LateTarget />
      </Tooltip>
    );

    await act(async () => {}); // the child mounts its target

    expect(target()).not.toBeNull();

    fire('mouseover');
    await act(async () => {
      jest.advanceTimersByTime(10);
    });

    expect(tooltip()).not.toBeNull();
  });

  // COREDEV-356: the page takes the target away — a tab is closed, or replaced by its own drag
  // clone — while the tooltip is up. A node that is no longer in the document will never send the
  // `mouseout` the tooltip is waiting for, so it has to notice the loss itself.
  it('closes when its target leaves the document', async () => {
    const toggle = jest.fn();
    const { rerender } = renderWrapper({ trigger: 'hover', toggle, isOpen: true });

    // the tab is gone, the way a closed or dragged-away one goes
    await act(async () => {
      rerender(
        <>
          <span>gone</span>
          <TooltipWrapper target={TARGET_ID} isOpen needTooltip modifiers={[]} trigger="hover" toggle={toggle}>
            Tab title
          </TooltipWrapper>
        </>
      );
    });

    expect(toggle.mock.calls.map(call => call[1])).toEqual([false]);
  });

  // COREDEV-356, the case QA keeps hitting: the pointer ends up somewhere else without the target
  // ever seeing a `mouseout` — it was scrolled out from under a pointer that never moved, or the
  // pointer crossed a gap the browser reported to nobody. The only trustworthy answer is where the
  // pointer actually is.
  it('closes when the pointer turns out to be elsewhere, without any mouseout', async () => {
    renderTooltip();

    fire('mouseover');
    await act(async () => {
      jest.advanceTimersByTime(10);
    });
    expect(tooltip()).not.toBeNull();

    await act(async () => {
      movePointerOver(document.body);
      jest.advanceTimersByTime(60);
    });

    expect(tooltip()).toBeNull();
  });

  // The tab strip's own case: the page scrolls the target out from under a pointer that NEVER
  // moves — so there is no `pointermove` to re-seed the position, and the watchdog lives entirely
  // off the seed taken from the opening `mouseover` plus the `scroll` listener. Both halves are
  // asserted here: the seed keeps the tooltip open while it still lands on the target, and the
  // `scroll` re-check closes it once it does not.
  it('closes on a scroll that moves the target away, with the position seeded by the opening hover', async () => {
    renderTooltip();
    document.elementFromPoint = (x, y) => (x === 300 && y === 40 ? target() : document.body);

    fire('mouseover', { clientX: 300, clientY: 40 });
    await act(async () => {
      jest.advanceTimersByTime(10);
    });
    expect(tooltip()).not.toBeNull();

    // the seeded position still lands on the target — a scroll must not close it
    await act(async () => {
      document.dispatchEvent(new Event('scroll'));
      jest.advanceTimersByTime(60);
    });
    expect(tooltip()).not.toBeNull();

    // the page has now scrolled the target away from under the pointer, which never moved
    document.elementFromPoint = () => document.body;
    await act(async () => {
      document.dispatchEvent(new Event('scroll'));
      jest.advanceTimersByTime(120);
    });
    expect(tooltip()).toBeNull();
  });

  // The watchdog's close must go through the ordinary hide delay: a pointer travelling across the
  // offset gap between the target and an interactive tooltip's body is momentarily over neither,
  // and an outright close there would kill the tooltip the instant before the pointer reached it.
  // Landing on the body cancels the scheduled close, exactly as it cancels the `mouseout` one.
  it('lets the pointer cross the gap onto a non-autohide tooltip past a watchdog tick', async () => {
    renderTooltip({ autohide: false, delay: { show: 0, hide: 450 }, contentComponent: <button type="button">action</button> });

    fire('mouseover');
    await act(async () => {
      jest.advanceTimersByTime(10);
    });
    expect(tooltip()).not.toBeNull();

    // mid-flight: the pointer is in the gap — over neither the target nor the tooltip body
    await act(async () => {
      movePointerOver(document.body);
      jest.advanceTimersByTime(100);
    });
    expect(tooltip()).not.toBeNull();

    // it lands on the body before the hide delay runs out — the scheduled close is cancelled
    await act(async () => {
      tooltip().dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
      jest.advanceTimersByTime(600);
    });
    expect(tooltip()).not.toBeNull();
  });

  // `minWidthByContent` reads the target's computed width on every render, and the closing render
  // runs after the target is already gone — `getComputedStyle(null)` would take the render down.
  it('renders through a minWidthByContent re-render after the target has just left the document', async () => {
    renderTooltip({ minWidthByContent: true });

    fire('mouseover');
    await act(async () => {
      jest.advanceTimersByTime(10);
    });
    expect(tooltip()).not.toBeNull();

    await act(async () => {
      // the id no longer resolves — for `getElementById` the target is gone, the way a replaced
      // tab node is; the node itself stays React-managed, so it is not detached by hand here
      target().id = 'detached-target';
      movePointerOver(document.body);
      jest.advanceTimersByTime(120);
    });

    expect(tooltip()).toBeNull();
  });

  // `closeAllTooltips` is the tab strip's pre-emptive close for targets it is about to move itself.
  // Its contract has two halves: pointer-opened tooltips close, controlled ones are left alone.
  it('closeAllTooltips closes the pointer-opened tooltip and leaves a controlled one alone', async () => {
    const toggle = jest.fn();
    render(
      <>
        <div id="controlled-target">anchor</div>
        <TooltipWrapper target="controlled-target" isOpen needTooltip modifiers={[]} toggle={toggle} trigger="click">
          controlled content
        </TooltipWrapper>
      </>
    );
    renderTooltip();

    fire('mouseover');
    await act(async () => {
      jest.advanceTimersByTime(10);
    });
    expect(document.querySelectorAll('[role="tooltip"]').length).toBe(2);

    await act(async () => {
      closeAllTooltips();
      jest.advanceTimersByTime(120);
    });

    expect(document.querySelectorAll('[role="tooltip"]').length).toBe(1);
    expect(toggle.mock.calls.some(call => call[1] === false)).toBe(false);
  });

  // The watchdog's listeners are document-wide, so they must not outlive the tooltips they serve:
  // an idle page pays nothing for them. The pointer's position is seeded from the `mouseover` that
  // opens the tooltip rather than by listening to every move the page ever sees.
  it('holds the document listeners only while a pointer-opened tooltip is open', async () => {
    const added = jest.spyOn(document, 'addEventListener');
    const removed = jest.spyOn(document, 'removeEventListener');
    const moves = spy => spy.mock.calls.filter(call => call[0] === 'pointermove').length;

    renderTooltip();
    await act(async () => {
      jest.advanceTimersByTime(10);
    });
    expect(moves(added)).toBe(0);

    fire('mouseover');
    await act(async () => {
      jest.advanceTimersByTime(10);
    });
    expect(tooltip()).not.toBeNull();
    expect(moves(added)).toBe(1);
    expect(moves(removed)).toBe(0);

    fire('mouseout');
    await act(async () => {
      jest.advanceTimersByTime(60);
    });
    expect(tooltip()).toBeNull();
    expect(moves(removed)).toBe(1);

    added.mockRestore();
    removed.mockRestore();
  });

  // The other half of that rule: `autohide: false` promises the pointer may travel onto the tooltip
  // itself — the interactive ones live on that, and the watchdog must not close them under it.
  it('stays open while the pointer is on the tooltip body of a non-autohide tooltip', async () => {
    renderTooltip({ autohide: false, contentComponent: <button type="button">action</button> });

    fire('mouseover');
    await act(async () => {
      jest.advanceTimersByTime(10);
    });
    expect(tooltip()).not.toBeNull();

    await act(async () => {
      movePointerOver(tooltip());
      jest.advanceTimersByTime(60);
    });

    expect(tooltip()).not.toBeNull();
  });

  // COREDEV-356 review: a controlled owner may drop the request on the floor. Holding on to an
  // intent that was never taken up latched the tooltip shut — no later hover could open it.
  it('opens on a later hover after the owner ignored the first request', async () => {
    const toggle = jest.fn();
    const { rerender } = renderWrapper({ trigger: 'hover', toggle });

    fire('mouseover');
    await act(async () => {
      jest.advanceTimersByTime(10);
    });
    expect(openRequests(toggle)).toHaveLength(1);

    // the owner re-renders without granting the request
    await act(async () => {
      rerender(
        <>
          <div id={TARGET_ID}>tab</div>
          <TooltipWrapper target={TARGET_ID} isOpen={false} needTooltip modifiers={[]} trigger="hover" toggle={toggle}>
            Tab title
          </TooltipWrapper>
        </>
      );
    });

    fire('mouseout');
    fire('mouseover');
    await act(async () => {
      jest.advanceTimersByTime(60);
    });

    expect(openRequests(toggle)).toHaveLength(2);
  });

  // COREDEV-356 review: both clicks used to read a prop that still said "closed" and both asked for
  // "open", so the second click did nothing and the tooltip could no longer be clicked away.
  it('closes on the second of two clicks landing in one commit window', () => {
    const toggle = jest.fn();
    renderWrapper({ trigger: 'click', toggle });

    fire('click');
    jest.advanceTimersByTime(10);
    fire('click');
    jest.advanceTimersByTime(60);

    expect(toggle.mock.calls.map(call => call[1])).toEqual([true, false]);
  });
});
