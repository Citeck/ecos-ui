import { render } from '@testing-library/react';
import React from 'react';

import JournalsSettingsBar from '../JournalsSettingsBar';

// The bar pulls in export/import, presets, group actions and the widget service —
// all irrelevant to the refresh button and too heavy for jsdom.
jest.mock('@/components/domain/Export/Export', () => ({
  __esModule: true,
  default: () => null
}));

jest.mock('@/components/domain/Import', () => ({
  __esModule: true,
  default: () => null
}));

jest.mock('@/components/common', () => ({
  Search: () => null,
  Tooltip: ({ children }) => children
}));

jest.mock('../../GroupActions', () => ({
  __esModule: true,
  default: () => null
}));

jest.mock('../../JournalsPresets', () => ({
  JournalsPresetListDropdown: () => null
}));

jest.mock('../../ViewTabs', () => ({
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
  onRefresh: jest.fn()
};

const getUpdateButton = container => container.querySelector('#target-update');

describe('JournalsSettingsBar refresh button', () => {
  it('is disabled while a refresh is in flight', () => {
    const { container } = render(<JournalsSettingsBar {...baseProps} isRefreshing />);
    const button = getUpdateButton(container);

    expect(button).toBeTruthy();
    expect(button.disabled).toBe(true);
  });

  it('keeps its icon and spins it while a refresh is in flight, instead of swapping in the points loader', () => {
    const { container } = render(<JournalsSettingsBar {...baseProps} isRefreshing />);
    const button = getUpdateButton(container);

    expect(button.classList.contains('ecos-journal__settings-bar-update_refreshing')).toBe(true);
    expect(button.querySelector('svg')).toBeTruthy();
    expect(button.querySelector('.ecos-loader, .ecos-points-loader, .points-loader')).toBeNull();
  });

  it('does not spin when no refresh is running', () => {
    const { container } = render(<JournalsSettingsBar {...baseProps} isRefreshing={false} />);
    const button = getUpdateButton(container);

    expect(button.classList.contains('ecos-journal__settings-bar-update_refreshing')).toBe(false);
    expect(button.querySelector('svg')).toBeTruthy();
  });

  it('is enabled when no refresh is running', () => {
    const { container } = render(<JournalsSettingsBar {...baseProps} isRefreshing={false} />);
    const button = getUpdateButton(container);

    expect(button).toBeTruthy();
    expect(button.disabled).toBe(false);
  });
});

const getJournalSettingsButton = container => container.querySelector('#target-journal-settings');

// The journal-settings (shape) button must reflect the "may edit this journal config" verdict
// computed by Journals (admin-only). The views hand it over either as a boolean or as a thunk —
// a thunk taken as-is is always truthy, which is how non-admins got the button and the misleading
// "create a local copy" dialog behind it (COREDEV-440).
describe('JournalsSettingsBar journal-settings button', () => {
  it('is hidden when the user may not edit the journal, even with write permission on the config', () => {
    const { container } = render(<JournalsSettingsBar {...baseProps} hasWritePermission hasBtnEdit={false} />);

    expect(getJournalSettingsButton(container)).toBeNull();
  });

  it('is hidden when the verdict comes as a thunk returning false (COREDEV-440)', () => {
    const { container } = render(<JournalsSettingsBar {...baseProps} hasWritePermission hasBtnEdit={() => false} />);

    expect(getJournalSettingsButton(container)).toBeNull();
  });

  it('is shown for a user who may edit the journal', () => {
    const { container } = render(<JournalsSettingsBar {...baseProps} hasWritePermission hasBtnEdit />);

    expect(getJournalSettingsButton(container)).toBeTruthy();
  });

  it('is shown when the verdict comes as a thunk returning true', () => {
    const { container } = render(<JournalsSettingsBar {...baseProps} hasWritePermission hasBtnEdit={() => true} />);

    expect(getJournalSettingsButton(container)).toBeTruthy();
  });

  it('is hidden without write permission on the journal config', () => {
    const { container } = render(<JournalsSettingsBar {...baseProps} hasWritePermission={false} hasBtnEdit />);

    expect(getJournalSettingsButton(container)).toBeNull();
  });
});
