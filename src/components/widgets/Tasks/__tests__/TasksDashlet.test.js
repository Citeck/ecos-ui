import { render } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';

import { MAX_DEFAULT_HEIGHT_DASHLET } from '../../../../constants';
import TasksDashlet from '../TasksDashlet';

describe('TasksDashlet. Check height params', () => {
  const mockStore = configureStore();

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
    let instance;

    it(item.title, () => {
      const wrapper = render(
        <Provider store={mockStore(context)}>
          <TasksDashlet
            {...defaultProps}
            ref={node => {
              instance = node;
            }}
          />
        </Provider>
      );

      return Promise.resolve(wrapper)
        .then(() => {
          const props = { ...defaultProps, ...item.input };

          wrapper.rerender(
            <Provider store={mockStore(context)}>
              <TasksDashlet
                {...props}
                ref={node => {
                  instance = node;
                }}
              />
            </Provider>
          );
        })
        .then(() => {
          expect(instance.scrollbarProps).toEqual(item.output);
        })
        .then(() => wrapper.unmount());
    });
  });
});
