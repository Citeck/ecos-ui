// `api/orgStruct` sits in an import cycle: it pulls in the SelectOrgstruct helpers, which reach
// `components/common`, which ends at `Orgstruct.jsx` calling `new OrgStructApi()` at module scope —
// before `api/orgStruct` has finished evaluating. Stubbing that leaf keeps the cycle harmless here.
jest.mock('@/components/common/Orgstruct', () => ({ __esModule: true, default: () => null }));
jest.mock('@/components/common/form/SelectOrgstruct', () => ({ __esModule: true, default: () => null }));

import { OrgStructApi } from '../../api/orgStruct';
import { UserApi } from '../../api/user';
import { getCurrentUserAttributes } from '../app';

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
