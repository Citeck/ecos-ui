import React from 'react';
import { shallow } from 'enzyme';
import { unmountComponentAtNode } from 'react-dom';

import TasksDashlet from '../TasksDashlet';
import { MAX_DEFAULT_HEIGHT_DASHLET } from '../../../../constants';

let container = null;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
});

afterEach(() => {
  unmountComponentAtNode(container);
  container.remove();
  container = null;
});

describe('TasksDashlet', () => {
  describe('Check height params', () => {
    const context = {
      view: {
        isMobile: false
      },
      app: {
        dashboardEditable: false
      },
      tasks: {
        'd5b4372a-cb41-4370-b66e-5580a52aaa6f': {
          list: [],
          isLoading: false,
          totalCount: 0
        }
      }
    };
    const defaultProps = {
      isActiveLayout: true,
      record: 'workspace://SpacesStore/8971da7a-41ec-417e-ba27-d022539b41db',
      id: 'd5b4372a-cb41-4370-b66e-5580a52aaa6f'
    };
    const data = [
      {
        title: `Auto height, max height - ${MAX_DEFAULT_HEIGHT_DASHLET}`,
        input: {},
        output: { autoHeight: true, autoHeightMax: 800 }
      },
      {
        title: `Fixed height, always height - ${MAX_DEFAULT_HEIGHT_DASHLET}`,
        input: { fixedHeight: true },
        output: { style: { height: 800 } }
      },
      {
        title: 'Max height by content',
        input: { maxHeightByContent: true },
        output: { autoHeight: true, autoHeightMax: '100%' }
      }
    ];

    data.forEach(item => {
      it(item.title, () => {
        const wrapper = shallow(<TasksDashlet {...defaultProps} />, { context });

        return Promise.resolve(wrapper)
          .then(() => {
            wrapper.setProps({ ...defaultProps, ...item.input });
          })
          .then(() => wrapper.update())
          .then(() => {
            expect(wrapper.instance().scrollbarProps).toEqual(item.output);
          })
          .then(() => wrapper.unmount());
      });
    });
  });
});
