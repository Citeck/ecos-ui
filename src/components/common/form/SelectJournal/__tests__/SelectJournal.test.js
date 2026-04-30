jest.mock('../../../../EcosForm', () => ({
  __esModule: true,
  FORM_MODE_EDIT: 'EDIT',
  FORM_MODE_VIEW: 'VIEW',
  FORM_MODE_CREATE: 'CREATE'
}));

jest.mock('../../../../EcosForm/FormManager', () => ({
  __esModule: true,
  default: {}
}));

jest.mock('../../../../Journals/service', () => ({
  __esModule: true,
  default: {}
}));

const SelectJournal = require('../SelectJournal').default;

describe('SelectJournal — dynamic journalId', () => {
  const buildInstance = (props = {}) => {
    const instance = new SelectJournal({ journalId: 'j1', multiple: false, onChange: jest.fn(), ...props });
    instance.state = {
      isCollapsePanelOpen: false,
      isSelectModalOpen: false,
      isJournalConfigFetched: true,
      journalConfig: { columns: ['a'], sourceId: 'src' },
      isGridDataReady: true,
      gridData: { total: 3, data: [{ id: '1' }], inMemoryData: [], columns: ['a'], selected: [] },
      pagination: { skipCount: 0, maxItems: 10, page: 1 },
      filterPredicate: [{ t: 'eq' }],
      selectedRows: [{ id: '1', disp: 'one' }],
      error: null,
      customPredicate: null,
      value: '1',
      isLoading: false,
      searching: false,
      isLocaleData: false
    };
    instance.setState = jest.fn((partial, cb) => {
      const next = typeof partial === 'function' ? partial(instance.state) : partial;
      instance.state = { ...instance.state, ...next };
      if (typeof cb === 'function') cb();
    });
    instance.liveComponent = true;
    return instance;
  };

  describe('resetJournalConfig', () => {
    it('resets journal config state and clears value', () => {
      const instance = buildInstance();

      instance.resetJournalConfig();

      expect(instance.state.isJournalConfigFetched).toBe(false);
      expect(instance.state.isGridDataReady).toBe(false);
      expect(instance.state.filterPredicate).toEqual([]);
      expect(instance.state.selectedRows).toEqual([]);
      expect(instance.state.gridData.total).toBe(0);
      expect(instance.state.gridData.data).toEqual([]);
      expect(instance.state.value).toBe('');
    });

    it('emits onChange with empty string when not multiple', () => {
      const onChange = jest.fn();
      const instance = buildInstance({ onChange, multiple: false });

      instance.resetJournalConfig();

      expect(onChange).toHaveBeenCalledWith('');
    });

    it('emits onChange with empty array when multiple', () => {
      const onChange = jest.fn();
      const instance = buildInstance({ onChange, multiple: true });

      instance.resetJournalConfig();

      expect(onChange).toHaveBeenCalledWith([]);
    });

    it('replaces journalConfig with empty config shape', () => {
      const instance = buildInstance();

      instance.resetJournalConfig();

      expect(instance.state.journalConfig.columns).toBeUndefined();
      expect(instance.state.journalConfig.sourceId).toBeUndefined();
    });
  });

  describe('componentDidUpdate — journalId prop change', () => {
    it('does not reset when journalId changes from empty to non-empty (first resolution)', () => {
      const instance = buildInstance({ journalId: 'deals-journal' });
      const resetSpy = jest.spyOn(instance, 'resetJournalConfig').mockImplementation(() => {});
      const checkSpy = jest.spyOn(instance, 'checkJournalId').mockImplementation(() => {});

      instance.componentDidUpdate({ journalId: '', defaultValue: undefined }, instance.state);

      expect(checkSpy).toHaveBeenCalled();
      expect(resetSpy).not.toHaveBeenCalled();

      resetSpy.mockRestore();
      checkSpy.mockRestore();
    });

    it('resets when journalId changes between two non-empty journals', () => {
      const instance = buildInstance({ journalId: 'project-journal' });
      const resetSpy = jest.spyOn(instance, 'resetJournalConfig').mockImplementation(() => {});
      const checkSpy = jest.spyOn(instance, 'checkJournalId').mockImplementation(() => {});

      instance.componentDidUpdate({ journalId: 'deals-journal', defaultValue: undefined }, instance.state);

      expect(checkSpy).toHaveBeenCalled();
      expect(resetSpy).toHaveBeenCalledTimes(1);

      resetSpy.mockRestore();
      checkSpy.mockRestore();
    });

    it('does not reset when journalId did not change', () => {
      const instance = buildInstance({ journalId: 'deals-journal' });
      const resetSpy = jest.spyOn(instance, 'resetJournalConfig').mockImplementation(() => {});
      const checkSpy = jest.spyOn(instance, 'checkJournalId').mockImplementation(() => {});

      instance.componentDidUpdate({ journalId: 'deals-journal', defaultValue: undefined }, instance.state);

      expect(checkSpy).not.toHaveBeenCalled();
      expect(resetSpy).not.toHaveBeenCalled();

      resetSpy.mockRestore();
      checkSpy.mockRestore();
    });
  });
});
