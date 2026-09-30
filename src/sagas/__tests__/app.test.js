// `api/orgStruct` sits in an import cycle: it pulls in the SelectOrgstruct helpers, which reach
// `components/common`, which ends at `Orgstruct.jsx` calling `new OrgStructApi()` at module scope —
// before `api/orgStruct` has finished evaluating. Stubbing that leaf keeps the cycle harmless here.
jest.mock('@/components/common/Orgstruct', () => ({ __esModule: true, default: () => null }));
jest.mock('@/components/common/form/SelectOrgstruct', () => ({ __esModule: true, default: () => null }));

import { runSaga } from 'redux-saga';

import { setJournalsPagination } from '../../actions/view';
import { OrgStructApi } from '../../api/orgStruct';
import { UserApi } from '../../api/user';
import { getCurrentUserAttributes, initApp } from '../app';
import ConfigService, { JOURNALS_PAGINATION } from '@/services/config/ConfigService';

describe('app saga: current user attributes', () => {
  // The header (AvatarBtn, UserMenu) shows the platform display name, the same `?disp` every other
  // person label in the app is built from, so it must be loaded on every path — not only on the one
  // that borrows the orgstruct map (COREDEV-384).
  it('should load the person display name for the header', () => {
    expect(new UserApi().attributes.displayName).toBe('?disp');

    const requested = { ...new UserApi().attributes, ...getCurrentUserAttributes() };

    expect(requested.displayName).toBe('?disp');
  });

  // `OrgStructApi.userAttributes` describes an authority in the orgstruct tree, where `fullName` is
  // the authority name — the login. The app's user state means the person's name by `fullName`, so
  // the orgstruct alias must not survive the merge inside UserApi.getUserData (COREDEV-384).
  it('should not let the orgstruct alias turn fullName into the login', () => {
    expect(OrgStructApi.userAttributes.fullName).toBe('authorityName');

    const requested = { ...new UserApi().attributes, ...getCurrentUserAttributes() };

    expect(requested.fullName).toBe('fullName');
  });

  it('should keep the extra orgstruct attributes the app needs', () => {
    expect(getCurrentUserAttributes()).toMatchObject({
      displayName: '?disp',
      email: 'email',
      nodeRef: '?id',
      groups: 'authorityGroups[]?id'
    });
  });
});

describe('app saga: journals pagination config (COREDEV-583)', () => {
  const run = async journalsPagination => {
    jest.spyOn(ConfigService, 'getValue').mockImplementation(async key => (key === JOURNALS_PAGINATION ? journalsPagination : null));
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const dispatched = [];
    const api = {
      user: { getUserData: async () => ({ success: false }) },
      app: { isForceOldUserDashboardEnabled: async () => false }
    };

    await runSaga({ dispatch: action => dispatched.push(action), getState: () => ({}) }, initApp, { api }, { payload: {} }).done;

    return dispatched.filter(action => action.type === setJournalsPagination.toString()).map(action => action.payload);
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('stores the config before the app renders the journals page', async () => {
    const config = { journalsPage: { pageSizeMode: 'FIXED', pageSize: 15 } };

    expect(await run(config)).toEqual([config]);
  });

  it('stores nothing when the config is not an object', async () => {
    expect(await run(null)).toEqual([]);
  });
});
