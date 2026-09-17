import { act, render, screen } from '@testing-library/react';
import path from 'path';
import React from 'react';

import { ROOT, cascade, compileScss, element } from '@/testUtils/cssCascade';

/**
 * Reported by the owner during COREDEV-534: the AI popup stayed on screen after switching to
 * another in-app tab. ecos-ui keeps every page tab mounted and hides the inactive one with
 * `display: none` on its `.ecos-main-content`, while the popup is portalled to `document.body` —
 * outside that wrapper — so it floated over a completely unrelated page.
 *
 * A hidden ancestor collapses the popup's anchors to a 0x0 box (verified in the browser: a
 * ResizeObserver on the anchor fires with zero sizes when an ancestor turns `display: none`, and
 * again with real sizes when it comes back). That is the signal used here, so the popup needs to
 * know nothing about tabs.
 *
 * Two things make this more than a `return null`:
 *  - the children hold text the user is typing (the prompt, the retry instruction), so the popup is
 *    hidden while staying mounted;
 *  - a hidden anchor can be replaced outright by the host instead of coming back — the BPMN
 *    properties form is rebuilt on every tab activation — and a detached element never reports to a
 *    ResizeObserver again, so the popup tells its owner to close instead of latching hidden.
 */

jest.mock('react-popper', () => ({
  usePopper: () => ({
    styles: { popper: {} },
    attributes: { popper: {} },
    state: { placement: 'bottom-start' },
    update: () => Promise.resolve()
  })
}));

const AIPopperWrapper = require('../AIQuickActions/components/AIPopperWrapper').default;

/** ResizeObserver whose callbacks can be fired on demand; the jsdom setup stub does nothing. */
const observers = [];

class TestResizeObserver {
  constructor(callback) {
    this.callback = callback;
    this.targets = [];
    observers.push(this);
  }
  observe(el) {
    this.targets.push(el);
  }
  unobserve() {}
  disconnect() {
    this.targets = [];
  }
}

/** Fire every live observer, the way the browser does after a layout change. */
const notifyObservers = () => act(() => observers.forEach(o => o.targets.length && o.callback([], o)));

/** Let the hidden-state poll run `times` times (one tick is 500ms). */
const runRecheckPoll = (times = 1) => act(() => jest.advanceTimersByTime(500 * times + 100));

/** An element with a stubbed layout box; `size(0, 0)` is what a `display: none` ancestor produces. */
const anchor = (width, height) => {
  const el = document.createElement('div');
  let box = { width, height };

  el.getBoundingClientRect = () => ({
    width: box.width,
    height: box.height,
    top: 0,
    left: 0,
    right: box.width,
    bottom: box.height,
    x: 0,
    y: 0,
    toJSON: () => ({})
  });
  el.size = (w, h) => {
    box = { width: w, height: h };
  };

  document.body.appendChild(el);

  return el;
};

/** The popup's outer element, or null when it is not in the document at all. */
const popupBox = () => screen.queryByTestId('ai-popup-content')?.closest('.ai-popper') || null;

/** Hiding is driven by a class, not an inline style — see the stylesheet test at the bottom. */
const isShown = () => {
  const box = popupBox();

  return !!box && !box.classList.contains('ai-popper--anchor-hidden');
};

describe('AI popup hides with the page tab it belongs to (COREDEV-534)', () => {
  let originalResizeObserver;

  beforeEach(() => {
    jest.useFakeTimers();
    observers.length = 0;
    originalResizeObserver = window.ResizeObserver;
    window.ResizeObserver = TestResizeObserver;
  });

  afterEach(() => {
    jest.useRealTimers();
    window.ResizeObserver = originalResizeObserver;
    // The popup is portalled into `document.body`; wiping it here would tear the portal's node out
    // from under React's own cleanup. The stub anchors are addressed by reference, so leaving them
    // in place between tests is harmless.
  });

  const renderPopup = ({ referenceElement, boundaryElement, stickyPosition = false, onAnchorLost }) =>
    render(
      <AIPopperWrapper
        isVisible
        referenceElement={referenceElement}
        boundaryElement={boundaryElement}
        stickyPosition={stickyPosition}
        onAnchorLost={onAnchorLost}
      >
        <div data-testid="ai-popup-content">Сгенерированный результат</div>
      </AIPopperWrapper>
    );

  it('shows while the field and its trigger are on screen', () => {
    renderPopup({ referenceElement: anchor(24, 24), boundaryElement: anchor(280, 200) });

    expect(isShown()).toBe(true);
  });

  it('hides once the tab is switched away and the field loses its box', () => {
    const field = anchor(280, 200);

    renderPopup({ referenceElement: anchor(24, 24), boundaryElement: field });
    expect(isShown()).toBe(true);

    field.size(0, 0);
    notifyObservers();

    expect(isShown()).toBe(false);
  });

  it('hides when it is the trigger that loses its box, with no field given', () => {
    const trigger = anchor(24, 24);

    renderPopup({ referenceElement: trigger });
    expect(isShown()).toBe(true);

    trigger.size(0, 0);
    notifyObservers();

    expect(isShown()).toBe(false);
  });

  it('keeps the children mounted while hidden, so typed text survives the trip', () => {
    const field = anchor(280, 200);

    renderPopup({ referenceElement: anchor(24, 24), boundaryElement: field });

    field.size(0, 0);
    notifyObservers();

    // Hidden, not unmounted: an unmount would reset the prompt and the retry instruction, and the
    // children's autofocus effects would grab the keyboard on the way back.
    expect(screen.getByTestId('ai-popup-content')).toBeInTheDocument();
    expect(popupBox().classList.contains('ai-popper--anchor-hidden')).toBe(true);
  });

  it('shows again when the same anchor regains its box', () => {
    const field = anchor(280, 200);

    renderPopup({ referenceElement: anchor(24, 24), boundaryElement: field });

    field.size(0, 0);
    notifyObservers();
    expect(isShown()).toBe(false);

    field.size(280, 200);
    notifyObservers();
    expect(isShown()).toBe(true);
  });

  it('recovers from the hidden-state poll alone, with no ResizeObserver report', () => {
    // The observer can stay silent while a host re-lays-out around the anchor; the poll is what
    // makes the return reliable.
    const field = anchor(280, 200);

    renderPopup({ referenceElement: anchor(24, 24), boundaryElement: field });

    field.size(0, 0);
    notifyObservers();
    expect(isShown()).toBe(false);

    field.size(280, 200);
    runRecheckPoll();

    expect(isShown()).toBe(true);
  });

  it('tells the owner to close when the anchors are torn out of the document', () => {
    // The BPMN properties form is rebuilt on tab activation: the old nodes end up detached and
    // never report again. Latching hidden there would leave the owner believing it is open and its
    // trigger doing nothing at all.
    const field = anchor(280, 200);
    const onAnchorLost = jest.fn();

    renderPopup({ referenceElement: anchor(24, 24), boundaryElement: field, onAnchorLost });

    field.size(0, 0);
    notifyObservers();
    expect(onAnchorLost).not.toHaveBeenCalled();

    field.remove();
    runRecheckPoll();
    // One detached tick is not enough: a host swapping the field's DOM gets a moment to hand React
    // the replacement nodes before the popup gives up on them.
    expect(onAnchorLost).not.toHaveBeenCalled();

    runRecheckPoll();
    expect(onAnchorLost).toHaveBeenCalled();
  });

  it('keeps asking until the owner actually closes, since its close handler can be a no-op', () => {
    // `closeResult` does nothing while an apply is in flight and `closeActionsBar` nothing while a
    // generation is: a single notification can be swallowed with no effect at all.
    const field = anchor(280, 200);
    const onAnchorLost = jest.fn();

    renderPopup({ referenceElement: anchor(24, 24), boundaryElement: field, onAnchorLost });

    field.size(0, 0);
    notifyObservers();
    field.remove();

    runRecheckPoll(2);
    const afterFirst = onAnchorLost.mock.calls.length;

    runRecheckPoll(2);

    expect(afterFirst).toBeGreaterThan(0);
    expect(onAnchorLost.mock.calls.length).toBeGreaterThan(afterFirst);
  });

  it('forgets the detached streak if the anchor comes back mid-way', () => {
    const field = anchor(280, 200);
    const onAnchorLost = jest.fn();

    renderPopup({ referenceElement: anchor(24, 24), boundaryElement: field, onAnchorLost });

    field.size(0, 0);
    notifyObservers();

    field.remove();
    runRecheckPoll();

    document.body.appendChild(field);
    field.size(280, 200);
    runRecheckPoll();

    expect(onAnchorLost).not.toHaveBeenCalled();
    expect(isShown()).toBe(true);
  });

  it('does not cry anchor-lost while the anchor is merely hidden', () => {
    const field = anchor(280, 200);
    const onAnchorLost = jest.fn();

    renderPopup({ referenceElement: anchor(24, 24), boundaryElement: field, onAnchorLost });

    field.size(0, 0);
    notifyObservers();
    runRecheckPoll(4);

    expect(onAnchorLost).not.toHaveBeenCalled();
  });

  it('watches the field in sticky mode, where the reference is a virtual element outside the page', () => {
    // The Lexical floating popup anchors to a stand-in element appended to `document.body`, which
    // keeps its box whatever the tab does — only the editor root tells the truth there.
    const field = anchor(827, 227);

    renderPopup({ referenceElement: anchor(30, 40), boundaryElement: field, stickyPosition: true });
    expect(isShown()).toBe(true);

    field.size(0, 0);
    notifyObservers();

    expect(isShown()).toBe(false);
  });

  it('keeps a zero-height but laid-out anchor visible', () => {
    // An inline trigger can legitimately measure 0 in one dimension; only losing the box entirely
    // means the page is gone.
    renderPopup({ referenceElement: anchor(24, 0) });

    expect(isShown()).toBe(true);
  });
});

/**
 * `visibility` is inherited, but a descendant that sets it back to `visible` paints even inside a
 * hidden ancestor — and three of the four popup shapes do exactly that (`.ai-popper .ai-actions-bar`,
 * `.ai-actions-bar--visible`, and the `.ai-floating-popup` block). Hiding the container alone left
 * the quick-actions bar and the Lexical floating panel on screen over an unrelated page, as a ghost
 * `pointer-events: none` made unclickable. These check the real compiled stylesheet, not the markup.
 */
describe('the hidden popup really hides every shape it can hold (COREDEV-534)', () => {
  let sheets;

  beforeAll(() => {
    sheets = [compileScss(path.join(ROOT, 'src/components/ai/AIAssistant/AIQuickActions/styles/_ai-quick-actions.scss'))];
  });

  /** `.ai-popper` in its hidden state, wrapping the given chain of child classes. */
  const hiddenPopupWith = (...childClasses) => {
    const popper = element('ai-popper ai-popper--bottom ai-popper--visible ai-popper--anchor-hidden');

    return childClasses.reduce((parent, cls) => {
      const child = element(cls);

      parent.appendChild(child);

      return child;
    }, popper);
  };

  it('hides the container itself and stops it swallowing clicks', () => {
    const popper = element('ai-popper ai-popper--anchor-hidden');

    expect(cascade(popper, sheets, 'visibility')).toBe('hidden');
    expect(cascade(popper, sheets, 'pointer-events')).toBe('none');
  });

  it('hides the quick-actions bar, which re-declares itself visible inside the popper', () => {
    expect(cascade(hiddenPopupWith('ai-actions-bar'), sheets, 'visibility')).toBe('hidden');
  });

  it('hides the quick-actions bar in its own visible state too', () => {
    expect(cascade(hiddenPopupWith('ai-actions-bar ai-actions-bar--visible'), sheets, 'visibility')).toBe('hidden');
  });

  it('hides the Lexical floating panel, two levels down and visible by its own rule', () => {
    expect(cascade(hiddenPopupWith('ai-floating-popup', 'ai-inline-result'), sheets, 'visibility')).toBe('hidden');
    expect(cascade(hiddenPopupWith('ai-floating-popup', 'ai-actions-bar'), sheets, 'visibility')).toBe('hidden');
  });

  it('hides the plain result panel, the one shape that was already covered', () => {
    expect(cascade(hiddenPopupWith('ai-inline-result'), sheets, 'visibility')).toBe('hidden');
  });

  it('leaves every one of them visible while the popup is not hidden', () => {
    const shown = (...childClasses) => {
      const popper = element('ai-popper ai-popper--bottom ai-popper--visible');

      return childClasses.reduce((parent, cls) => {
        const child = element(cls);

        parent.appendChild(child);

        return child;
      }, popper);
    };

    expect(cascade(shown('ai-actions-bar'), sheets, 'visibility')).toBe('visible');
    expect(cascade(shown('ai-floating-popup', 'ai-inline-result'), sheets, 'visibility')).toBe('visible');
  });
});
