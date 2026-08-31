import journalsServiceApi from '../journalsServiceApi';

import AuthorityService from '@/services/authrority/AuthorityService';

jest.mock('@/components/Records/Records', () => ({
  __esModule: true,
  default: {
    get: jest.fn(() => ({
      load: jest.fn().mockResolvedValue({ json: { id: 'news-journal' }, listViewInfo: null })
    }))
  }
}));

jest.mock('@/services/authrority/AuthorityService', () => ({
  __esModule: true,
  default: { hasConfigWritePermission: jest.fn().mockResolvedValue(false) }
}));

describe('journalsServiceApi.getJournalConfig', () => {
  // The permission check must receive a full record ref. A bare journal id is not resolvable on
  // every stand: some gateways answer with an empty record instead of an error, and then the
  // ?bool!true fallback of the permission attribute reports write access for everyone — that is
  // how plain workspace members got the journal-settings button and the misleading
  // "create a local copy" dialog behind it (COREDEV-440).
  it('checks the write permission on the full journal ref, not the bare id', async () => {
    const config = await journalsServiceApi.getJournalConfig('news-journal');

    expect(AuthorityService.hasConfigWritePermission).toHaveBeenCalledWith('uiserv/journal@news-journal');
    expect(config.hasWritePermission).toBe(false);
  });
});
