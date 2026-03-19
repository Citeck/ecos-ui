// Main setup
import '@testing-library/jest-dom';
import 'cross-fetch/polyfill';
import { enableFetchMocks } from 'jest-fetch-mock';

enableFetchMocks();

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
