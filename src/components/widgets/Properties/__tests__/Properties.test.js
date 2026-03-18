import { render } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';

const FORM_MODE_EDIT = 'EDIT';

// Mock EcosForm module (both the default component and named exports)
jest.mock('../../../EcosForm', () => ({
  __esModule: true,
  FORM_MODE_EDIT: 'EDIT',
  FORM_MODE_VIEW: 'VIEW',
  FORM_MODE_CREATE: 'CREATE'
}));

jest.mock('../../../EcosForm/EcosForm', () => {
  const React = require('react');
  return React.forwardRef(function MockEcosForm(props, ref) {
    React.useImperativeHandle(ref, () => ({
      _form: null,
      onReload: jest.fn(),
      onShowFormBuilder: jest.fn()
    }));
    return <div data-testid="mock-ecosform" className={props.className} />;
  });
});

// Must import after mock is set up
const Properties = require('../Properties').default;

describe('Properties', () => {
  const mockStore = configureStore();
  const storeState = { view: { isMobile: false } };

  const defaultProps = {
    record: 'test-record',
    stateId: 'test-state',
    formMode: 'VIEW',
    onFormIsChanged: jest.fn(),
    formId: 'test-form'
  };

  function renderComponent(props = {}) {
    return render(
      <Provider store={mockStore(storeState)}>
        <Properties {...defaultProps} {...props} />
      </Provider>
    );
  }

  describe('Skeleton loader', () => {
    it('should render view-mode skeleton with rows when formMode is VIEW', () => {
      const { container } = renderComponent({ formMode: 'VIEW' });

      const skeleton = container.querySelector('.ecos-properties__skeleton');
      expect(skeleton).toBeInTheDocument();
      expect(skeleton).not.toHaveClass('ecos-properties__skeleton_edit');

      const rows = container.querySelectorAll('.ecos-properties__skeleton-row');
      expect(rows.length).toBe(10);

      // Each row has label + value
      rows.forEach(row => {
        expect(row.querySelector('.ecos-properties__skeleton-label')).toBeInTheDocument();
        expect(row.querySelector('.ecos-properties__skeleton-value')).toBeInTheDocument();
      });
    });

    it('should render edit-mode skeleton with fields when formMode is EDIT', () => {
      const { container } = renderComponent({ formMode: FORM_MODE_EDIT });

      const skeleton = container.querySelector('.ecos-properties__skeleton_edit');
      expect(skeleton).toBeInTheDocument();

      const fields = container.querySelectorAll('.ecos-properties__skeleton-field');
      expect(fields.length).toBe(5);

      // Each field has label + input
      fields.forEach(field => {
        expect(field.querySelector('.ecos-properties__skeleton-label')).toBeInTheDocument();
        expect(field.querySelector('.ecos-properties__skeleton-input')).toBeInTheDocument();
      });

      // Should NOT have view-mode rows
      expect(container.querySelector('.ecos-properties__skeleton-row')).not.toBeInTheDocument();
    });

    it('should apply shimmer animation class to all skeleton elements', () => {
      const { container } = renderComponent({ formMode: 'VIEW' });

      const shimmerElements = container.querySelectorAll('.ecos-properties__shimmer');
      // 10 rows × 2 elements (label + value) = 20
      expect(shimmerElements.length).toBe(20);
    });

    it('should vary value widths for natural appearance', () => {
      const { container } = renderComponent({ formMode: 'VIEW' });

      const values = container.querySelectorAll('.ecos-properties__skeleton-value');
      const widths = new Set();

      values.forEach(el => {
        widths.add(el.style.width);
      });

      // At least some widths should be different
      expect(widths.size).toBeGreaterThan(1);
    });
  });

  describe('minHeight behavior', () => {
    function findContentDiv(container) {
      // The content div wraps renderForm() and has the minHeight style
      const allDivs = container.querySelectorAll('div[style]');
      for (const div of allDivs) {
        if (div.style.minHeight) {
          return div;
        }
      }
      return null;
    }

    it('should apply minHeight from props when form is loading', () => {
      const { container } = renderComponent({ minHeight: 300 });

      const contentDiv = findContentDiv(container);
      expect(contentDiv).not.toBeNull();
      expect(contentDiv.style.minHeight).toBe('300px');
    });

    it('should apply default 50px minHeight when loading and no prop provided', () => {
      const { container } = renderComponent();

      const contentDiv = findContentDiv(container);
      expect(contentDiv).not.toBeNull();
      expect(contentDiv.style.minHeight).toBe('50px');
    });
  });
});
