import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import { act } from 'react-dom/test-utils';

import formatterStore from '../components/common/grid/formatters/formatterStore';

const { FunctionFormatterV2 } = formatterStore;

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

describe('FunctionFormatterV2 React Component', () => {
  const defaultProps = {
    params: {},
    row: {
      'cm:name': 'ae9f0b14-66eb-46b8-98fc-64a24d536f53',
      id: 'workspace://SpacesStore/ae9f0b14-66eb-46b8-98fc-64a24d536f53'
    },
    rowIndex: 0
  };
  const data = [
    {
      title: 'fn - a function that returns text',
      props: {
        ...defaultProps,
        params: {
          fn: () => 'test'
        }
      },
      output: 'test'
    },
    {
      title: 'fn - a function with using lodash',
      props: {
        ...defaultProps,
        params: {
          fn: function(...params) {
            const utils = params.slice(-1)[0];

            return utils.lodash.get(params, '[1].id');
          }
        }
      },
      output: 'workspace://SpacesStore/ae9f0b14-66eb-46b8-98fc-64a24d536f53'
    },
    {
      title: 'fn - the string representation of the function body',
      props: {
        ...defaultProps,
        params: {
          fn: "return utils.lodash.get(row, 'id');"
        }
      },
      output: 'workspace://SpacesStore/ae9f0b14-66eb-46b8-98fc-64a24d536f53'
    },
    {
      title: 'fn - plain text',
      props: {
        ...defaultProps,
        params: {
          fn: 'Test message!'
        }
      },
      output: 'Test message!'
    },
    {
      title: 'fn - function returning bool (setting Yes/No by locale)',
      props: {
        ...defaultProps,
        params: {
          fn: () => true
        }
      },
      output: 'predicate.boolean-true'
    }
  ];

  data.forEach(item => {
    it(item.title, () => {
      act(() => {
        render(<FunctionFormatterV2 {...item.props} />, container);

        expect(container.textContent).toBe(item.output);
      });
    });
  });
});

describe('FunctionFormatterV2 getFilterValue static method', () => {
  const data = [
    {
      title: 'fn - a function that returns text',
      input: ['', {}, { fn: () => 'test' }, 0],
      output: 'test'
    },
    {
      title: 'fn - a function with using lodash',
      input: [
        '',
        {
          'cm:name': 'ae9f0b14-66eb-46b8-98fc-64a24d536f53',
          id: 'workspace://SpacesStore/ae9f0b14-66eb-46b8-98fc-64a24d536f53'
        },
        {
          fn: function(...params) {
            const utils = params.slice(-1)[0];

            return utils.lodash.get(params, '[1].id');
          }
        },
        0
      ],
      output: 'workspace://SpacesStore/ae9f0b14-66eb-46b8-98fc-64a24d536f53'
    },
    {
      title: 'fn - the string representation of the function body',
      input: [
        '',
        {
          'cm:name': 'ae9f0b14-66eb-46b8-98fc-64a24d536f53',
          id: 'workspace://SpacesStore/ae9f0b14-66eb-46b8-98fc-64a24d536f53'
        },
        {
          fn: "return utils.lodash.get(row, 'id');"
        },
        0
      ],
      output: 'workspace://SpacesStore/ae9f0b14-66eb-46b8-98fc-64a24d536f53'
    },
    {
      title: 'fn - plain text',
      input: [
        '',
        {
          'cm:name': 'ae9f0b14-66eb-46b8-98fc-64a24d536f53',
          id: 'workspace://SpacesStore/ae9f0b14-66eb-46b8-98fc-64a24d536f53'
        },
        {
          fn: 'message'
        },
        0
      ],
      output: 'message'
    },
    {
      title: 'fn - function returning bool (setting Yes/No by locale)',
      input: [
        '',
        {
          'cm:name': 'ae9f0b14-66eb-46b8-98fc-64a24d536f53',
          id: 'workspace://SpacesStore/ae9f0b14-66eb-46b8-98fc-64a24d536f53'
        },
        {
          fn: () => false
        },
        0
      ],
      output: 'predicate.boolean-false'
    },
    {
      title: 'fn - the string representation of the function body with Promise (will return an empty string anyway)',
      input: [
        '',
        {
          'cm:name': 'ae9f0b14-66eb-46b8-98fc-64a24d536f53',
          id: 'workspace://SpacesStore/ae9f0b14-66eb-46b8-98fc-64a24d536f53'
        },
        {
          fn: `return new Promise(((resolve) => {
            resolve(utils.lodash.get(row, 'name'));
          }))`
        },
        0
      ],
      output: ''
    }
  ];

  data.forEach(item => {
    it(item.title, () => {
      const result = FunctionFormatterV2.getFilterValue(...item.input);

      expect(result).toEqual(item.output);
    });
  });
});
