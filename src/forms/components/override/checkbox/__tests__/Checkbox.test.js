import '../../../../test/mocks';
import { applyCheckboxVisibility } from '../Checkbox';

describe('Checkbox applyCheckboxVisibility', () => {
  function createContext(overrides = {}) {
    const element = document.createElement('div');
    element.style.visibility = 'visible';
    element.style.position = 'relative';

    return {
      options: { builder: false },
      component: { logic: [{ name: 'test-logic' }], hidden: false },
      element,
      _visible: true,
      parent: null,
      ...overrides
    };
  }

  it('should hide element when customConditional sets _visible to false even if component.hidden is false', () => {
    const ctx = createContext({ _visible: false });

    applyCheckboxVisibility(ctx);

    expect(ctx.element.hidden).toBe(true);
    expect(ctx.element.style.visibility).toBe('hidden');
    expect(ctx.element.style.position).toBe('absolute');
  });

  it('should show element when both _visible is true and component.hidden is false', () => {
    const ctx = createContext({ _visible: true });
    ctx.element.setAttribute('hidden', true);

    applyCheckboxVisibility(ctx);

    expect(ctx.element.hidden).toBe(false);
    expect(ctx.element.style.visibility).toBe('visible');
    expect(ctx.element.style.position).toBe('relative');
  });

  it('should hide element when component.hidden is true regardless of _visible', () => {
    const ctx = createContext({ _visible: true });
    ctx.component.hidden = true;

    applyCheckboxVisibility(ctx);

    expect(ctx.element.hidden).toBe(true);
    expect(ctx.element.style.visibility).toBe('hidden');
    expect(ctx.element.style.position).toBe('absolute');
  });

  it('should do nothing in builder mode', () => {
    const ctx = createContext({ _visible: false });
    ctx.options.builder = true;

    applyCheckboxVisibility(ctx);

    expect(ctx.element.hidden).toBe(false);
    expect(ctx.element.style.visibility).toBe('visible');
  });

  it('should do nothing when logic is empty', () => {
    const ctx = createContext({ _visible: false });
    ctx.component.logic = [];

    applyCheckboxVisibility(ctx);

    expect(ctx.element.hidden).toBe(false);
    expect(ctx.element.style.visibility).toBe('visible');
  });

  it('should not hide when _visible is undefined (treats as visible)', () => {
    const ctx = createContext();
    delete ctx._visible;
    ctx.element.setAttribute('hidden', true);

    applyCheckboxVisibility(ctx);

    expect(ctx.element.hidden).toBe(false);
    expect(ctx.element.style.visibility).toBe('visible');
  });

  it('should hide element when both _visible is false and component.hidden is true', () => {
    const ctx = createContext({ _visible: false });
    ctx.component.hidden = true;

    applyCheckboxVisibility(ctx);

    expect(ctx.element.hidden).toBe(true);
    expect(ctx.element.style.visibility).toBe('hidden');
  });

  it('should not mutate DOM when element is already in the correct hidden state', () => {
    const ctx = createContext({ _visible: false });
    ctx.element.setAttribute('hidden', true);
    ctx.element.style.visibility = 'hidden';
    ctx.element.style.position = 'absolute';

    const setAttributeSpy = jest.spyOn(ctx.element, 'setAttribute');

    applyCheckboxVisibility(ctx);

    expect(setAttributeSpy).not.toHaveBeenCalled();
  });

  it('should apply columns autoAdjust visibility when showing in autoAdjust columns parent', () => {
    const ctx = createContext({ _visible: true });
    ctx.element.setAttribute('hidden', true);
    ctx.component.hidden = false;
    ctx.parent = {
      parent: {
        component: { type: 'columns', autoAdjust: true }
      }
    };

    applyCheckboxVisibility(ctx);

    expect(ctx.element.style.visibility).toBe('hidden');
    expect(ctx.element.style.position).toBe('relative');
  });
});
