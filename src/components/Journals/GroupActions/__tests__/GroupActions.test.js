import React from 'react';
import { render } from '@testing-library/react';
import 'jest-canvas-mock';

import { GroupActions } from '../GroupActions';

describe('GroupActions tests', () => {
  const baseProps = {
    isMobile: false,
    isSeparateActionListForQuery: false,
    grid: {
      actions: {
        forRecords: {
          actions: [],
        },
      },
    },
    columnsSetup: {},
    selectedRecords: [],
    excludedRecords: [],
    selectAllPageRecords: false,
    selectAllRecordsVisible: false,
    source: [],
  };

  describe('<GroupActions />', () => {
    it('should render GroupActions component', () => {
      const { container } = render(<GroupActions {...baseProps} />);

      expect(container).toMatchSnapshot();
    });
  });

  describe('<GroupActions />', () => {
    it('should group action button is disabled', () => {
      const attachTo = document.createElement('div');
      document.body.appendChild(attachTo);

      const { container } = render(<GroupActions {...baseProps} />, { attachTo });

      const disabledComponents = container.getElementsByClassName('ecos-dropdown-outer_disabled');
      expect(disabledComponents).toHaveLength(1);

      const groupActionSelector = container.getElementsByClassName('ecos-group-actions__control');
      expect(groupActionSelector[0].disabled).toBeTruthy();
    });
  });

  describe('<GroupActions />', () => {
    it('should group action button is enabled', () => {
      const props = {
        ...baseProps,
        grid: {
          actions: {
            forRecords: {
              actions: [
                {
                  name: 'Скачать как Zip',
                  pluralName: 'Скачать как Zip',
                  type: 'download-zip',
                  theme: '',
                  icon: 'icon-download',
                  config: {},
                  confirm: null,
                  result: null,
                  features: { execForQuery: false, execForRecord: false, execForRecords: true },
                  id: 'download-zip',
                  __act_ctx__: { recordMask: 1, context: { mode: 'journal', scope: 'gr-requests-view' } },
                },
              ],
            },
          },
        },
      };
      const attachTo = document.createElement('div');
      document.body.appendChild(attachTo);

      const { container } = render(<GroupActions {...props} />, { attachTo });

      const disabledComponent = container.getElementsByClassName('ecos-dropdown-outer_disabled');
      expect(disabledComponent).toHaveLength(0);

      const groupActionSelector = container.getElementsByClassName('ecos-group-actions__control');
      expect(groupActionSelector[0].disabled).toBeFalsy();
    });
  });
});
