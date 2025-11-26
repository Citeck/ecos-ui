import { render } from '@testing-library/react';
import React from 'react';

import { LANGUAGE_RU, LANGUAGE_EN } from '../../../../../constants/lang';
import MLTextarea from '../MLTextarea';

global.getSelection = () => '';

describe('<MLTextarea />', () => {
  it('renders without crashing', () => {
    render(<MLTextarea />);
  });

  it('switch between languages', () => {
    const defaultProps = {
      value: {
        en: 'Test',
        ru: 'Тест'
      },
      lang: LANGUAGE_EN
    };

    const wrapper = render(<MLTextarea {...defaultProps} />);
    const outerText = defaultProps.value[defaultProps.lang];

    return Promise.resolve(wrapper)
      .then(async () => {
        const textarea = await wrapper.findByText(outerText);
        expect(textarea).toBeInstanceOf(HTMLTextAreaElement);
        expect(textarea.textContent).toBe(outerText);
      })
      .then(() => {
        wrapper.rerender(<MLTextarea {...defaultProps} lang={LANGUAGE_RU} />);
      })
      .then(async () => {
        const changedText = defaultProps.value[LANGUAGE_RU];
        const textarea = await wrapper.findByText(changedText);
        expect(textarea.textContent).toBe(changedText);
      })
      .then(() => {
        wrapper.rerender(<MLTextarea {...defaultProps} lang={LANGUAGE_EN} />);
      })
      .then(async () => {
        const changedText = defaultProps.value[LANGUAGE_EN];
        const textarea = await wrapper.findByText(changedText);
        expect(textarea.textContent).toBe(changedText);
        expect(changedText).toBe(outerText);
      })
      .then(() => wrapper.unmount());
  });
});
