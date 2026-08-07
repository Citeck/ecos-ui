jest.mock('@/components/forms/EcosForm', () => ({
  __esModule: true,
  FORM_MODE_EDIT: 'EDIT',
  FORM_MODE_VIEW: 'VIEW',
  FORM_MODE_CREATE: 'CREATE'
}));

jest.mock('@/components/forms/EcosForm/FormManager', () => ({
  __esModule: true,
  default: {}
}));

jest.mock('@/components/journals/Journals/service', () => ({
  __esModule: true,
  default: {
    getWorkspaceByPolicy: jest.fn((policy, additional = [], current) => [current, ...additional])
  }
}));

jest.mock('@/helpers/recordWorkspace', () => ({
  __esModule: true,
  resolveRecordWorkspaceId: jest.fn(async ref => (ref ? 'proj1' : 'user$admin'))
}));

const JournalsService = require('@/components/journals/Journals/service').default;
const { resolveRecordWorkspaceId } = require('@/helpers/recordWorkspace');
const SelectJournal = require('../SelectJournal').default;

const buildInstance = (props = {}) => new SelectJournal({ journalId: 'j1', onChange: jest.fn(), ...props });

describe('SelectJournal — workspace to search in', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resolveRecordWorkspaceId.mockImplementation(async ref => (ref ? 'proj1' : 'user$admin'));
  });

  describe('getSearchWorkspaces', () => {
    it('searches in the record workspace when recordRef is given', async () => {
      const instance = buildInstance({ recordRef: 'emodel/task@task-1', searchInWorkspacePolicy: 'current' });

      await expect(instance.getSearchWorkspaces()).resolves.toEqual(['proj1']);
      expect(JournalsService.getWorkspaceByPolicy).toHaveBeenCalledWith('current', undefined, 'proj1');
    });

    it('searches in the workspace from the URL without recordRef', async () => {
      const instance = buildInstance({ searchInWorkspacePolicy: 'current' });

      await expect(instance.getSearchWorkspaces()).resolves.toEqual(['user$admin']);
      expect(JournalsService.getWorkspaceByPolicy).toHaveBeenCalledWith('current', undefined, 'user$admin');
    });

    it('passes the additional workspaces through unchanged', async () => {
      const instance = buildInstance({
        recordRef: 'emodel/task@task-1',
        searchInWorkspacePolicy: 'current-and-additional',
        searchInAdditionalWorkspaces: ['ws2']
      });

      await expect(instance.getSearchWorkspaces()).resolves.toEqual(['proj1', 'ws2']);
    });

    it('resolves the record workspace once across several calls', async () => {
      const instance = buildInstance({ recordRef: 'emodel/task@task-1' });

      await instance.getSearchWorkspaces();
      await instance.getSearchWorkspaces();

      expect(resolveRecordWorkspaceId).toHaveBeenCalledTimes(1);
    });

    it('resolves again when recordRef changes', async () => {
      const instance = buildInstance({ recordRef: 'emodel/task@task-1' });
      await instance.getSearchWorkspaces();

      instance.props = { ...instance.props, recordRef: 'emodel/task@task-2' };
      await instance.getSearchWorkspaces();

      expect(resolveRecordWorkspaceId).toHaveBeenCalledTimes(2);
    });
  });

  describe('getCreateWorkspaceId', () => {
    it('returns the record workspace for the current policy', async () => {
      const instance = buildInstance({ recordRef: 'emodel/task@task-1', searchInWorkspacePolicy: 'current' });

      await expect(instance.getCreateWorkspaceId()).resolves.toBe('proj1');
    });

    it('returns the record workspace for the current-and-additional policy', async () => {
      const instance = buildInstance({
        recordRef: 'emodel/task@task-1',
        searchInWorkspacePolicy: 'current-and-additional'
      });

      await expect(instance.getCreateWorkspaceId()).resolves.toBe('proj1');
    });

    it('behaves like current when no policy is set', async () => {
      const instance = buildInstance({ recordRef: 'emodel/task@task-1' });

      await expect(instance.getCreateWorkspaceId()).resolves.toBe('proj1');
    });

    it('returns empty for the all policy — the backend picks the workspace', async () => {
      const instance = buildInstance({ recordRef: 'emodel/task@task-1', searchInWorkspacePolicy: 'all' });

      await expect(instance.getCreateWorkspaceId()).resolves.toBe('');
    });

    it('returns empty for the only-aditional policy', async () => {
      const instance = buildInstance({ recordRef: 'emodel/task@task-1', searchInWorkspacePolicy: 'only-aditional' });

      await expect(instance.getCreateWorkspaceId()).resolves.toBe('');
    });

    it('returns empty without recordRef — behaviour as before the change', async () => {
      const instance = buildInstance({ searchInWorkspacePolicy: 'current' });

      await expect(instance.getCreateWorkspaceId()).resolves.toBe('');
    });

    it('returns empty for a global record — the backend decides by type', async () => {
      resolveRecordWorkspaceId.mockResolvedValueOnce('default');
      const instance = buildInstance({ recordRef: 'emodel/type@some-type', searchInWorkspacePolicy: 'current' });

      await expect(instance.getCreateWorkspaceId()).resolves.toBe('');
    });
  });
});
