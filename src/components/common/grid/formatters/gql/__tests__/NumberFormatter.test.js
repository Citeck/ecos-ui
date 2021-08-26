import React from 'react';
import set from 'lodash/set';
import { configure, mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import { unmountComponentAtNode } from 'react-dom';

import formatterStore from '../../formatterStore';
import { LANGUAGE_EN } from '../../../../../../constants/lang';

configure({ adapter: new Adapter() });

const { NumberFormatter } = formatterStore;
const originToLocaleString = Number.prototype.toLocaleString;
let container = null;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);

  Number.prototype.toLocaleString = function(locales, options) {
    return originToLocaleString.call(this, LANGUAGE_EN, options);
  };
});

afterEach(() => {
  unmountComponentAtNode(container);
  container.remove();
  container = null;

  Number.prototype.toLocaleString = originToLocaleString;
});

describe('NumberFormatter React Component', () => {
  const data = [
    {
      title: 'Nothing should be displayed (no data came)',
      input: {},
      output: ''
    },
    {
      title: 'A non-numeric value arrived - displayed as is',
      input: { cell: 'two thousand twenty one' },
      output: 'two thousand twenty one'
    },
    {
      title: 'Number with a large number of characters after the separator (maximumFractionDigits = 16)',
      input: { cell: 0.0134072699580621 },
      output: '0.0134072699580621'
    },
    {
      title: 'Large number (> 64 bit), no parameters (maximumFractionDigits = 16)',
      input: { cell: 1364.0134072699580621 },
      output: '1,364.013407269958'
    },
    //
    {
      title: 'Large number in string format, no parameters (maximumFractionDigits = 16)',
      input: { cell: '1364.013407269958062178' },
      output: '1,364.0134072699580622'
    },
    {
      title: 'Number with more characters after separator with maximumFractionDigits = 3',
      input: { cell: 21.01340726995806217, params: { maximumFractionDigits: 3 } },
      output: '21.013'
    }
  ];

  data.forEach(item => {
    it(item.title, () => {
      set(item, 'input.params.locales', 'en-EN');
      const component = mount(<NumberFormatter {...item.input} />);

      expect(component.text()).toBe(item.output);
    });
  });
});
