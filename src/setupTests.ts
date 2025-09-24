// Main setup
import '@testing-library/jest-dom';
import 'cross-fetch/polyfill';
import { enableFetchMocks } from 'jest-fetch-mock';

enableFetchMocks();

jest.mock('./services/license/licenseApi');

jest.mock('uuidv4', () => () => '00000000-0000-0000-0000-000000000000');
