import { act, render } from '@testing-library/react';
import React from 'react';

import Tooltip from '../Tooltip';

const TARGET_ID = 'tooltip-target';

const renderTooltip = (props = {}) =>
  render(
    <Tooltip target={TARGET_ID} text="Tab title" uncontrolled placement="bottom" hideArrow autohide {...props}>
      <div id={TARGET_ID}>tab</div>
    </Tooltip>
  );

const target = () => document.getElementById(TARGET_ID);
const tooltip = () => document.querySelector('[role="tooltip"]');

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
});
