import Choices from '../index';

/**
 * COREDEV-317: the dropdown is torn out of the flow with `position: fixed` so that a panel with
 * `overflow: hidden` cannot cut it off. Its coordinates were computed once, when it opened, so any
 * scroll after that left the list hanging where the field used to be — over whatever widget happens
 * to be underneath.
 */
describe('Choices dropdown position', () => {
  const INPUT_HEIGHT = 40;

  /** The parts of a Choices instance the position code touches, with a movable field. */
  const makeChoices = () => {
    const dropdown = document.createElement('div');
    const inner = document.createElement('div');

    document.body.appendChild(inner);
    document.body.appendChild(dropdown);

    let inputTop = 300;

    inner.getBoundingClientRect = () => ({ top: inputTop, left: 100, height: INPUT_HEIGHT, width: 200, bottom: inputTop + INPUT_HEIGHT });
    dropdown.getBoundingClientRect = () => ({ top: 0, left: 0, height: 150, width: 200, bottom: 150 });

    const instance = {
      dropdown: {
        element: dropdown,
        isActive: false,
        show() {
          this.isActive = true;
        },
        hide() {
          this.isActive = false;
        }
      },
      containerInner: { element: inner },
      containerOuter: { shouldFlip: () => false, open: () => {}, close: () => {} },
      input: { element: document.createElement('input'), focus: () => {} },
      passedElement: { triggerEvent: () => {} },
      clearInput: () => {},
      _canSearch: false,
      moveFieldTo: value => {
        inputTop = value;
      }
    };

    Object.setPrototypeOf(instance, Choices.prototype);

    return instance;
  };

  const nextFrame = () => new Promise(resolve => requestAnimationFrame(() => resolve()));

  afterEach(() => {
    document.body.replaceChildren();
  });

  it('puts the dropdown right under the field when it opens', async () => {
    const choices = makeChoices();

    choices.showDropdown();
    await nextFrame();

    expect(choices.dropdown.element.style.position).toBe('fixed');
    expect(choices.dropdown.element.style.top).toBe(`${300 + INPUT_HEIGHT}px`);
  });

  it('follows the field when the page scrolls under an open dropdown', async () => {
    const choices = makeChoices();

    choices.showDropdown();
    await nextFrame();

    choices.moveFieldTo(120); // the field scrolled up by 180px
    window.dispatchEvent(new Event('scroll'));
    await nextFrame();

    expect(choices.dropdown.element.style.top).toBe(`${120 + INPUT_HEIGHT}px`);
  });

  it('follows the field when the window is resized', async () => {
    const choices = makeChoices();

    choices.showDropdown();
    await nextFrame();

    choices.moveFieldTo(200);
    window.dispatchEvent(new Event('resize'));
    await nextFrame();

    expect(choices.dropdown.element.style.top).toBe(`${200 + INPUT_HEIGHT}px`);
  });

  it('stops following once the dropdown is closed', async () => {
    const choices = makeChoices();

    choices.showDropdown();
    await nextFrame();

    choices.hideDropdown();
    choices.moveFieldTo(50);
    window.dispatchEvent(new Event('scroll'));
    await nextFrame();

    // hiding clears the inline styles; a stale listener would put them back
    expect(choices.dropdown.element.style.top).toBe('');
    expect(choices.dropdown.element.style.position).toBe('');
  });
});
