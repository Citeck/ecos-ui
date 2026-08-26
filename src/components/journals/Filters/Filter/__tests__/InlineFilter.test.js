// The editors registry reaches InlineFilter through JournalEditor → SelectJournal → Grid →
// HeaderFormatter, and Filter reaches the registry through EditorService. Entering that cycle from
// the Filter side leaves `Filter` undefined while InlineFilter extends it — so, like the app and
// registry.test.js, enter from the registry side first.
import '@/components/journals/Journals/service/editors/registry';

import { render } from '@testing-library/react';
import React from 'react';

import Filter from '../Filter';
import InlineFilter from '../InlineFilter';

const column = { attribute: 'name', type: 'text', text: 'Name', newEditor: { type: 'text' } };
const filter = { meta: { column, condition: {} }, predicate: { t: 'contains', val: '' } };

describe('column header filter focus (COREDEV-452)', () => {
  afterEach(() => {
    document.activeElement && document.activeElement !== document.body && document.activeElement.blur();
  });

  it('the header filter opens with the keyboard already in its value input', () => {
    const { container } = render(<InlineFilter filter={filter} recordRef="emodel/type@meta" />);

    expect(document.activeElement).toBe(container.querySelector('.ecos-inline-filter__value input.ecos-input'));
  });

  it('a settings panel filter row does not grab the focus', () => {
    render(<Filter filter={filter} />);

    expect(document.activeElement).toBe(document.body);
  });
});
