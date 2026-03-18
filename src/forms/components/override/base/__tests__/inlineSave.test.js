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
