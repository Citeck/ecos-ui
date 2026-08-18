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

    it('uses the ready workspaceId without resolving', async () => {
      const instance = buildInstance({ workspaceId: 'FROM_FORM', searchInWorkspacePolicy: 'current' });

      await expect(instance.getSearchWorkspaces()).resolves.toEqual(['FROM_FORM']);
      expect(resolveRecordWorkspaceId).not.toHaveBeenCalled();
    });

    it('prefers workspaceId over recordRef', async () => {
      const instance = buildInstance({ workspaceId: 'FROM_FORM', recordRef: 'emodel/task@task-1' });

      await expect(instance.getSearchWorkspaces()).resolves.toEqual(['FROM_FORM']);
      expect(resolveRecordWorkspaceId).not.toHaveBeenCalled();
    });

    it('picks up a changed workspaceId', async () => {
      const instance = buildInstance({ workspaceId: 'FROM_FORM' });
      await instance.getSearchWorkspaces();

      instance.props = { ...instance.props, workspaceId: 'OTHER' };

      await expect(instance.getSearchWorkspaces()).resolves.toEqual(['OTHER']);
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

  describe('system journals', () => {
    it('also searches in default, where the global records the journal lists live', async () => {
      const instance = buildInstance({ workspaceId: 'proj1', searchInWorkspacePolicy: 'current' });
      instance.state = { ...instance.state, journalConfig: { system: true } };

      await expect(instance.getSearchWorkspaces()).resolves.toEqual(['proj1', 'default']);
    });

    it('takes the flag from the config it is handed, for a caller whose state config was dropped', async () => {
      // `probeRowsInJournal` runs right after `resetJournalConfig` emptied the state's config, and
      // has the freshly fetched one in hand — reading the state there would miss the flag and leave
      // a global record out of the query the value is checked against
      const instance = buildInstance({ workspaceId: 'proj1', searchInWorkspacePolicy: 'current' });
      instance.state = { ...instance.state, journalConfig: {} };

      await expect(instance.getSearchWorkspaces({ system: true })).resolves.toEqual(['proj1', 'default']);
    });

    it('leaves an empty list alone — it already means every workspace', async () => {
      const instance = buildInstance({ searchInWorkspacePolicy: 'all' });
      instance.state = { ...instance.state, journalConfig: { system: true } };
      JournalsService.getWorkspaceByPolicy.mockReturnValueOnce([]);

      await expect(instance.getSearchWorkspaces()).resolves.toEqual([]);
    });

    it('does not search in default for a local-data journal', async () => {
      const instance = buildInstance({ workspaceId: 'proj1', searchInWorkspacePolicy: 'current' });
      instance.state = { ...instance.state, journalConfig: { system: true }, isLocaleData: true };

      await expect(instance.getSearchWorkspaces()).resolves.toEqual(['proj1']);
    });
  });

  describe('wiring to the input view', () => {
    it('hands getCreateWorkspaceId to the input view so field-level create buttons use it', () => {
      const instance = buildInstance({ workspaceId: 'TEST2' });
      let captured = null;

      instance.state = { ...instance.state, gridData: { columns: [], data: [], total: 0, selected: [] }, selectedRows: [] };
      instance.getColumns = () => [];
      instance.props = { ...instance.props, renderView: props => (captured = props) || null };

      instance.render();

      expect(captured).not.toBeNull();
      expect(captured.getCreateWorkspaceId).toBe(instance.getCreateWorkspaceId);
    });
  });

  describe('reacting to a workspaceId change', () => {
    const buildMounted = props => {
      const instance = buildInstance(props);
      instance.state = {
        journalConfig: { columns: ['a'] },
        isJournalConfigFetched: true,
        isGridDataReady: true,
        gridData: { total: 3, data: [{ id: '1' }], inMemoryData: [], columns: ['a'], selected: [] },
        filterPredicate: [],
        selectedRows: [{ id: '1' }],
        value: '1'
      };
      // React runs setState callbacks after componentDidUpdate, not inside setState itself, and
      // the order decides here: the refetch must overwrite the ready flag componentDidUpdate sets
      const pendingCallbacks = [];

      instance.setState = jest.fn((partial, cb) => {
        const next = typeof partial === 'function' ? partial(instance.state) : partial;
        instance.state = { ...instance.state, ...next };
        if (typeof cb === 'function') pendingCallbacks.push(cb);
      });

      const componentDidUpdate = instance.componentDidUpdate.bind(instance);

      instance.componentDidUpdate = (...args) => {
        componentDidUpdate(...args);

        while (pendingCallbacks.length) {
          pendingCallbacks.shift()();
        }
      };

      return instance;
    };

    it('re-renders when workspaceId changes', () => {
      const instance = buildMounted({ workspaceId: 'TEST' });

      expect(instance.shouldComponentUpdate({ ...instance.props, workspaceId: 'TEST2' }, instance.state)).toBe(true);
    });

    it('drops the fetched journal data so a reopened modal refetches', () => {
      const instance = buildMounted({ workspaceId: 'proj1', searchInWorkspacePolicy: 'current' });
      instance.fetchJournalData = jest.fn();

      // The real transition: the URL workspace resolved first, then the form computed its own
      instance.componentDidUpdate({ ...instance.props, workspaceId: 'user$admin' }, instance.state);

      expect(instance.state.isJournalConfigFetched).toBe(false);
      expect(instance.state.gridData.total).toBe(0);

      instance.openSelectModal();

      expect(instance.fetchJournalData).toHaveBeenCalled();
    });

    it('keeps the selected value — the user picked it, the workspace change must not erase it', () => {
      const instance = buildMounted({ workspaceId: 'proj1', searchInWorkspacePolicy: 'current' });
      const onChange = instance.props.onChange;

      instance.componentDidUpdate({ ...instance.props, workspaceId: 'user$admin' }, instance.state);

      expect(instance.state.value).toBe('1');
      expect(instance.state.selectedRows).toEqual([{ id: '1' }]);
      expect(onChange).not.toHaveBeenCalled();
    });

    it('keeps gridData.selected, which is what the modal saves on OK', () => {
      const instance = buildMounted({ workspaceId: 'proj1', searchInWorkspacePolicy: 'current' });
      instance.state.gridData = { ...instance.state.gridData, selected: [{ id: '1' }] };

      instance.componentDidUpdate({ ...instance.props, workspaceId: 'user$admin' }, instance.state);

      expect(instance.state.gridData.selected).toEqual([{ id: '1' }]);
    });

    it('refetches right away when the modal is already open', () => {
      const instance = buildMounted({ workspaceId: 'proj1', searchInWorkspacePolicy: 'current' });
      instance.state.isSelectModalOpen = true;
      instance.fetchJournalData = jest.fn();

      instance.componentDidUpdate({ ...instance.props, workspaceId: 'user$admin' }, instance.state);

      // nothing else would reload an open modal, so it would keep the previous workspace's rows
      expect(instance.fetchJournalData).toHaveBeenCalled();
      // and the grid must show the loader meanwhile, not the empty result state: componentDidUpdate
      // marks the just emptied grid as ready again, the refetch has to undo that
      expect(instance.state.isGridDataReady).toBe(false);
    });

    it('does not refetch while the modal is closed — opening it does that', () => {
      const instance = buildMounted({ workspaceId: 'proj1', searchInWorkspacePolicy: 'current' });
      instance.state.isSelectModalOpen = false;
      instance.fetchJournalData = jest.fn();

      instance.componentDidUpdate({ ...instance.props, workspaceId: 'user$admin' }, instance.state);

      expect(instance.fetchJournalData).not.toHaveBeenCalled();
    });

    it('does not react for policies that ignore the workspace', () => {
      const instance = buildMounted({ workspaceId: 'proj1', searchInWorkspacePolicy: 'all' });

      instance.componentDidUpdate({ ...instance.props, workspaceId: 'user$admin' }, instance.state);

      expect(instance.state.isJournalConfigFetched).toBe(true);
      expect(instance.state.value).toBe('1');
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
      const instance = buildInstance({ workspaceId: 'proj1', searchInWorkspacePolicy: 'all' });

      await expect(instance.getCreateWorkspaceId()).resolves.toBe('');
    });

    it('returns empty for the only-aditional policy', async () => {
      const instance = buildInstance({ workspaceId: 'proj1', searchInWorkspacePolicy: 'only-aditional' });

      await expect(instance.getCreateWorkspaceId()).resolves.toBe('');
    });

    it('uses the ready workspaceId on a create form', async () => {
      const instance = buildInstance({ workspaceId: 'TEST', searchInWorkspacePolicy: 'current' });

      await expect(instance.getCreateWorkspaceId()).resolves.toBe('TEST');
    });

    it('falls back to the resolved workspace when no workspaceId is given', async () => {
      const instance = buildInstance({ searchInWorkspacePolicy: 'current' });

      await expect(instance.getCreateWorkspaceId()).resolves.toBe('user$admin');
    });

    it('returns empty for a global record — the backend decides by type', async () => {
      const instance = buildInstance({ workspaceId: 'default', searchInWorkspacePolicy: 'current' });

      await expect(instance.getCreateWorkspaceId()).resolves.toBe('');
    });
  });
});
