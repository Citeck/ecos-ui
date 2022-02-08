import React from 'react';
import { shallow, configure, mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import 'jest-canvas-mock';

import { GroupActions } from '../GroupActions';

configure({ adapter: new Adapter() });

describe('GroupActions tests', () => {
  const baseProps = {
    isMobile: false,
    isSeparateActionListForQuery: false,
    grid: {
      actions: {
        forRecords: {
          actions: []
        }
      }
    },
    columnsSetup: {},
    selectedRecords: [],
    excludedRecords: [],
    selectAllPageRecords: false,
    selectAllRecordsVisible: false,
    source: []
  };

  describe('<GroupActions />', () => {
    it('should render GroupActions component', () => {
      const component = shallow(<GroupActions {...baseProps} />);

      expect(component).toMatchSnapshot();
    });
  });

  describe('<GroupActions />', () => {
    it('should group action button is disabled', () => {
      const attachTo = document.createElement('div');

      document.body.appendChild(attachTo);

      const component = mount(<GroupActions {...baseProps} />, { attachTo });

      return Promise.resolve(component)
        .then(() => {
          const disabledComponents = component.find('.ecos-dropdown-outer_disabled');

          expect(disabledComponents.length).toBe(1);

          const groupActionSelector = component.find('.ecos-btn.ecos-group-actions__control');

          expect(groupActionSelector.props().disabled).toBeTruthy();
          expect(groupActionSelector.is('[disabled]')).toBe(true);
        })
        .then(() => component.unmount());
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
                  __act_ctx__: { recordMask: 1, context: { mode: 'journal', scope: 'gr-requests-view' } }
                }
              ]
            }
          }
        }
      };
      const attachTo = document.createElement('div');

      document.body.appendChild(attachTo);

      const component = mount(<GroupActions {...props} />, { attachTo });

      return Promise.resolve(component)
        .then(() => {
          const disabledComponent = component.find('.ecos-dropdown-outer_disabled');

          expect(disabledComponent.length).toBe(0);

          const groupActionSelector = component.find('.ecos-btn.ecos-group-actions__control');

          expect(groupActionSelector.instance().getAttribute('disabled')).toBeNull();
          expect(groupActionSelector.props().disabled).toBe(false);
        })
        .then(() => component.unmount());
    });
  });
});
