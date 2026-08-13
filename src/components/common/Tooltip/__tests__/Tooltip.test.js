import { act, render } from '@testing-library/react';
import React, { useEffect, useState } from 'react';

import Tooltip from '../Tooltip';

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
const fire = type => target().dispatchEvent(new MouseEvent(type, { bubbles: true }));

describe('Tooltip (hover)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
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
});
