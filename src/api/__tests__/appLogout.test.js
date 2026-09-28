// AppApi.doLogOut must leave the page with a top-level navigation. The logout chain of an external
// IdP brokered by Keycloak (e.g. ADFS) redirects through the IdP's sign-out page and back to Keycloak;
// a background fetch cannot complete it, so the Keycloak session survived and reload logged the user in again.
jest.mock('../../helpers/ecosFetch', () => ({
  __esModule: true,
  default: jest.fn(),
  RESET_AUTH_STATE_EVENT: 'reset-auth-state',
  emitter: { on: jest.fn(), emit: jest.fn() }
}));

jest.mock('@/services/notifications', () => ({
  NotificationManager: { warning: jest.fn() }
}));

import ecosFetch from '../../helpers/ecosFetch';
import { AppApi } from '../app';

import { NotificationManager } from '@/services/notifications';

const mockEisConfig = config => {
  ecosFetch.mockImplementation(url => {
    if (url === '/eis.json') {
      return config instanceof Error ? Promise.reject(config) : Promise.resolve({ json: () => config });
    }
    return Promise.resolve({});
  });
};

describe('AppApi.doLogOut', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    jest.clearAllMocks();
    delete window.location;
    window.location = { assign: jest.fn(), reload: jest.fn() };
  });

  afterAll(() => {
    window.location = originalLocation;
  });

  const expectNavigatedTo = url => {
    expect(window.location.assign).toHaveBeenCalledTimes(1);
    expect(window.location.assign).toHaveBeenCalledWith(url);
    expect(window.location.reload).not.toHaveBeenCalled();
    expect(ecosFetch).not.toHaveBeenCalledWith(url, expect.anything());
  };

  it('navigates to the proxy /logout when eis.json names it', async () => {
    mockEisConfig({ eisId: 'ecos.example.com', realmId: 'ecos-app', logoutUrl: '/logout' });

    await AppApi.doLogOut();

    expectNavigatedTo('/logout');
  });

  it('navigates to a custom logout url from eis.json', async () => {
    mockEisConfig({ eisId: 'ecos.example.com', logoutUrl: 'https://sso.example.com/signout' });

    await AppApi.doLogOut();

    expectNavigatedTo('https://sso.example.com/signout');
  });

  it('falls back to /logout when eis.json has no configured eis', async () => {
    mockEisConfig({ eisId: 'EIS_ID', logoutUrl: 'LOGOUT_URL' });

    await AppApi.doLogOut();

    expectNavigatedTo('/logout');
  });

  it('falls back to /logout when eis.json cannot be loaded', async () => {
    mockEisConfig(new Error('404'));

    await AppApi.doLogOut();

    expectNavigatedTo('/logout');
  });

  it('warns and stays on the page when an eis is configured without a logout url', async () => {
    mockEisConfig({ eisId: 'ecos.example.com', logoutUrl: 'LOGOUT_URL' });

    await AppApi.doLogOut();

    expect(window.location.assign).not.toHaveBeenCalled();
    expect(NotificationManager.warning).toHaveBeenCalledTimes(1);
  });
});
