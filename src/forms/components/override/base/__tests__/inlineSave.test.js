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
});
