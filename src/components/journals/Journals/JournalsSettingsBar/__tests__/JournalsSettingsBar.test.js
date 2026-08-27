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
