import '../../../../test/mocks';
import BaseReactComponent from '../BaseReactComponent';

describe('BaseReactComponent.clear()', () => {
  /**
   * Creates a minimal mock object matching the shape that clear() accesses.
   */
  function createMockComponent(overrides = {}) {
    return {
      labelElement: null,
      react: {},
      element: null,
      ...overrides
    };
  }

  describe('labelElement null-safety', () => {
    it('should not throw when labelElement is null', () => {
      const component = createMockComponent({ labelElement: null });

      expect(() => {
        BaseReactComponent.prototype.clear.call(component);
      }).not.toThrow();
    });

    it('should call remove() on labelElement when it exists', () => {
      const removeMock = jest.fn();
      const component = createMockComponent({
        labelElement: { remove: removeMock }
      });

      BaseReactComponent.prototype.clear.call(component);

      expect(removeMock).toHaveBeenCalled();
    });
  });

  describe('container removal', () => {
    it('should remove react.container from DOM', () => {
      const parent = document.createElement('div');
      const container = document.createElement('div');
      container._root = { unmount: jest.fn() };
      parent.appendChild(container);

      const component = createMockComponent({
        react: { container }
      });

      BaseReactComponent.prototype.clear.call(component);

      expect(parent.children.length).toBe(0);
      expect(component.react).toEqual({});
    });

    it('should call root.unmount() asynchronously when container has _root', () => {
      jest.useFakeTimers();

      const unmountMock = jest.fn();
      const container = document.createElement('div');
      container._root = { unmount: unmountMock };
      const parent = document.createElement('div');
      parent.appendChild(container);

      const component = createMockComponent({
        react: { container }
      });

      BaseReactComponent.prototype.clear.call(component);

      expect(unmountMock).not.toHaveBeenCalled();

      jest.runAllTimers();

      expect(unmountMock).toHaveBeenCalled();

      jest.useRealTimers();
    });
  });

  describe('inline edit button cleanup', () => {
    it('should remove .ecos-form__inline-edit-button elements from element', () => {
      const element = document.createElement('div');
      const btn1 = document.createElement('button');
      btn1.classList.add('ecos-form__inline-edit-button');
      const btn2 = document.createElement('button');
      btn2.classList.add('ecos-form__inline-edit-button');
      element.appendChild(btn1);
      element.appendChild(btn2);

      const component = createMockComponent({ element });

      BaseReactComponent.prototype.clear.call(component);

      const remaining = element.querySelectorAll('.ecos-form__inline-edit-button');
      expect(remaining.length).toBe(0);
    });

    it('should not throw when element is null', () => {
      const component = createMockComponent({ element: null });

      expect(() => {
        BaseReactComponent.prototype.clear.call(component);
      }).not.toThrow();
    });
  });
});
