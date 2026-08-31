import authorityService from '../AuthorityService';
import * as authorityApi from '../authorityApi';

import { getWorkspaceId } from '@/helpers/urls';

jest.mock('../authorityApi', () => ({
  isManagerCurrentUser: jest.fn()
}));

jest.mock('@/components/Records/Records', () => ({
  __esModule: true,
  default: { get: jest.fn() }
}));

jest.mock('@/helpers/util', () => ({
  getCurrentUserName: () => 'fet',
  getEnabledWorkspaces: () => true
}));

jest.mock('@/helpers/urls', () => ({
  getWorkspaceId: jest.fn(),
  getPersonalWorkspaceId: () => 'user$fet'
}));

const Records = require('@/components/Records/Records').default;

const mockRecords = ({ isAdmin = false, canWrite = false }) => {
  Records.get.mockImplementation(ref => ({
    load: jest.fn().mockResolvedValue(ref.startsWith('emodel/person@') ? isAdmin : canWrite)
  }));
};

// hasConfigWritePermission admits admins, managers of the current *shared* workspace (they get the
// "create a local copy" flow) and holders of a real write permission on the config record. Being
// the formal manager of one's own personal workspace must not count — that is how every user got
// the artifact-copy dialog on global journals opened in their personal space (COREDEV-440).
describe('AuthorityService.hasConfigWritePermission', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('is true for an admin', async () => {
    mockRecords({ isAdmin: true });
    getWorkspaceId.mockReturnValue('user$fet');

    await expect(authorityService.hasConfigWritePermission('uiserv/journal@news-journal')).resolves.toBe(true);
  });

  it('is true for a manager of the current shared workspace', async () => {
    mockRecords({ isAdmin: false });
    getWorkspaceId.mockReturnValue('TEST2');
    authorityApi.isManagerCurrentUser.mockResolvedValue(true);

    await expect(authorityService.hasConfigWritePermission('uiserv/journal@news-journal')).resolves.toBe(true);
  });

  it('does not treat the personal workspace as a managed one (COREDEV-440)', async () => {
    mockRecords({ isAdmin: false });
    getWorkspaceId.mockReturnValue('user$fet');
    authorityApi.isManagerCurrentUser.mockResolvedValue(true);

    await expect(authorityService.hasConfigWritePermission('uiserv/journal@news-journal')).resolves.toBe(false);
    expect(authorityApi.isManagerCurrentUser).not.toHaveBeenCalled();
  });

  it('falls back to the write permission on the config record for a plain member', async () => {
    mockRecords({ isAdmin: false, canWrite: false });
    getWorkspaceId.mockReturnValue('TEST2');
    authorityApi.isManagerCurrentUser.mockResolvedValue(false);

    await expect(authorityService.hasConfigWritePermission('uiserv/journal@news-journal')).resolves.toBe(false);
  });
});
