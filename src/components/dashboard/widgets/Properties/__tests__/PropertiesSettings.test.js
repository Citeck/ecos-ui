import { fireEvent, render } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';

jest.mock('@/actions/properties', () => ({
  getFormList: jest.fn(() => ({ type: 'MOCK_GET_FORM_LIST' }))
}));

const PropertiesSettings = require('../PropertiesSettings').default;

describe('PropertiesSettings', () => {
  const mockStore = configureStore();

  function renderSettings(config = {}, onSave = jest.fn(), onCancel = jest.fn()) {
    const store = mockStore({
      properties: {
        'widget-1': {
          forms: {
            list: [{ id: 'form@custom', title: 'Custom form' }],
            isLoading: false
          }
        }
      }
    });

    const utils = render(
      <Provider store={store}>
        <PropertiesSettings record="app/rec@1" stateId="widget-1" config={config} onSave={onSave} onCancel={onCancel} />
      </Provider>
    );

    return { ...utils, onSave, onCancel };
  }

  function isChecked(checkboxEl) {
    return Boolean(checkboxEl.querySelector('svg path'));
  }

  it('defaults showValidationInViewMode to false and persists toggled value alongside existing config keys', () => {
    const onSave = jest.fn();
    const { container, getByText } = renderSettings({ formId: null, titleAsFormName: false, widgetDisplayCondition: 'true' }, onSave);

    const checkboxes = container.querySelectorAll('.ecos-checkbox');
    expect(checkboxes).toHaveLength(2);
    expect(isChecked(checkboxes[0])).toBe(false);
    expect(isChecked(checkboxes[1])).toBe(false);

    fireEvent.click(checkboxes[1]);
    expect(isChecked(checkboxes[1])).toBe(true);

    fireEvent.click(getByText('properties-widget.settings.btn.save'));

    expect(onSave).toHaveBeenCalledWith({
      formId: null,
      titleAsFormName: false,
      widgetDisplayCondition: 'true',
      showValidationInViewMode: true
    });
  });

  it('hydrates showValidationInViewMode from config when enabled', () => {
    const { container } = renderSettings({ formId: 'form@custom', titleAsFormName: true, showValidationInViewMode: true });

    const checkboxes = container.querySelectorAll('.ecos-checkbox');
    expect(checkboxes).toHaveLength(2);
    expect(isChecked(checkboxes[0])).toBe(true);
    expect(isChecked(checkboxes[1])).toBe(true);
  });
});
