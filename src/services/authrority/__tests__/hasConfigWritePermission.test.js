import authorityService from '../AuthorityService';
import * as authorityApi from '../authorityApi';

jest.mock('../authorityApi', () => ({
  isManagerCurrentUser: jest.fn()
}));

jest.mock('@citeck/records-core', () => ({
  __esModule: true,
  default: { get: jest.fn() }
}));

jest.mock('@/helpers/util', () => ({
  getCurrentUserName: () => 'fet',
  getEnabledWorkspaces: () => true
}));

const Records = require('@citeck/records-core').default;

const mockRecords = ({ isAdmin = false, canWrite = false }) => {
  Records.get.mockImplementation(ref => ({
    load: jest.fn().mockResolvedValue(ref.startsWith('emodel/person@') ? isAdmin : canWrite)
  }));
};

// hasConfigWritePermission admits admins, managers of the current workspace (they get the
// "create a local copy" flow) and holders of a real write permission on the config record.
describe('AuthorityService.hasConfigWritePermission', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('is true for an admin', async () => {
    mockRecords({ isAdmin: true });

    await expect(authorityService.hasConfigWritePermission('uiserv/journal@news-journal')).resolves.toBe(true);
  });

  it('is true for a manager of the current workspace', async () => {
    mockRecords({ isAdmin: false });
    authorityApi.isManagerCurrentUser.mockResolvedValue(true);

    await expect(authorityService.hasConfigWritePermission('uiserv/journal@news-journal')).resolves.toBe(true);
  });

  it('falls back to the write permission on the config record for a plain member', async () => {
    mockRecords({ isAdmin: false, canWrite: false });
    authorityApi.isManagerCurrentUser.mockResolvedValue(false);

    await expect(authorityService.hasConfigWritePermission('uiserv/journal@news-journal')).resolves.toBe(false);
  });

  it('honours a real write permission on the config record', async () => {
    mockRecords({ isAdmin: false, canWrite: true });
    authorityApi.isManagerCurrentUser.mockResolvedValue(false);

    await expect(authorityService.hasConfigWritePermission('uiserv/journal@news-journal')).resolves.toBe(true);
  });
});
