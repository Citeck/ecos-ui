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
    getJournalConfig: jest.fn(),
    getJournalData: jest.fn(),
    getWorkspaceByPolicy: jest.fn(() => [])
  }
}));

jest.mock('@citeck/records-core', () => ({
  __esModule: true,
  default: {
    get: jest.fn(id => ({ load: jest.fn(async () => `local-${id}`) }))
  }
}));

const Records = require('@citeck/records-core').default;
const JournalsService = require('@/components/journals/Journals/service').default;
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
      gridData: { total: 3, data: [{ id: '1' }], inMemoryData: [], columns: ['a'], selected: ['1'] },
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

    it('drops the journal config but keeps the value on the first resolution of a dynamic journalId', () => {
      // The formio wrapper sets this flag for the expression's first result, which arrives after the
      // child mounted on the static journalId — the value there is the one the record was opened with
      const onChange = jest.fn();
      const instance = buildInstance({ journalId: 'deals-journal', keepValueOnJournalIdChange: true, onChange });
      const checkSpy = jest.spyOn(instance, 'checkJournalId').mockImplementation(() => {});
      const setValueSpy = jest.spyOn(instance, 'setValue').mockImplementation(() => Promise.resolve());
      // the value does belong to the journal the expression resolved to — the record was opened with it
      jest.spyOn(instance, 'probeRowsInJournal').mockResolvedValue([{ id: '1', disp: 'one' }]);

      instance.componentDidUpdate({ journalId: 'static-journal', defaultValue: undefined }, instance.state);

      expect(checkSpy).toHaveBeenCalled();
      // everything belonging to the journal we left is gone — nothing else would refetch it
      expect(instance.state.isJournalConfigFetched).toBe(false);
      expect(instance.state.journalConfig.columns).toBeUndefined();
      expect(instance.state.gridData.data).toEqual([]);
      // ... but the value the record was opened with stays, and formio is not told it changed
      expect(instance.state.value).toBe('1');
      expect(instance.state.selectedRows).toEqual([{ id: '1', disp: 'one' }]);
      expect(instance.state.gridData.selected).toEqual(['1']);
      expect(onChange).not.toHaveBeenCalled();
      // outside table mode the field renders the rows' display names, which are already in hand
      expect(setValueSpy).not.toHaveBeenCalled();

      setValueSpy.mockRestore();
      checkSpy.mockRestore();
    });

    it('reloads the retained rows in table mode, where the grid needs the new journal columns', () => {
      const instance = buildInstance({
        journalId: 'deals-journal',
        keepValueOnJournalIdChange: true,
        viewMode: 'table'
      });
      const checkSpy = jest.spyOn(instance, 'checkJournalId').mockImplementation(() => {});
      const setValueSpy = jest.spyOn(instance, 'setValue').mockImplementation(() => Promise.resolve());
      jest.spyOn(instance, 'probeRowsInJournal').mockResolvedValue([{ id: '1', disp: 'one' }]);

      instance.componentDidUpdate({ journalId: 'static-journal', defaultValue: undefined }, instance.state);

      // `false`: reloading the columns is not a value change formio should hear about
      expect(setValueSpy).toHaveBeenCalledWith([{ id: '1', disp: 'one' }], false);
      expect(instance.state.value).toBe('1');

      setValueSpy.mockRestore();
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

  describe('the keep across a first resolution is provisional', () => {
    // The expression resolving for the first time means one of two things, and the flag cannot tell
    // them apart: the form finished loading a record whose value belongs to the computed journal
    // (keep), or the user filled in the field the expression reads and the journal switched under a
    // value picked from the previous one (clear). The retained rows are checked against the journal
    // that is now in play, and that verdict decides.
    const flush = () => new Promise(resolve => setTimeout(resolve, 0));
    const rowOne = { id: '1', disp: 'one' };

    const switchJournalKeepingValue = (instance, from = 'static-journal') => {
      jest.spyOn(instance, 'checkJournalId').mockImplementation(() => {});
      instance.componentDidUpdate({ journalId: from, defaultValue: undefined }, instance.state);
    };

    const buildKeepingInstance = (props = {}) => buildInstance({ journalId: 'deals-journal', keepValueOnJournalIdChange: true, ...props });

    it('clears a retained value the new journal does not contain — the QA scenario', async () => {
      const onChange = jest.fn();
      const instance = buildKeepingInstance({ onChange });
      const probeSpy = jest.spyOn(instance, 'probeRowsInJournal').mockResolvedValue([]);

      switchJournalKeepingValue(instance);
      await flush();

      // asked about the retained rows, against the journal the expression resolved to
      expect(probeSpy).toHaveBeenCalledWith([rowOne], 'deals-journal');
      // value, selectedRows and gridData.selected go together — a partial reset would leave the
      // next save writing something the field is not showing
      expect(instance.state.value).toBe('');
      expect(instance.state.selectedRows).toEqual([]);
      expect(instance.state.gridData.selected).toEqual([]);
      // ... and formio has to hear about it, or its own dataValue keeps the stale record
      expect(onChange).toHaveBeenCalledWith('');
    });

    it('clears it in table mode too, where the stale value merely looked gone', async () => {
      // The mode only differed in what the user saw: the retained row was re-rendered through the
      // new journal's columns and came out blank, while the value formio held was the stale one
      const onChange = jest.fn();
      const instance = buildKeepingInstance({ onChange, viewMode: 'table' });
      jest.spyOn(instance, 'probeRowsInJournal').mockResolvedValue([]);
      // the column reload the table branch kicks off is not what this is about
      jest.spyOn(instance, 'setValue').mockImplementation(() => Promise.resolve());

      switchJournalKeepingValue(instance);
      await flush();

      expect(instance.state.value).toBe('');
      expect(instance.state.selectedRows).toEqual([]);
      expect(instance.state.gridData.selected).toEqual([]);
      expect(onChange).toHaveBeenCalledWith('');
    });

    it('invalidates the reload the table-mode branch has in flight', async () => {
      // That branch runs the retained rows back through `setValue` to refetch the columns; left
      // alone, its settled promise would write the cleared record back in
      const instance = buildKeepingInstance({ viewMode: 'table' });
      jest.spyOn(instance, 'probeRowsInJournal').mockResolvedValue([]);
      jest.spyOn(instance, 'setValue').mockImplementation(() => new Promise(() => {}));
      const seqBefore = instance.valueResetSeq;

      switchJournalKeepingValue(instance);
      await flush();

      expect(instance.valueResetSeq).toBe(seqBefore + 1);
    });

    it('clears an empty array for a multi-value field', async () => {
      const onChange = jest.fn();
      const instance = buildKeepingInstance({ onChange, multiple: true });
      instance.state = { ...instance.state, value: ['1'] };
      jest.spyOn(instance, 'probeRowsInJournal').mockResolvedValue([]);

      switchJournalKeepingValue(instance);
      await flush();

      expect(instance.state.value).toEqual([]);
      expect(onChange).toHaveBeenCalledWith([]);
    });

    it('keeps only the rows the new journal does contain', async () => {
      const rowTwo = { id: '2', disp: 'two' };
      const instance = buildKeepingInstance({ multiple: true });
      instance.state = { ...instance.state, value: ['1', '2'], selectedRows: [rowOne, rowTwo] };
      jest.spyOn(instance, 'probeRowsInJournal').mockResolvedValue([rowTwo]);
      const setValueSpy = jest.spyOn(instance, 'setValue').mockImplementation(() => Promise.resolve());

      switchJournalKeepingValue(instance);
      await flush();

      expect(setValueSpy).toHaveBeenCalledWith([rowTwo]);
    });

    it('keeps the value the new journal does contain — the record was opened with it', async () => {
      const onChange = jest.fn();
      const instance = buildKeepingInstance({ onChange });
      jest.spyOn(instance, 'probeRowsInJournal').mockResolvedValue([rowOne]);

      switchJournalKeepingValue(instance);
      await flush();

      expect(instance.state.value).toBe('1');
      expect(instance.state.selectedRows).toEqual([rowOne]);
      expect(onChange).not.toHaveBeenCalled();
    });

    it('keeps the value when the journal cannot answer', async () => {
      // Showing a stale value the user can overwrite is recoverable; dropping the record's own
      // value because a request failed is not
      const onChange = jest.fn();
      const instance = buildKeepingInstance({ onChange });
      jest.spyOn(instance, 'probeRowsInJournal').mockResolvedValue(null);

      switchJournalKeepingValue(instance);
      await flush();

      expect(instance.state.value).toBe('1');
      expect(onChange).not.toHaveBeenCalled();
    });

    it('keeps the value when the probe fails outright', async () => {
      const onChange = jest.fn();
      const instance = buildKeepingInstance({ onChange });
      jest.spyOn(instance, 'probeRowsInJournal').mockRejectedValue(new Error('network is down'));
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      switchJournalKeepingValue(instance);
      await flush();

      expect(instance.state.value).toBe('1');
      expect(onChange).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalled();

      warnSpy.mockRestore();
    });

    it('leaves a query value alone — it is not a set of rows a journal can be asked about', async () => {
      const instance = buildKeepingInstance({ dataType: 'query' });
      const probeSpy = jest.spyOn(instance, 'probeRowsInJournal');

      switchJournalKeepingValue(instance);
      await flush();

      expect(probeSpy).not.toHaveBeenCalled();
    });

    it('does not act on a verdict about a journal that has since been left', async () => {
      const onChange = jest.fn();
      const instance = buildKeepingInstance({ onChange });
      let answer;
      jest.spyOn(instance, 'probeRowsInJournal').mockReturnValue(new Promise(resolve => (answer = resolve)));

      switchJournalKeepingValue(instance);
      instance.props = { ...instance.props, journalId: 'third-journal' };
      answer([]);
      await flush();

      expect(instance.state.value).toBe('1');
      expect(onChange).not.toHaveBeenCalled();
    });

    it('does not clear a value the user picked while the probe was running', async () => {
      const onChange = jest.fn();
      const instance = buildKeepingInstance({ onChange });
      let answer;
      jest.spyOn(instance, 'probeRowsInJournal').mockReturnValue(new Promise(resolve => (answer = resolve)));

      switchJournalKeepingValue(instance);
      instance.state = { ...instance.state, value: '2', selectedRows: [{ id: '2', disp: 'two' }] };
      answer([]);
      await flush();

      expect(instance.state.value).toBe('2');
      expect(onChange).not.toHaveBeenCalled();
    });

    it('does not clear when the value was already reset while the probe was running', async () => {
      const onChange = jest.fn();
      const instance = buildKeepingInstance({ onChange });
      let answer;
      jest.spyOn(instance, 'probeRowsInJournal').mockReturnValue(new Promise(resolve => (answer = resolve)));

      switchJournalKeepingValue(instance);
      instance.valueResetSeq += 1;
      answer([]);
      await flush();

      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('probeRowsInJournal', () => {
    const probingInstance = () => {
      const instance = buildInstance({ journalId: 'deals-journal', workspaceId: 'ws1' });

      JournalsService.getJournalConfig.mockResolvedValue({ id: 'deals-journal', columns: ['a'] });
      JournalsService.getJournalData.mockResolvedValue({ records: [], totalCount: 0 });

      return instance;
    };

    beforeEach(() => {
      jest.clearAllMocks();
      Records.get.mockImplementation(id => ({ load: jest.fn(async () => `local-${id}`) }));
      JournalsService.getWorkspaceByPolicy.mockReturnValue([]);
    });

    it('asks the journal about the given rows and nothing else', async () => {
      const instance = probingInstance();

      await instance.probeRowsInJournal([{ id: 'emodel/deal@d1' }], 'deals-journal');

      expect(JournalsService.getJournalConfig).toHaveBeenCalledWith('deals-journal');

      const [, settings] = JournalsService.getJournalData.mock.calls[0];

      expect(settings.filter[0]).toEqual({ t: 'or', val: [{ t: 'eq', att: 'id', val: 'local-emodel/deal@d1' }] });
      // a page big enough for every row asked about — a row past the end would read as missing
      expect(settings.page).toEqual({ skipCount: 0, maxItems: 1, page: 1 });
    });

    it('reports the rows the journal returned', async () => {
      const instance = probingInstance();
      const rows = [{ id: 'r1' }, { id: 'r2' }];

      JournalsService.getJournalData.mockResolvedValue({ records: [{ id: 'r2' }], totalCount: 1 });

      await expect(instance.probeRowsInJournal(rows, 'deals-journal')).resolves.toEqual([{ id: 'r2' }]);
    });

    it('gives no verdict when the journal has no config', async () => {
      const instance = probingInstance();

      JournalsService.getJournalConfig.mockResolvedValue({});

      await expect(instance.probeRowsInJournal([{ id: 'r1' }], 'deals-journal')).resolves.toBeNull();
      expect(JournalsService.getJournalData).not.toHaveBeenCalled();
    });

    it('gives no verdict without a journal id', async () => {
      const instance = probingInstance();

      await expect(instance.probeRowsInJournal([{ id: 'r1' }], '')).resolves.toBeNull();
      expect(JournalsService.getJournalConfig).not.toHaveBeenCalled();
    });

    it('gives no verdict when a row id does not resolve', async () => {
      // The empty `eq` would be dropped by the predicate clean-up, and an `or` that loses its terms
      // stops narrowing the query — the probe would be answering about the journal's first rows
      const instance = probingInstance();

      Records.get.mockImplementation(() => ({ load: jest.fn(async () => '') }));

      await expect(instance.probeRowsInJournal([{ id: 'r1' }], 'deals-journal')).resolves.toBeNull();
      expect(JournalsService.getJournalData).not.toHaveBeenCalled();
    });

    it('keeps the journal default filters in the query', async () => {
      const instance = probingInstance();

      JournalsService.getJournalConfig.mockResolvedValue({
        id: 'deals-journal',
        columns: ['a'],
        defaultFilters: [{ t: 'eq', att: 'status', val: 'active' }]
      });

      await instance.probeRowsInJournal([{ id: 'r1' }], 'deals-journal');

      const [, settings] = JournalsService.getJournalData.mock.calls[0];

      expect(settings.filter).toContainEqual({ t: 'eq', att: 'status', val: 'active' });
    });

    it('searches the journal the config it just fetched describes, not the dropped one', async () => {
      // `resetJournalConfig` empties the state's config right before the probe runs, so the system
      // flag — which decides whether global records are searched for too — has to come from the
      // config in hand
      const instance = probingInstance();
      instance.props = { ...instance.props, searchInWorkspacePolicy: 'current' };

      JournalsService.getJournalConfig.mockResolvedValue({ id: 'deals-journal', columns: ['a'], system: true });
      JournalsService.getWorkspaceByPolicy.mockReturnValue(['ws1']);

      await instance.probeRowsInJournal([{ id: 'r1' }], 'deals-journal');

      const [, settings] = JournalsService.getJournalData.mock.calls[0];

      expect(settings.workspaces).toEqual(['ws1', 'default']);
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
