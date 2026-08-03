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

  describe('componentDidUpdate — grid data readiness after custom predicate change', () => {
    const prevProps = { journalId: 'j1', defaultValue: undefined };
    const newPredicate = { att: 'legalEntity', t: 'eq', val: 'emodel/uni-dl-legal-entity@le-beautology' };

    const buildInstanceWithNewPredicate = () => {
      const instance = buildInstance();

      jest.spyOn(instance, 'shouldResetValue').mockResolvedValue({ shouldReset: false });
      instance.setCustomPredicate(newPredicate);

      expect(instance.state.isGridDataReady).toBe(false);

      return instance;
    };

    it('keeps grid data not ready when only selected rows changed', () => {
      const instance = buildInstanceWithNewPredicate();
      const prevState = { ...instance.state, gridData: { ...instance.state.gridData, selected: ['1'] } };

      instance.state = { ...instance.state, gridData: { ...instance.state.gridData, selected: [] } };
      instance.componentDidUpdate(prevProps, prevState);

      expect(instance.state.isGridDataReady).toBe(false);
    });

    it('marks grid data ready when the grid rows themselves changed', () => {
      const instance = buildInstanceWithNewPredicate();
      const prevState = { ...instance.state, gridData: { ...instance.state.gridData } };

      instance.state = { ...instance.state, gridData: { ...instance.state.gridData, data: [{ id: '2' }], total: 1 } };
      instance.componentDidUpdate(prevProps, prevState);

      expect(instance.state.isGridDataReady).toBe(true);
    });

    it('refreshes grid data on modal open while the grid is not ready', () => {
      const instance = buildInstanceWithNewPredicate();
      const refreshSpy = jest.spyOn(instance, 'refreshGridData').mockImplementation(() => Promise.resolve());
      const prevState = { ...instance.state, gridData: { ...instance.state.gridData, selected: ['1'] } };

      instance.state = { ...instance.state, gridData: { ...instance.state.gridData, selected: [] } };
      instance.componentDidUpdate(prevProps, prevState);
      instance.openSelectModal();

      expect(instance.state.isSelectModalOpen).toBe(true);
      expect(refreshSpy).toHaveBeenCalledTimes(1);

      refreshSpy.mockRestore();
    });
  });
});
