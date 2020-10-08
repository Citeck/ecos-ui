import React from 'react';
import { configure, mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import { unmountComponentAtNode } from 'react-dom';

import formatterStore from '../../formatterStore';
import '../__mocks__/LocaleFormatter.mock';

configure({ adapter: new Adapter() });

const { LocaleFormatter } = formatterStore;

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

describe('LocaleFormatter React Component', () => {
  const defaultProps = {
    params: {
      prefix: '',
      postfix: ''
    },
    rowIndex: 0,
    cell: ''
  };
  const data = [
    {
      title: 'Empty input data without prefix and postfix',
      input: {},
      output: ''
    },
    {
      title: 'Use prefix: listconstraint.wfnc_correctOutcomeOptions, value: answer',
      input: {
        ...defaultProps,
        params: {
          prefix: 'listconstraint.wfnc_correctOutcomeOptions.'
        },
        cell: 'answer'
      },
      output: 'Вернуть на нормоконтроль'
    },
    {
      title: 'Use prefix: listconstraint.wfnc_correctOutcomeOptions, value: cancel',
      input: {
        ...defaultProps,
        params: {
          prefix: 'listconstraint.wfnc_correctOutcomeOptions.'
        },
        cell: 'cancel'
      },
      output: 'Отменить нормоконтроль'
    },
    {
      title: 'Use prefix: listconstraint.wfnc_correctOutcomeOptions, value: exit',
      input: {
        ...defaultProps,
        params: {
          prefix: 'listconstraint.wfnc_correctOutcomeOptions.'
        },
        cell: 'exit'
      },
      output: 'Завершить задачу'
    }
  ];

  data.forEach(item => {
    it(item.title, async () => {
      const mounted = mount(<LocaleFormatter {...item.input} />);

      return await Promise.resolve(mounted)
        .then(() => mounted.update())
        .then(() => {
          expect(mounted.state().value).toBe(item.output);
          expect(mounted.text()).toBe(item.output);
        });
    });
  });
});
