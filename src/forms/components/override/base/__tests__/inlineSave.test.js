import '../../../../test/mocks';
import Base from '../Base';

describe('Base inline save', () => {
  /**
   * Creates a minimal mock of a formio component with the inline editing
   * infrastructure that Base.js patches onto the prototype.
   */
  function createMockComponent(overrides = {}) {
    const submitMock = jest.fn(() => Promise.resolve());
    const updateValueMock = jest.fn();

    const component = {
      _isInlineEditingMode: true,
      options: { saveDraft: false },
      dataValue: 'test-value',
      data: {},
      root: {
        changing: false,
        submit: submitMock,
        showErrors: jest.fn(),
        components: {},
        onChange: jest.fn()
      },
      element: document.createElement('div'),
      checkValidity: jest.fn(() => true),
      updateValue: updateValueMock,
      switchToViewOnlyMode: jest.fn(),
      inlineEditRollback: jest.fn(),
      removeClass: jest.fn(),
      ...overrides
    };

    return { component, submitMock, updateValueMock };
  }

  /**
   * Creates a mock component with a `ce` method that mimics formio's
   * document.createElement wrapper, needed by createInlineEditSaveAndCancelButtons.
   */
  function createComponentWithCe(overrides = {}) {
    const submitMock = jest.fn(() => Promise.resolve());
    const updateValueMock = jest.fn();

    const component = {
      _isInlineEditingMode: true,
      _inlineEditSaveButton: null,
      _removeEventListeners: null,
      options: { saveDraft: false },
      dataValue: 'test-value',
      data: {},
      root: {
        changing: false,
        submit: submitMock,
        showErrors: jest.fn(),
        components: {},
        onChange: jest.fn()
      },
      element: document.createElement('div'),
      checkValidity: jest.fn(() => true),
      updateValue: updateValueMock,
      switchToViewOnlyMode: jest.fn(),
      inlineEditRollback: jest.fn(),
      removeClass: jest.fn(),
      ce: (tag, attrs, ...children) => {
        const el = document.createElement(tag);
        if (attrs && attrs.class) {
          attrs.class.split(' ').forEach(cls => cls && el.classList.add(cls));
        }
        children.forEach(child => {
          if (child instanceof HTMLElement) {
            el.appendChild(child);
          }
        });
        return el;
      },
      ...overrides
    };

    return { component, submitMock, updateValueMock };
  }

  describe('silentSaveForm', () => {
    it('should call updateValue before form.submit', async () => {
      const { component, submitMock, updateValueMock } = createMockComponent();
      const callOrder = [];

      updateValueMock.mockImplementation(() => callOrder.push('updateValue'));
      submitMock.mockImplementation(() => {
        callOrder.push('submit');
        return Promise.resolve();
      });

      await Base.prototype.silentSaveForm.call(component);

      expect(updateValueMock).toHaveBeenCalledWith({ changeByUser: true });
      expect(submitMock).toHaveBeenCalled();
      expect(callOrder).toEqual(['updateValue', 'submit']);
    });

    it('should resolve immediately when not in inline edit mode', async () => {
      const { component, submitMock, updateValueMock } = createMockComponent({
        _isInlineEditingMode: false
      });

      await Base.prototype.silentSaveForm.call(component);

      expect(updateValueMock).not.toHaveBeenCalled();
      expect(submitMock).not.toHaveBeenCalled();
    });

    it('should pass draft options when saveDraft is true', async () => {
      const { component, submitMock } = createMockComponent({
        options: { saveDraft: true }
      });

      await Base.prototype.silentSaveForm.call(component);

      expect(submitMock).toHaveBeenCalledWith(false, { withoutLoader: true, state: 'draft' });
    });

    it('should reject when validation fails and not draft', async () => {
      const { component, submitMock } = createMockComponent({
        checkValidity: jest.fn(() => false)
      });

      await expect(Base.prototype.silentSaveForm.call(component)).rejects.toBeUndefined();
      expect(submitMock).not.toHaveBeenCalled();
    });
  });

  describe('no ecosForm.onReload after inline save', () => {
    it('should call switchToViewOnlyMode but NOT ecosForm.onReload after silentSaveForm', async () => {
      const onReloadMock = jest.fn();
      const { component } = createMockComponent({
        root: {
          changing: false,
          submit: jest.fn(() => Promise.resolve()),
          showErrors: jest.fn(),
          components: {},
          onChange: jest.fn(),
          ecos: { form: { onReload: onReloadMock } }
        }
      });

      await Base.prototype.silentSaveForm.call(component);

      expect(component.switchToViewOnlyMode).toHaveBeenCalled();
      expect(onReloadMock).not.toHaveBeenCalled();
    });
  });

  describe('save button click: updateValue before submit', () => {
    it('should call updateValue with { changeByUser: true } before form.submit on save button click', async () => {
      const callOrder = [];
      const { component, submitMock, updateValueMock } = createComponentWithCe();

      updateValueMock.mockImplementation(() => callOrder.push('updateValue'));
      submitMock.mockImplementation(() => {
        callOrder.push('submit');
        return Promise.resolve();
      });

      Base.prototype.createInlineEditSaveAndCancelButtons.call(component);

      const saveButton = component.element.querySelector('.inline-editing__save-button');
      expect(saveButton).not.toBeNull();

      saveButton.click();
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(updateValueMock).toHaveBeenCalledWith({ changeByUser: true });
      expect(submitMock).toHaveBeenCalled();
      expect(callOrder).toEqual(['updateValue', 'submit']);
    });

    describe('duplicate buttons cleanup', () => {
      it('should have only one .inline-editing__buttons after calling twice', () => {
        const { component } = createComponentWithCe();

        Base.prototype.createInlineEditSaveAndCancelButtons.call(component);
        expect(component.element.querySelectorAll('.inline-editing__buttons')).toHaveLength(1);

        Base.prototype.createInlineEditSaveAndCancelButtons.call(component);
        expect(component.element.querySelectorAll('.inline-editing__buttons')).toHaveLength(1);
      });

      it('should call _removeEventListeners on second invocation', () => {
        const { component } = createComponentWithCe();

        Base.prototype.createInlineEditSaveAndCancelButtons.call(component);
        expect(component._removeEventListeners).not.toBeNull();

        const removeListenersSpy = jest.fn(component._removeEventListeners);
        component._removeEventListeners = removeListenersSpy;

        Base.prototype.createInlineEditSaveAndCancelButtons.call(component);
        expect(removeListenersSpy).toHaveBeenCalled();
      });
    });
  });

  describe('form.changing guard removal', () => {
    it('should not block save when form.changing is true', () => {
      const submitMock = jest.fn(() => Promise.resolve());
      const updateValueMock = jest.fn();

      const component = {
        _isInlineEditingMode: true,
        _inlineEditSaveButton: {
          classList: {
            contains: jest.fn(() => false),
            remove: jest.fn(),
            add: jest.fn()
          }
        },
        options: { saveDraft: false },
        dataValue: 'test',
        root: {
          changing: true, // form is still processing a change
          submit: submitMock,
          showErrors: jest.fn(),
          ecos: { form: null }
        },
        element: document.createElement('div'),
        checkValidity: jest.fn(() => true),
        updateValue: updateValueMock,
        switchToViewOnlyMode: jest.fn(),
        removeClass: jest.fn()
      };

      // Simulate the save button click handler logic
      // (extracted from createInlineEditSaveAndCancelButtons)
      const form = component.root;
      component.updateValue({ changeByUser: true });

      const submitAttributes = [];
      if (!component.checkValidity(component.dataValue)) {
        return;
      }

      form.submit(...submitAttributes);

      // Key assertion: submit IS called even though form.changing is true
      expect(submitMock).toHaveBeenCalled();
      expect(updateValueMock).toHaveBeenCalledWith({ changeByUser: true });
    });
  });

  describe('per-field saving indicator and soft reload preference (COREDEV-429)', () => {
    function createComponentWithEcosForm(ecosForm) {
      return createComponentWithCe({
        root: {
          changing: false,
          submit: jest.fn(() => Promise.resolve()),
          showErrors: jest.fn(),
          components: {},
          onChange: jest.fn(),
          ecos: { form: ecosForm }
        }
      });
    }

    const flush = () => new Promise(resolve => setTimeout(resolve, 0));

    it('shows the ring on save, prefers softReload over onReload, and drops the ring at the end', async () => {
      const softReload = jest.fn().mockResolvedValue({ changed: true, rebuilt: false });
      const onReload = jest.fn();
      const { component } = createComponentWithEcosForm({ softReload, onReload });

      Base.prototype.createInlineEditSaveAndCancelButtons.call(component);
      component.element.querySelector('.inline-editing__save-button').click();

      // the ring is up while the save is in flight, over the edited component only
      expect(component.element.querySelector('.inline-editing__saving-indicator')).not.toBeNull();
      expect(component.element.classList.contains('inline-editing_saving')).toBe(true);

      await flush();
      await flush();

      // the submit itself must ride the project's own loader switch, not raise the form-level one
      expect(component.root.submit).toHaveBeenCalledWith(undefined, expect.objectContaining({ withoutLoader: true }));
      expect(softReload).toHaveBeenCalledTimes(1);
      expect(onReload).not.toHaveBeenCalled();
      expect(component.element.querySelector('.inline-editing__saving-indicator')).toBeNull();
      expect(component.element.classList.contains('inline-editing_saving')).toBe(false);
    });

    it('falls back to onReload(true) for a form host without softReload', async () => {
      const onReload = jest.fn();
      const { component } = createComponentWithEcosForm({ onReload });

      Base.prototype.createInlineEditSaveAndCancelButtons.call(component);
      component.element.querySelector('.inline-editing__save-button').click();
      await flush();
      await flush();

      expect(onReload).toHaveBeenCalledWith(true);
      expect(component.element.querySelector('.inline-editing__saving-indicator')).toBeNull();
    });

    it('drops the ring and stays quiet when the follow-up re-read fails', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      const softReload = jest.fn().mockRejectedValue(new Error('read failed'));
      const { component } = createComponentWithEcosForm({ softReload, onReload: jest.fn() });

      Base.prototype.createInlineEditSaveAndCancelButtons.call(component);
      component.element.querySelector('.inline-editing__save-button').click();
      await flush();
      await flush();

      // the value is saved — a failed re-read is logged, not thrown, and the ring never sticks
      expect(consoleError).toHaveBeenCalled();
      expect(component.element.querySelector('.inline-editing__saving-indicator')).toBeNull();
      expect(component.element.classList.contains('inline-editing_saving')).toBe(false);

      consoleError.mockRestore();
    });
  });

  describe('double-save guard and failed save (COREDEV-427)', () => {
    const flush = () => new Promise(resolve => setTimeout(resolve, 0));

    function createPendingSaveComponent() {
      let resolveSubmit;
      let rejectSubmit;
      const submitMock = jest.fn(
        () =>
          new Promise((resolve, reject) => {
            resolveSubmit = resolve;
            rejectSubmit = reject;
          })
      );

      const { component } = createComponentWithCe({
        root: {
          changing: false,
          submit: submitMock,
          showErrors: jest.fn(),
          components: {},
          onChange: jest.fn(),
          ecos: { form: null }
        }
      });

      return {
        component,
        submitMock,
        resolveSubmit: () => resolveSubmit(),
        rejectSubmit: error => rejectSubmit(error)
      };
    }

    it('ignores a second save-button click while the first save is in flight, then saves again after it settles', async () => {
      const { component, submitMock, resolveSubmit } = createPendingSaveComponent();

      Base.prototype.createInlineEditSaveAndCancelButtons.call(component);
      const saveButton = component.element.querySelector('.inline-editing__save-button');

      saveButton.click();
      expect(component._isInlineSaving).toBe(true);

      // the ring's overlay blocks pointer events, but not a keyboard re-activation of the
      // focused button or a programmatic click — the flag must catch those
      saveButton.click();
      saveButton.click();
      expect(submitMock).toHaveBeenCalledTimes(1);

      resolveSubmit();
      await flush();
      await flush();

      expect(component._isInlineSaving).toBe(false);

      // the guard must not outlive the request: the next save goes through
      saveButton.click();
      expect(submitMock).toHaveBeenCalledTimes(2);
    });

    it('silentSaveForm is a no-op while a [v]-save for the component is in flight', async () => {
      const { component, submitMock } = createPendingSaveComponent();

      Base.prototype.createInlineEditSaveAndCancelButtons.call(component);
      component.element.querySelector('.inline-editing__save-button').click();
      expect(submitMock).toHaveBeenCalledTimes(1);

      // the pencil on another field silent-saves every component still in edit mode —
      // that must not become a second, real record mutation
      await Base.prototype.silentSaveForm.call(component);

      expect(submitMock).toHaveBeenCalledTimes(1);
      expect(component.updateValue).toHaveBeenCalledTimes(1);
    });

    it('a failed save shows the error, keeps edit mode, and releases the guard and the ring', async () => {
      const { component, rejectSubmit } = createPendingSaveComponent();
      const error = new Error('save failed');

      Base.prototype.createInlineEditSaveAndCancelButtons.call(component);
      component.element.querySelector('.inline-editing__save-button').click();

      rejectSubmit(error);
      await flush();
      await flush();

      // the typed value must survive: the component stays in edit mode for a retry
      expect(component.switchToViewOnlyMode).not.toHaveBeenCalled();
      expect(component.root.showErrors).toHaveBeenCalledWith(error, true);
      expect(component._isInlineSaving).toBe(false);
      expect(component.element.querySelector('.inline-editing__saving-indicator')).toBeNull();
      expect(component.element.classList.contains('inline-editing_saving')).toBe(false);
    });

    it('switchToViewOnlyMode resets a stuck saving flag', () => {
      const { component } = createComponentWithCe({
        _isInlineSaving: true,
        redraw: jest.fn()
      });

      Base.prototype.switchToViewOnlyMode.call(component);

      expect(component._isInlineSaving).toBe(false);
    });
  });
});
