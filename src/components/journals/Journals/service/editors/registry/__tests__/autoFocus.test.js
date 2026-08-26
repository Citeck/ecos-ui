import { render } from '@testing-library/react';
import React from 'react';

import editorRegistry from '../';
import EditorScope from '../../EditorScope';

const SELECT_CONFIG = {
  options: [
    { value: 'a', label: 'A' },
    { value: 'b', label: 'B' }
  ]
};

const renderControl = (type, config, params) => {
  const Control = editorRegistry.getEditor(type).getControl(config, EditorScope.FILTER, params);

  return render(<Control config={config} value="" onUpdate={() => {}} />);
};

/** The element that would receive the user's keystrokes right after the control mounted. */
const focused = () => document.activeElement;

describe('filter editors: focus on mount (COREDEV-452)', () => {
  afterEach(() => {
    if (focused() && focused() !== document.body) {
      focused().blur();
    }
  });

  describe.each([
    ['text', {}, 'input.ecos-input'],
    ['number', {}, 'input.ecos-input'],
    ['select', SELECT_CONFIG, '.ecos-select input'],
    ['date', {}, '.ecos-datepicker input'],
    ['datetime', {}, '.ecos-datepicker input']
  ])('%s editor', (type, config, inputSelector) => {
    it('focuses its input when the filter asks for it', () => {
      const { container } = renderControl(type, config, { autoFocus: true });

      expect(focused()).toBe(container.querySelector(inputSelector));
    });

    it('leaves focus alone in a filter that did not ask (the settings panel renders many of them)', () => {
      renderControl(type, config, {});

      expect(focused()).toBe(document.body);
    });
  });

  it('a focused date editor does not pop its calendar open', () => {
    renderControl('date', {}, { autoFocus: true });

    expect(document.querySelector('.react-datepicker')).toBeNull();
  });
});
