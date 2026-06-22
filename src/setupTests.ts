// Main setup
import { configure } from '@citeck/records-core';
import '@testing-library/jest-dom';
import 'cross-fetch/polyfill';
import { enableFetchMocks } from 'jest-fetch-mock';
import { TextDecoder, TextEncoder } from 'util';

import ecosFetch from './helpers/ecosFetch';
import { registerGlobalConstants } from './helpers/registerGlobalConstants';
import { getWorkspaceId } from './helpers/urls';
import { getEnabledWorkspaces, t } from './helpers/util';

enableFetchMocks();

registerGlobalConstants();

// Configure @citeck/records-core with web adapters for tests (HTTP via the
// fetch-mock-backed ecosFetch), mirroring the app's runtime bootstrap.
configure({
  http: ecosFetch as any,
  storage: typeof localStorage !== 'undefined' ? localStorage : undefined,
  i18n: { t },
  workspace: {
    getWorkspaceId: getWorkspaceId as any,
    getEnabledWorkspaces,
    getCurrentRecordRef: () => undefined
  }
});

// jsdom does not expose TextEncoder/TextDecoder, browsers do
// @ts-ignore
global.TextEncoder = global.TextEncoder || TextEncoder;
// @ts-ignore
global.TextDecoder = global.TextDecoder || TextDecoder;

// Polyfill ResizeObserver for jsdom environment
window.ResizeObserver =
  window.ResizeObserver ||
  class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };

jest.mock('./services/license/licenseApi');

jest.mock('uuidv4', () => () => '00000000-0000-0000-0000-000000000000');
