import React from 'react';
import { configure, shallow, mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

import MLTextarea from '../MLTextarea';
import { LANGUAGE_RU, LANGUAGE_EN } from '../../../../../constants/lang';

configure({ adapter: new Adapter() });

describe('<MLTextarea />', () => {
  it('renders without crashing', () => {
    shallow(<MLTextarea />);
  });

  it('switch between languages', () => {
    const defaultProps = {
      value: {
        en: 'Test',
        ru: 'Тест'
      },
      lang: LANGUAGE_EN
    };

    const wrapper = mount(<MLTextarea {...defaultProps} />);
    return Promise.resolve(wrapper)
      .then(() => {
        const textarea = wrapper.find('textarea');
        expect(textarea.length).toBe(1);
        const textareaProps = textarea.props();
        expect(textareaProps.value).toBe(defaultProps.value.en);
      })
      .then(() => {
        wrapper.setProps({ lang: LANGUAGE_RU });
        return wrapper.update();
      })
      .then(() => {
        const textarea = wrapper.find('textarea');
        const textareaProps = textarea.props();
        expect(textareaProps.value).toBe(defaultProps.value.ru);
      })
      .then(() => {
        wrapper.setProps({ lang: LANGUAGE_EN });
        return wrapper.update();
      })
      .then(() => {
        const textarea = wrapper.find('textarea');
        const textareaProps = textarea.props();
        expect(textareaProps.value).toBe(defaultProps.value.en);
      })
      .then(() => wrapper.unmount());
  });
});
