import { render } from '@testing-library/react';
import React from 'react';

import JournalsSettingsBar from '../JournalsSettingsBar';

// The bar pulls in export/import, presets, group actions and the widget service —
// all irrelevant to the journal-settings button and too heavy for jsdom.
jest.mock('@/components/Export/Export', () => ({
  __esModule: true,
  default: () => null
}));

jest.mock('@/components/Import', () => ({
  __esModule: true,
  default: () => null
}));

jest.mock('@/components/common', () => ({
  Search: () => null,
  Tooltip: ({ children }) => children
}));

jest.mock('@/components/Journals/GroupActions', () => ({
  __esModule: true,
  default: () => null
}));

jest.mock('@/components/Journals/JournalsPresets', () => ({
  JournalsPresetListDropdown: () => null
}));

jest.mock('@/components/Journals/ViewTabs', () => ({
  __esModule: true,
  default: () => null
}));

jest.mock('../CreateMenu', () => ({
  __esModule: true,
  default: () => null
}));

jest.mock('../OverflowMenu', () => ({
  __esModule: true,
  default: () => null
}));

jest.mock('@/services/WidgetService', () => ({
  __esModule: true,
  default: {}
}));

const baseProps = {
  stateId: 'stateId',
  targetId: 'target',
  grid: {},
  journalConfig: {},
  journalSetting: {},
  predicate: {},
  searchText: '',
  selectedRecords: [],
  isMobile: false,
  isViewNewJournal: true,
  hasWritePermission: true,
  onRefresh: jest.fn()
};

const getJournalSettingsButton = container => container.querySelector('#target-journal-settings');

// The journal-settings (pencil/shape) button must reflect the verdict computed by Journals (the
// external displayElements flag + a resolvable config record). The views hand it over either as a
// boolean or as a thunk — a thunk taken as-is is always truthy, which is how users without any
// journal-config permission got the button and the misleading "create a local copy" dialog behind
// it (COREDEV-440).
describe('JournalsSettingsBar journal-settings button', () => {
  it('is hidden when the user may not edit the journal, even with write permission on the config', () => {
    const { container } = render(<JournalsSettingsBar {...baseProps} hasBtnEdit={false} />);

    expect(getJournalSettingsButton(container)).toBeNull();
  });

  it('is hidden when the verdict comes as a thunk returning false (COREDEV-440)', () => {
    const { container } = render(<JournalsSettingsBar {...baseProps} hasBtnEdit={() => false} />);

    expect(getJournalSettingsButton(container)).toBeNull();
  });

  it('is shown for a user who may edit the journal', () => {
    const { container } = render(<JournalsSettingsBar {...baseProps} hasBtnEdit />);

    expect(getJournalSettingsButton(container)).toBeTruthy();
  });

  it('is shown when the verdict comes as a thunk returning true', () => {
    const { container } = render(<JournalsSettingsBar {...baseProps} hasBtnEdit={() => true} />);

    expect(getJournalSettingsButton(container)).toBeTruthy();
  });

  it('is hidden without write permission on the journal config', () => {
    const { container } = render(<JournalsSettingsBar {...baseProps} hasWritePermission={false} hasBtnEdit />);

    expect(getJournalSettingsButton(container)).toBeNull();
  });
});
