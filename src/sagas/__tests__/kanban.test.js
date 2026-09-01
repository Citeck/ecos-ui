import { KanbanUrlParams } from '@citeck/constants';
import Records from '@citeck/records-core';
import first from 'lodash/first';
import get from 'lodash/get';
import last from 'lodash/last';
import { runSaga } from 'redux-saga';

import { initJournalSettingData, setJournalConfig, setJournalSetting, setPredicate } from '../../actions/journals';
import {
  setBoardConfig,
  setBoardList,
  setDataCards,
  setFormProps,
  setIsEnabled,
  setIsFiltered,
  setKanbanSettings,
  setLoading,
  setLoadingColumns,
  setOriginKanbanSettings,
  setPagination,
  setRelatedFilter,
  setRefreshing,
  setResolvedActions,
  setTotalCount,
  refreshCardData,
  reloadBoardData,
  setSwimlaneGrouping,
  setSwimlaneValues,
  setSwimlaneCellData,
  setSwimlaneCellLoading
} from '../../actions/kanban';
import reducer from '../../reducers/kanban';
import { computeSwimlanesTotalCount } from '../../selectors/kanban';
import EcosFormUtils from '@/components/forms/EcosForm/EcosFormUtils';
import { DEFAULT_PAGINATION, JOURNAL_DASHLET_CONFIG_VERSION } from '@/components/journals/Journals/constants';
import JournalsService from '@/components/journals/Journals/service/journalsService';
import RecordActions from '@/components/core/Records/actions/recordActions';
import PageService from '../../services/PageService';
import JournalApi from '../__mocks__/journalApi';
import KanbanApi from '../__mocks__/kanbanApi';
import data, { dataCardsWithRecords, swimlaneData } from '../__mocks__/kanbanData';
import * as kanban from '../kanban';

import { NotificationManager } from '@/services/notifications';

const journalId = 'journalId',
  stateId = 'stateId',
  boardId = 'boardId',
  templateId = 'templateId',
  formId = 'formId';

const api = {
  kanban: new KanbanApi(),
  journals: new JournalApi()
};

const load = async attrs => ({ ...attrs });

const recordsGet = id => ({
  id,
  getBaseRecord: () => ({ id, load }),
  get,
  load
});

console.error = jest.fn();

beforeEach(() => {
  delete window.location;
  window.location = {};
  console.error.mockClear();
});

afterEach(() => {
  jest.clearAllMocks();
});

const spyError = jest.spyOn(NotificationManager, 'error').mockResolvedValue(null);
const spyGetFormById = jest
  .spyOn(EcosFormUtils, 'getFormById')
  .mockImplementation(formId => (formId ? (formId === 'no-def' ? {} : data.formConfig) : null));
const spyGetFormInputs = jest.spyOn(EcosFormUtils, 'getFormInputs').mockReturnValue(data.formFields);
const spyPreProcessingAttrs = jest.spyOn(EcosFormUtils, 'preProcessingAttrs').mockReturnValue({ attributes: {}, inputByKey: {} });
const spyPostProcessingAttrs = jest.spyOn(EcosFormUtils, 'postProcessingAttrsData').mockImplementation(({ recordData }) => recordData);
const spyGetJournalConfig = jest.spyOn(JournalsService, 'getJournalConfig').mockResolvedValue(data.journalConfig);
const spyGetJournalData = jest
  .spyOn(JournalsService, 'getJournalData')
  .mockImplementation(d => (d.id === 'set-data-cards' ? data.journalData : {}));
const spyGetRecordActions = jest.spyOn(JournalsService, 'getRecordActions').mockResolvedValue(data.journalActions);
const spyGetBoardCards = jest.spyOn(api.kanban, 'getBoardCards').mockResolvedValue([]);

// Helper to build a board-cards column-entry array (the new getBoardCards return shape) from
// the requested `columns` arg, using a per-column records/totalCount provider.
const boardCardsFor = (columns = [], makeEntry = () => ({ records: [], totalCount: 0 })) =>
  (columns || []).map(col => ({ columnId: col.id, ...makeEntry(col) }));
const spyChangeUrlLink = jest.spyOn(PageService, 'changeUrlLink').mockResolvedValue(data.journalActions);
const spyRecordsGet = jest.spyOn(Records, 'get').mockImplementation(recordsGet);

async function wrapRunSaga(sagaFun, payload = {}, state = {}) {
  const dispatched = [];

  await runSaga(
    {
      dispatch: action => dispatched.push(action),
      getState: () => state
    },
    sagaFun,
    { api, logger: console.error },
    { payload: { stateId, boardId, templateId, ...payload } }
  ).done;

  return dispatched;
}

describe('kanban sagas tests', () => {
  it('sagaGetBoardList > there are _boards', async () => {
    const dispatched = await wrapRunSaga(kanban.sagaGetBoardList, { journalId });
    const [first, second] = dispatched;

    expect(first.type).toEqual(setIsEnabled().type);
    expect(second.type).toEqual(setBoardList().type);
    expect(first.payload.isEnabled).toBeTruthy();
    expect(second.payload.boardList).toEqual(data.boardList);
    expect(second.payload.templateList).toEqual(data.templateList);

    expect(console.error).not.toHaveBeenCalled();

    expect(dispatched).toHaveLength(2);
  });

  it('sagaGetBoardList > there are _no boards', async () => {
    const dispatched = await wrapRunSaga(kanban.sagaGetBoardList);
    const [first] = dispatched;

    expect(first.type).toEqual(setIsEnabled().type);
    expect(first.payload.isEnabled).toBeFalsy();

    expect(console.error).not.toHaveBeenCalled();

    expect(dispatched).toHaveLength(1);
  });

  it('sagaGetBoardConfig', async () => {
    const dispatched = await wrapRunSaga(kanban.sagaGetBoardConfig);
    const [first] = dispatched;

    expect(first.type).toEqual(setBoardConfig().type);
    expect(first.payload.boardConfig).toEqual(data.boardConfig);

    expect(console.error).not.toHaveBeenCalled();

    expect(dispatched).toHaveLength(2);
  });

  it('sagaFormProps > there is _form', async () => {
    const dispatched = await wrapRunSaga(kanban.sagaFormProps, { formId });
    const [first] = dispatched;

    expect(first.type).toEqual(setFormProps().type);
    expect(first.payload.formProps).toEqual(data.formProps);

    expect(spyGetFormById).toHaveBeenCalledTimes(1);
    expect(spyGetFormInputs).toHaveBeenCalledTimes(1);
    expect(spyError).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();

    expect(dispatched).toHaveLength(1);
  });

  it('sagaFormProps > there is _no form', async () => {
    const dispatched = await wrapRunSaga(kanban.sagaFormProps);
    const [first] = dispatched;

    expect(first.type).toEqual(setFormProps().type);
    expect(first.payload.formProps).toEqual({});

    expect(spyGetFormById).not.toHaveBeenCalled();
    expect(spyGetFormInputs).not.toHaveBeenCalled();
    expect(spyError).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalled();

    expect(dispatched).toHaveLength(1);
  });

  it('sagaFormProps > there is _no form _definition', async () => {
    const dispatched = await wrapRunSaga(kanban.sagaFormProps, { formId: 'no-def' });
    const [first] = dispatched;

    expect(first.type).toEqual(setFormProps().type);
    expect(first.payload.formProps).toEqual({});

    expect(spyGetFormById).toHaveBeenCalledTimes(1);
    expect(spyGetFormInputs).not.toHaveBeenCalled();
    expect(spyError).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalled();

    expect(dispatched).toHaveLength(1);
  });

  it('sagaGetBoardData > there is _no journal config / NPE path', async () => {
    const dispatched = await wrapRunSaga(
      kanban.sagaGetBoardData,
      {},
      {
        journals: {
          [stateId]: {
            journalConfig: {}
          }
        }
      }
    );

    const [_boardConfig, _originKanbanSettings, _formProps, _journalConfig, _journalSetting, _initJournalSettingData] = dispatched;
    const _loading = last(dispatched);

    expect(_boardConfig.type).toEqual(setBoardConfig().type);
    expect(_originKanbanSettings.type).toEqual(setOriginKanbanSettings().type);
    const colsLen = get(_boardConfig, 'payload.boardConfig.columns.length');
    expect(_formProps.type).toEqual(setFormProps().type);
    expect(_journalConfig.type).toEqual(setJournalConfig().type);
    expect(_journalSetting.type).toEqual(setJournalSetting().type);
    expect(_initJournalSettingData.type).toEqual(initJournalSettingData().type);
    expect(_loading.type).toEqual(setLoading().type);
    expect(_loading.payload.isLoading).toBeFalsy();

    expect(spyRecordsGet).toHaveBeenCalledTimes(2);
    expect(spyGetFormInputs).toHaveBeenCalledTimes(1);
    expect(spyGetJournalConfig).toHaveBeenCalledTimes(2);
    // Unified board-cards: ONE call loads all columns.
    expect(spyGetBoardCards).toHaveBeenCalledTimes(1);
    expect(get(spyGetBoardCards.mock.calls, '[0][0].columns.length')).toEqual(colsLen);
    // each column carries its own additionalFilter so the server count honours the cutoff
    expect(get(spyGetBoardCards.mock.calls, '[0][0].columns[0].additionalFilter')).toEqual({
      t: 'ge',
      att: '_statusModified',
      val: '-P7D'
    });
    expect(console.error).not.toHaveBeenCalled();
  });

  it('sagaGetBoardData > there is _journal config', async () => {
    const dispatched = await wrapRunSaga(
      kanban.sagaGetBoardData,
      { stateId },
      {
        journals: {
          [stateId]: {
            journalConfig: { ...data.journalConfig, id: 'set-data-cards' }
          }
        }
      }
    );

    const [_boardConfig, _originKanbanSettings, _formProps, _boardConfigColors, _pagination] = dispatched;
    const _loading = last(dispatched);

    expect(_boardConfig.type).toEqual(setBoardConfig().type);
    const colsLen = get(_boardConfig, 'payload.boardConfig.columns.length');
    expect(_formProps.type).toEqual(setFormProps().type);
    expect(_originKanbanSettings.type).toEqual(setOriginKanbanSettings().type);
    expect(_boardConfigColors.type).toEqual(setBoardConfig().type);
    expect(_pagination.type).toEqual(setPagination().type);
    expect(_pagination.payload.pagination).toEqual(DEFAULT_PAGINATION);
    expect(_loading.type).toEqual(setLoading().type);
    expect(_loading.payload.isLoading).toBeFalsy();

    expect(spyGetFormInputs).toHaveBeenCalledTimes(1);
    expect(spyGetJournalConfig).not.toHaveBeenCalled();
    // Unified board-cards: ONE call loads all columns.
    expect(spyGetBoardCards).toHaveBeenCalledTimes(1);
    expect(get(spyGetBoardCards.mock.calls, '[0][0].columns.length')).toEqual(colsLen);
    expect(console.error).not.toHaveBeenCalled();
  });

  it('sagaGetBoardData > there is _no board config', async () => {
    const dispatched = await wrapRunSaga(kanban.sagaGetBoardData, { boardId: null });

    const [_boardConfig, _formProps] = dispatched;
    const _loading = last(dispatched);

    expect(_boardConfig.type).toEqual(setBoardConfig().type);
    expect(_boardConfig.payload.boardConfig).toEqual({ templateId: 'templateId' });
    expect(_formProps.type).toEqual(setFormProps().type);
    expect(_loading.type).toEqual(setLoading().type);
    expect(_loading.payload.isLoading).toBeFalsy();

    expect(console.error).toHaveBeenCalled();
    expect(spyGetFormInputs).not.toHaveBeenCalled();
    expect(spyGetJournalConfig).not.toHaveBeenCalled();
    expect(spyGetJournalData).not.toHaveBeenCalled();
  });

  it('sagaGetData > there is _no any data', async () => {
    const dispatched = await wrapRunSaga(kanban.sagaGetData);
    const [_dataCards, _totalCount] = dispatched;

    expect(_dataCards.type).toEqual(setDataCards().type);
    expect(get(_dataCards, 'payload.dataCards')).toHaveLength(0);
    expect(get(_dataCards, 'payload.dataCards[0].records')).toBeUndefined();
    expect(get(_dataCards, 'payload.dataCards[0].error')).toBeUndefined();
    expect(_totalCount.type).toEqual(setTotalCount().type);
    expect(_totalCount.payload.totalCount).toEqual(0);

    expect(spyGetJournalData).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();
  });

  it('sagaGetData > there is _some data', async () => {
    spyGetBoardCards.mockImplementationOnce(({ columns }) =>
      boardCardsFor(columns, () => ({ records: data.journalData.records, totalCount: data.journalData.totalCount }))
    );
    const dispatched = await wrapRunSaga(kanban.sagaGetData, { ...data, journalConfig: { ...data.journalConfig, id: 'set-data-cards' } });
    const [_dataCards, _totalCount] = dispatched;
    const colsLen = data.boardConfig.columns.length;

    expect(_dataCards.type).toEqual(setDataCards().type);
    expect(get(_dataCards, 'payload.dataCards')).toHaveLength(colsLen);
    expect(_totalCount.type).toEqual(setTotalCount().type);
    expect(_totalCount.payload.totalCount).toEqual(colsLen * data.journalData.totalCount);

    // Unified board-cards: ONE call requesting all columns.
    expect(spyGetBoardCards).toHaveBeenCalledTimes(1);
    expect(get(spyGetBoardCards.mock.calls, '[0][0].columns.length')).toEqual(colsLen);
    expect(spyPostProcessingAttrs).toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();
  });

  it('sagaGetActions > there is _no data', async () => {
    const dispatched = await wrapRunSaga(kanban.sagaGetActions);
    const [_resolvedActions] = dispatched;

    expect(_resolvedActions.type).toEqual(setResolvedActions().type);
    expect(_resolvedActions.payload.resolvedActions).toHaveLength(0);

    expect(spyGetRecordActions).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();

    expect(dispatched).toHaveLength(1);
  });

  it('sagaGetActions > there is _some data', async () => {
    const dispatched = await wrapRunSaga(kanban.sagaGetActions, { boardConfig: data.boardConfig, newRecordRefs: [1, 2] });
    const [_resolvedActions] = dispatched;
    const colsLen = data.boardConfig.columns.length;

    expect(_resolvedActions.type).toEqual(setResolvedActions().type);
    expect(_resolvedActions.payload.resolvedActions).toHaveLength(colsLen);

    expect(spyGetRecordActions).toHaveBeenCalledTimes(colsLen);
    expect(console.error).not.toHaveBeenCalled();

    expect(dispatched).toHaveLength(1);
  });

  it('sagaSelectFromUrl > there is _boardId', async () => {
    window.location = { pathname: '/test' };

    const dispatched = await wrapRunSaga(kanban.sagaSelectFromUrl, { text: boardId });

    expect(spyChangeUrlLink).toHaveBeenCalledTimes(1);
    expect(spyChangeUrlLink).toHaveBeenCalledWith('/test?boardId=boardId', { updateUrl: true });
    expect(console.error).not.toHaveBeenCalled();
    expect(first(dispatched).type).toEqual(setLoading().type);
    expect(first(dispatched).payload.isLoading).toBeTruthy();

    expect(dispatched).toHaveLength(1);
  });

  it('sagaSelectFromUrl > there is _templateId', async () => {
    window.location = { pathname: '/test' };

    const dispatched = await wrapRunSaga(kanban.sagaSelectFromUrl, {
      text: templateId,
      type: 'templates'
    });

    const url = `/test?${KanbanUrlParams.TEMPLATE_ID}=templateId`;

    expect(spyChangeUrlLink).toHaveBeenCalledWith(url, { updateUrl: true });
    expect(console.error).not.toHaveBeenCalled();
    expect(first(dispatched).type).toEqual(setLoading().type);
    expect(first(dispatched).payload.isLoading).toBeTruthy();

    expect(dispatched).toHaveLength(1);
  });

  it('sagaGetData > caps totalCount when server returns nothing new (post-move scroll loop)', async () => {
    // Regression: after a move + scroll past available records, the server returns 0 records
    // but a stale/inflated totalCount. Without capping, records.length stays < totalCount,
    // componentDidUpdate keeps firing getNextPage, and the kanban loops indefinitely.
    const prevDataCards = [
      {
        status: 'some-id-1',
        records: Array.from({ length: 9 }, (_, i) => ({ id: `r${i + 1}`, cardId: `r${i + 1}`, attributes: {} })),
        totalCount: 30
      },
      { status: 'some-id-2', records: [], totalCount: 0 }
    ];

    spyGetBoardCards.mockClear();
    spyGetBoardCards.mockImplementationOnce(({ columns }) => boardCardsFor(columns, () => ({ records: [], totalCount: 30 })));

    const dispatched = await wrapRunSaga(
      kanban.sagaGetData,
      {
        boardConfig: data.boardConfig,
        journalConfig: { ...data.journalConfig, id: 'set-data-cards' },
        journalSetting: data.journalSetting,
        formProps: data.formProps,
        pagination: { skipCount: 30, maxItems: 10, page: 4 }
      },
      { kanban: { [stateId]: { dataCards: prevDataCards } }, journals: { [stateId]: {} } }
    );

    const setDataCardsAction = dispatched.find(d => d.type === setDataCards().type);
    expect(setDataCardsAction).toBeDefined();
    const updatedFromCol = get(setDataCardsAction, 'payload.dataCards[0]');
    // Server returned no new records → totalCount must be capped to records.length (9),
    // not the stale 30 the server kept reporting.
    expect(updatedFromCol.totalCount).toBe(9);
    expect(updatedFromCol.records).toHaveLength(9);
    // The fully-loaded column (some-id-2: records.length === totalCount === 0) must be skipped,
    // so only the not-fully-loaded some-id-1 is requested. Guards the skip condition against inversion.
    expect(get(spyGetBoardCards.mock.calls, '[0][0].columns')).toHaveLength(1);
    expect(get(spyGetBoardCards.mock.calls, '[0][0].columns[0].id')).toBe('some-id-1');
  });

  it('sagaGetData > a column that failed on first load keeps its column id and is retried later', async () => {
    // First load: the server omits some-id-1 from its response (errored/missing entry).
    spyGetBoardCards.mockClear();
    spyGetBoardCards.mockImplementationOnce(({ columns }) =>
      Promise.resolve(
        (columns || [])
          .filter(col => col.id !== 'some-id-1')
          .map(col => ({ columnId: col.id, records: data.journalData.records, totalCount: data.journalData.totalCount }))
      )
    );

    const payload = {
      boardConfig: data.boardConfig,
      journalConfig: { ...data.journalConfig, id: 'set-data-cards' },
      journalSetting: data.journalSetting,
      formProps: data.formProps,
      pagination: DEFAULT_PAGINATION
    };

    const dispatched = await wrapRunSaga(kanban.sagaGetData, payload, { kanban: { [stateId]: {} }, journals: { [stateId]: {} } });

    const firstCards = dispatched.find(d => d.type === setDataCards().type).payload.dataCards;
    // The failed column must keep its real column id (not the '' of the missing prev entry)…
    expect(firstCards[0].status).toBe('some-id-1');
    // …and a truthy error marker, so later fetches know it was requested and failed.
    expect(firstCards[0].error).toBeTruthy();
    expect(firstCards[0].records).toHaveLength(0);
    // The healthy column must NOT get the marker.
    expect(firstCards[1].status).toBe('some-id-2');
    expect(firstCards[1].error).toBeFalsy();

    // Second fetch: the errored column must be requested again even though records.length (0)
    // equals its totalCount (0) — the error marker defeats the fully-loaded skip. The healthy,
    // fully-loaded column stays omitted.
    spyGetBoardCards.mockClear();
    await wrapRunSaga(kanban.sagaGetData, payload, { kanban: { [stateId]: { dataCards: firstCards } }, journals: { [stateId]: {} } });

    expect(spyGetBoardCards).toHaveBeenCalledTimes(1);
    expect(spyGetBoardCards.mock.calls[0][0].columns.map(c => c.id)).toEqual(['some-id-1']);
  });

  it('sagaGetNextPage > there is _some data', async () => {
    const dispatched = await wrapRunSaga(
      kanban.sagaGetNextPage,
      {},
      {
        journals: {
          [stateId]: {
            journalConfig: data.journalConfig
          }
        },
        kanban: {
          [stateId]: {
            formProps: data.formProps,
            boardConfig: data.boardConfig,
            pagination: DEFAULT_PAGINATION
          }
        }
      }
    );
    const [_firstLoading, _pagination] = dispatched;
    const _lastLoading = last(dispatched);

    expect(_firstLoading.type).toEqual(setLoading().type);
    expect(_firstLoading.payload.isLoading).toBeTruthy();
    expect(_pagination.type).toEqual(setPagination().type);
    expect(_pagination.payload.pagination.page).toEqual(DEFAULT_PAGINATION.page + 1);
    expect(_lastLoading.payload.isLoading).toBeFalsy();

    expect(console.error).not.toHaveBeenCalled();
  });

  it('sagaGetNextPage > no-ops while a silent refresh is in flight (isRefreshing)', async () => {
    const dispatched = await wrapRunSaga(
      kanban.sagaGetNextPage,
      {},
      {
        journals: {
          [stateId]: {
            journalConfig: data.journalConfig,
            journalSetting: data.journalSetting
          }
        },
        kanban: {
          [stateId]: {
            formProps: data.formProps,
            boardConfig: data.boardConfig,
            pagination: DEFAULT_PAGINATION,
            totalCount: 100,
            isRefreshing: true
          }
        }
      }
    );

    // The refresh re-fetches every loaded record from the top; a concurrent next-page fetch would
    // race it over the same window. The pagination must not advance and no request may go out.
    expect(dispatched.some(d => d.type === setPagination().type)).toBeFalsy();
    expect(spyGetBoardCards).not.toHaveBeenCalled();
  });

  it('sagaRunAction > view action dispatches refreshCardData', async () => {
    const spyGetRecordActions = jest.spyOn(RecordActions, 'execForRecord').mockResolvedValue(true);
    const dispatched = await wrapRunSaga(kanban.sagaRunAction, { recordRef: '111', action: { type: 'view' } });

    expect(spyGetRecordActions).toHaveBeenCalledTimes(1);

    expect(dispatched).toHaveLength(1);
    expect(dispatched[0].type).toEqual(refreshCardData().type);
    expect(dispatched[0].payload).toEqual({ stateId: 'stateId', recordRef: '111', actionType: 'view' });
  });

  it('sagaRunAction > non-view action dispatches reloadBoardData', async () => {
    const spyGetRecordActions = jest.spyOn(RecordActions, 'execForRecord').mockResolvedValue(true);
    const dispatched = await wrapRunSaga(kanban.sagaRunAction, { recordRef: '111', action: { type: 'delete' } });

    expect(spyGetRecordActions).toHaveBeenCalledTimes(1);

    expect(dispatched).toHaveLength(1);
    expect(dispatched[0].type).toEqual(reloadBoardData().type);
  });

  it('sagaRunAction > edit action dispatches refreshCardData', async () => {
    const spyGetRecordActions = jest.spyOn(RecordActions, 'execForRecord').mockResolvedValue(true);
    const dispatched = await wrapRunSaga(kanban.sagaRunAction, { recordRef: '111', action: { type: 'edit' } });

    expect(spyGetRecordActions).toHaveBeenCalledTimes(1);

    expect(dispatched).toHaveLength(1);
    expect(dispatched[0].type).toEqual(refreshCardData().type);
    expect(dispatched[0].payload).toEqual({ stateId: 'stateId', recordRef: '111', actionType: 'edit' });
  });

  it('sagaRunAction > cancelled action does not refresh or reload', async () => {
    const spyGetRecordActions = jest.spyOn(RecordActions, 'execForRecord').mockResolvedValue(false);
    const dispatched = await wrapRunSaga(kanban.sagaRunAction, { recordRef: '111', action: { type: 'edit' } });

    expect(spyGetRecordActions).toHaveBeenCalledTimes(1);
    expect(dispatched).toHaveLength(0);
  });

  it('sagaMoveCard > there is _no any data', async () => {
    const dispatched = await wrapRunSaga(kanban.sagaMoveCard);
    const [_dataCards] = dispatched;

    expect(_dataCards.type).toEqual(setDataCards().type);
    expect(_dataCards.payload.dataCards).toEqual([]);

    expect(spyError).toHaveBeenCalled();
    expect(console.error).toHaveBeenCalled();

    expect(dispatched).toHaveLength(2);
  });

  it('sagaMoveCard > there is _some data', async () => {
    const dataCards = [
      {
        status: 'some-id-1',
        records: [
          { id: '1', cardId: '1', attributes: {} },
          { id: '2', cardId: '2', attributes: {} }
        ],
        totalCount: 2
      },
      { status: 'some-id-2', records: [], totalCount: 0 }
    ];
    expect(dataCards).toHaveLength(2);
    expect(get(dataCards, '[0].records')).toHaveLength(2);

    const spyMoveCard = jest.spyOn(api.kanban, 'moveCard');

    const dispatched = await wrapRunSaga(
      kanban.sagaMoveCard,
      {
        cardIndex: 0,
        toIndex: 0,
        fromColumnRef: 'some-id-1',
        toColumnRef: 'some-id-2'
      },
      {
        kanban: {
          [stateId]: {
            dataCards,
            boardConfig: data.boardConfig,
            formProps: data.formProps
          }
        },
        journals: {
          [stateId]: {
            journalConfig: data.journalConfig,
            journalSetting: data.journalSetting
          }
        }
      }
    );
    const _firstLoadingColumns = first(dispatched);
    const _optimisticDataCards = dispatched.find(d => d.type === setDataCards().type);
    const _lastLoadingColumns = last(dispatched);

    expect(_firstLoadingColumns.type).toEqual(setLoadingColumns().type);
    expect(_firstLoadingColumns.payload.isLoadingColumns).toEqual(['some-id-1', 'some-id-2']);
    expect(_optimisticDataCards.type).toEqual(setDataCards().type);
    expect(get(_optimisticDataCards, 'payload.dataCards')).toHaveLength(2);
    expect(get(_optimisticDataCards, 'payload.dataCards[0].records')).toHaveLength(1);
    expect(get(_optimisticDataCards, 'payload.dataCards[1].records')).toHaveLength(1);
    expect(get(_optimisticDataCards, 'payload.dataCards[0].records[0].id')).toEqual('2');
    expect(get(_optimisticDataCards, 'payload.dataCards[1].records[0].id')).toEqual('1');
    // totalCount must NOT change optimistically — server reads use EVENTUAL consistency,
    // so a +/-1 optimistic bump bounces (badge: 43 → 44 → 43 → 44 once server catches up).
    expect(get(_optimisticDataCards, 'payload.dataCards[0].totalCount')).toEqual(2);
    expect(get(_optimisticDataCards, 'payload.dataCards[1].totalCount')).toEqual(0);
    expect(_lastLoadingColumns.type).toEqual(setLoadingColumns().type);
    expect(_lastLoadingColumns.payload.isLoadingColumns).toEqual([]);

    // New API: moveCard called with boardRef, card, column, afterCard (null = top for toIndex=0).
    expect(spyMoveCard).toHaveBeenCalledWith({
      boardRef: data.boardConfig.id,
      card: '1',
      column: 'some-id-2',
      afterCard: null,
      grouping: '',
      cards: ['1']
    });

    // After API success, reloadColumns reloads data with server sorting.
    const reloadedDataCards = dispatched.filter(d => d.type === setDataCards().type);

    // Exactly two commits of the board data per move — the optimistic one and the settled one.
    // Every extra commit is another re-render of the moved card, i.e. another visible blink.
    expect(reloadedDataCards).toHaveLength(2);

    expect(spyError).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();
  });

  it('sagaMoveCard > cross-column move at non-top index computes correct afterCard anchor', async () => {
    // Card '1' (index 0 in col-1) moves to col-2 at toIndex=1 (after card 'b').
    const dataCards = [
      {
        status: 'some-id-1',
        records: [{ id: '1', cardId: '1', attributes: {} }],
        totalCount: 1
      },
      {
        status: 'some-id-2',
        records: [
          { id: 'a', cardId: 'a', attributes: {} },
          { id: 'b', cardId: 'b', attributes: {} }
        ],
        totalCount: 2
      }
    ];

    const spyMoveCard = jest.spyOn(api.kanban, 'moveCard');

    await wrapRunSaga(
      kanban.sagaMoveCard,
      {
        cardIndex: 0,
        toIndex: 1,
        fromColumnRef: 'some-id-1',
        toColumnRef: 'some-id-2'
      },
      {
        kanban: {
          [stateId]: {
            dataCards,
            boardConfig: data.boardConfig,
            formProps: data.formProps
          }
        },
        journals: {
          [stateId]: {
            journalConfig: data.journalConfig,
            journalSetting: data.journalSetting
          }
        }
      }
    );

    // afterCard should be 'a' — the card at position toIndex-1=0 in the target list
    // after the moved card has been filtered out (cross-column, so '1' was never there).
    expect(spyMoveCard).toHaveBeenCalledWith({
      boardRef: data.boardConfig.id,
      card: '1',
      column: 'some-id-2',
      afterCard: 'a',
      grouping: '',
      cards: ['a', '1', 'b']
    });

    expect(spyError).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();
  });

  it('sagaMoveCard > same-column reorder computes correct afterCard anchor', async () => {
    // Column 'some-id-1' holds [a, b, c]. Move card 'a' (cardIndex 0) to toIndex 2.
    // After splice removes 'a', the column list is [b, c].
    // getAfterCardRef([b, c], 2, 'a'): list (already excludes 'a') = [b, c], anchor = list[2-1] = c.
    // So afterCard must be 'c'.
    const dataCards = [
      {
        status: 'some-id-1',
        records: [
          { id: 'a', cardId: 'a', attributes: {} },
          { id: 'b', cardId: 'b', attributes: {} },
          { id: 'c', cardId: 'c', attributes: {} }
        ],
        totalCount: 3
      },
      { status: 'some-id-2', records: [], totalCount: 0 }
    ];

    const spyMoveCard = jest.spyOn(api.kanban, 'moveCard');

    await wrapRunSaga(
      kanban.sagaMoveCard,
      {
        cardIndex: 0,
        toIndex: 2,
        fromColumnRef: 'some-id-1',
        toColumnRef: 'some-id-1'
      },
      {
        kanban: {
          [stateId]: {
            dataCards,
            boardConfig: data.boardConfig,
            formProps: data.formProps
          }
        },
        journals: {
          [stateId]: {
            journalConfig: data.journalConfig,
            journalSetting: data.journalSetting
          }
        }
      }
    );

    expect(spyMoveCard).toHaveBeenCalledWith({
      boardRef: data.boardConfig.id,
      card: 'a',
      column: 'some-id-1',
      afterCard: 'c',
      grouping: '',
      cards: ['b', 'c', 'a']
    });

    expect(spyError).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();
  });

  it('sagaMoveCard > long column sends only the prefix down to the drop slot (at least one page)', async () => {
    // 13 cards loaded; move the last card to the top. The move API only needs the cards above the
    // drop slot +1, floored at the board's ACTUAL page size — NOT the whole loaded column.
    const ids = Array.from({ length: 13 }, (_, i) => String(i + 1));
    const dataCards = [
      {
        status: 'some-id-1',
        records: ids.map(id => ({ id, cardId: id, attributes: {} })),
        totalCount: 13
      },
      { status: 'some-id-2', records: [], totalCount: 0 }
    ];

    const spyMoveCard = jest.spyOn(api.kanban, 'moveCard');

    await wrapRunSaga(
      kanban.sagaMoveCard,
      {
        cardIndex: 12,
        toIndex: 0,
        fromColumnRef: 'some-id-1',
        toColumnRef: 'some-id-1'
      },
      {
        kanban: {
          [stateId]: {
            dataCards,
            boardConfig: data.boardConfig,
            formProps: data.formProps,
            pagination: { skipCount: 0, maxItems: 11, page: 1 }
          }
        },
        journals: {
          [stateId]: {
            journalConfig: data.journalConfig,
            journalSetting: data.journalSetting
          }
        }
      }
    );

    // post-insert list = [13, 1, 2, ...]; trimmed to max(insertAt + 2, pagination.maxItems) = 11
    expect(spyMoveCard).toHaveBeenCalledWith({
      boardRef: data.boardConfig.id,
      card: '13',
      column: 'some-id-1',
      afterCard: null,
      grouping: '',
      cards: ['13', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
    });

    expect(spyError).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();
  });

  it('sagaMoveCard > reload caps maxItems at loadedCount to avoid server bug inflating totalCount', async () => {
    // Regression: requesting maxItems > actual records makes the server respond with
    // totalCount = requested maxItems (instead of the filtered count), surfacing as the
    // badge bouncing through inflated values (e.g. 11 → 30 → 10, 10 → 40 → 9) before the
    // next scroll-fetch corrects it. Cap reload's maxItems to loadedCount.
    const dataCards = [
      {
        status: 'some-id-1',
        records: Array.from({ length: 10 }, (_, i) => ({ id: `r${i + 1}`, cardId: `r${i + 1}`, attributes: {} })),
        totalCount: 27
      },
      {
        status: 'some-id-2',
        records: [{ id: 'r99', cardId: 'r99', attributes: {} }],
        totalCount: 1
      }
    ];

    spyGetBoardCards.mockClear();

    await wrapRunSaga(
      kanban.sagaMoveCard,
      { cardIndex: 0, toIndex: 0, fromColumnRef: 'some-id-1', toColumnRef: 'some-id-2' },
      {
        kanban: {
          [stateId]: {
            dataCards,
            boardConfig: data.boardConfig,
            formProps: data.formProps,
            pagination: { skipCount: 30, maxItems: 10, page: 4 }
          }
        },
        journals: {
          [stateId]: { journalConfig: data.journalConfig, journalSetting: data.journalSetting }
        }
      }
    );

    // Reload now issues ONE getBoardCards call carrying both affected columns.
    const reloadCalls = spyGetBoardCards.mock.calls;
    expect(reloadCalls.length).toBeGreaterThanOrEqual(1);
    // pagination.page=4 would have inflated maxItems to 40; reload must stay grounded
    // in actual loadedCount (clamped to DEFAULT_PAGINATION.maxItems=10) instead.
    reloadCalls.forEach(([{ columns }]) => {
      (columns || []).forEach(col => {
        expect(col.maxItems).toBeLessThanOrEqual(10);
        expect(col).toEqual(expect.objectContaining({ skipCount: 0 }));
      });
    });
  });

  it('sagaApplyFilter', async () => {
    const dispatched = await wrapRunSaga(
      kanban.sagaApplyFilter,
      {
        settings: { predicate: { a: 1 } }
      },
      {
        journals: {
          [stateId]: {
            journalConfig: data.journalConfig,
            journalSetting: data.journalSetting
          }
        },
        kanban: {
          [stateId]: {
            boardConfig: data.boardConfig,
            formProps: data.formProps,
            pagination: { page: 1000 }
          }
        }
      }
    );
    const [_predicate, _journalSetting, _kanbanSettings, _pagination] = dispatched;
    const _loading = last(dispatched);

    expect(_predicate.type).toEqual(setPredicate().type);
    expect(_journalSetting.type).toEqual(setJournalSetting().type);
    expect(_kanbanSettings.type).toEqual(setKanbanSettings().type);
    expect(_pagination.type).toEqual(setPagination().type);
    expect(_pagination.payload.pagination.page).toEqual(DEFAULT_PAGINATION.page);
    expect(_loading.type).toEqual(setLoading().type);

    expect(console.error).not.toHaveBeenCalled();
  });

  it('sagaResetFilter', async () => {
    const dispatched = await wrapRunSaga(
      kanban.sagaResetFilter,
      {},
      {
        journals: {
          [stateId]: {
            journalConfig: data.journalConfig,
            journalSetting: data.journalSetting,
            originGridSettings: { predicate: { b: 1 } }
          }
        },
        kanban: {
          [stateId]: {
            boardConfig: data.boardConfig,
            formProps: data.formProps,
            pagination: { page: 1000 }
          }
        }
      }
    );
    const [_predicate, _journalSetting, _kanbanSettings, _pagination] = dispatched;
    const _isFiltered = last(dispatched);

    expect(_predicate.type).toEqual(setPredicate().type);
    expect(_predicate.payload._args).toEqual({ b: 1 });
    expect(_journalSetting.type).toEqual(setJournalSetting().type);
    expect(_kanbanSettings.type).toEqual(setKanbanSettings().type);
    expect(_pagination.type).toEqual(setPagination().type);
    expect(_pagination.payload.pagination.page).toEqual(DEFAULT_PAGINATION.page);
    expect(_isFiltered.type).toEqual(setIsFiltered().type);
    expect(_isFiltered.payload.isFiltered).toEqual(false);

    expect(console.error).not.toHaveBeenCalled();
  });

  it('sagaRunSearchCard > there is _no text & was no', async () => {
    window.location = { pathname: '/test' };

    const dispatched = await wrapRunSaga(kanban.sagaRunSearchCard);

    expect(spyChangeUrlLink).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();

    expect(dispatched).toHaveLength(1);
  });

  it('sagaRunSearchCard > there is _new text & was no', async () => {
    window.location = { pathname: '/test' };

    const dispatched = await wrapRunSaga(kanban.sagaRunSearchCard, { text: 'test' });

    expect(spyChangeUrlLink).toHaveBeenCalledTimes(1);
    expect(spyChangeUrlLink).toHaveBeenCalledWith('/test?search=test', { updateUrl: true });
    expect(console.error).not.toHaveBeenCalled();

    expect(dispatched).toHaveLength(1);
  });

  it('sagaRunSearchCard > there is _same text & was', async () => {
    window.location = { pathname: '/test', search: '?search=test' };

    const dispatched = await wrapRunSaga(kanban.sagaRunSearchCard, { text: 'test' });

    expect(spyChangeUrlLink).not.toHaveBeenCalled();
    expect(dispatched).toHaveLength(1);
  });

  it('sagaRunSearchCard > there is _clean text & was', async () => {
    window.location = { pathname: '/test', search: '?search=test' };

    const dispatched = await wrapRunSaga(kanban.sagaRunSearchCard);

    expect(spyChangeUrlLink).toHaveBeenCalledTimes(1);
    expect(spyChangeUrlLink).toHaveBeenCalledWith('/test', { updateUrl: true });
    expect(console.error).not.toHaveBeenCalled();

    expect(dispatched).toHaveLength(1);
  });

  it('sagaReloadBoardData > there is no data', async () => {
    const dispatched = await wrapRunSaga(
      kanban.sagaReloadBoardData,
      {},
      {
        journals: {
          [stateId]: {
            journalConfig: {},
            journalSetting: {}
          }
        }
      }
    );

    const _firstLoading = first(dispatched);
    const _lastLoading = last(dispatched);

    expect(_firstLoading.type).toEqual(setLoading().type);
    expect(_firstLoading.payload.isLoading).toBeTruthy();
    expect(_lastLoading.type).toEqual(setLoading().type);
    expect(_lastLoading.payload.isLoading).toBeFalsy();
  });

  it('sagaReloadBoardData', async () => {
    const dispatched = await wrapRunSaga(
      kanban.sagaReloadBoardData,
      {},
      {
        journals: {
          [stateId]: {
            journalConfig: data.journalConfig,
            journalSetting: data.journalSetting
          }
        },
        kanban: {
          [stateId]: {
            boardConfig: data.boardConfig,
            formProps: data.formProps,
            pagination: { page: 1000 }
          }
        }
      }
    );

    const _firstLoading = first(dispatched);
    const _lastLoading = last(dispatched);

    expect(spyPreProcessingAttrs).toHaveBeenCalled();
    expect(_firstLoading.type).toEqual(setLoading().type);
    expect(_firstLoading.payload.isLoading).toBeTruthy();
    expect(console.error).not.toHaveBeenCalled();
    expect(_lastLoading.type).toEqual(setLoading().type);
    expect(_lastLoading.payload.isLoading).toBeFalsy();
  });

  describe('sagaReloadBoardData > silent refresh (COREDEV-426)', () => {
    const silentState = {
      journals: {
        [stateId]: {
          journalConfig: data.journalConfig,
          journalSetting: data.journalSetting
        }
      },
      kanban: {
        [stateId]: {
          boardConfig: data.boardConfig,
          formProps: data.formProps,
          dataCards: dataCardsWithRecords,
          pagination: { skipCount: 20, maxItems: 10, page: 3 }
        }
      }
    };

    it('refreshes in place: no setLoading, no pagination reset, isRefreshing raised and cleared', async () => {
      spyGetBoardCards.mockImplementationOnce(({ columns }) =>
        Promise.resolve(boardCardsFor(columns, col => ({ records: [{ id: `${col.id}-fresh`, cardId: `${col.id}-fresh` }], totalCount: 1 })))
      );

      const dispatched = await wrapRunSaga(kanban.sagaReloadBoardData, { silent: true }, silentState);

      // The loader that used to blank the whole board never fires, and the pagination that used to be
      // rewound to page 1 is left alone so getNextPage keeps counting from where the user got to.
      expect(dispatched.some(d => d.type === setLoading().type)).toBeFalsy();
      expect(dispatched.some(d => d.type === setPagination().type)).toBeFalsy();

      const refreshing = dispatched.filter(d => d.type === setRefreshing().type);
      expect(refreshing.map(d => d.payload.isRefreshing)).toEqual([true, false]);

      expect(dispatched.some(d => d.type === setDataCards().type)).toBeTruthy();
      expect(console.error).not.toHaveBeenCalled();
    });

    it('re-fetches exactly the volume already loaded per column, from the top', async () => {
      await wrapRunSaga(kanban.sagaReloadBoardData, { silent: true }, silentState);

      const callArgs = spyGetBoardCards.mock.calls[spyGetBoardCards.mock.calls.length - 1][0];
      expect(callArgs.columns).toEqual([
        expect.objectContaining({ id: 'some-id-1', skipCount: 0, maxItems: DEFAULT_PAGINATION.maxItems }),
        expect.objectContaining({ id: 'some-id-2', skipCount: 0, maxItems: DEFAULT_PAGINATION.maxItems })
      ]);
    });

    it('a column loaded past the first page is re-fetched at its full loaded size', async () => {
      const records = Array.from({ length: 25 }, (_, i) => ({ id: `rec-${i}`, cardId: `rec-${i}` }));
      const state = {
        ...silentState,
        kanban: { [stateId]: { ...silentState.kanban[stateId], dataCards: [{ status: 'some-id-1', records, totalCount: 40 }] } }
      };

      await wrapRunSaga(kanban.sagaReloadBoardData, { silent: true }, state);

      const callArgs = spyGetBoardCards.mock.calls[spyGetBoardCards.mock.calls.length - 1][0];
      expect(callArgs.columns).toEqual([expect.objectContaining({ id: 'some-id-1', skipCount: 0, maxItems: 25 })]);
    });

    it('falls back to the full reload when there is nothing loaded to refresh', async () => {
      const state = {
        ...silentState,
        kanban: { [stateId]: { ...silentState.kanban[stateId], dataCards: [] } }
      };

      const dispatched = await wrapRunSaga(kanban.sagaReloadBoardData, { silent: true }, state);

      expect(dispatched.some(d => d.type === setLoading().type && d.payload.isLoading)).toBeTruthy();
      expect(dispatched.some(d => d.type === setPagination().type)).toBeTruthy();
    });

    it('is skipped while a load is already in flight (isLoading) — no request, no isRefreshing', async () => {
      const state = {
        ...silentState,
        kanban: { [stateId]: { ...silentState.kanban[stateId], isLoading: true } }
      };

      const dispatched = await wrapRunSaga(kanban.sagaReloadBoardData, { silent: true }, state);

      expect(dispatched).toHaveLength(0);
      expect(spyGetBoardCards).not.toHaveBeenCalled();
    });

    it('is skipped while another refresh is already in flight (isRefreshing) — no request, no re-raise', async () => {
      const state = {
        ...silentState,
        kanban: { [stateId]: { ...silentState.kanban[stateId], isRefreshing: true } }
      };

      const dispatched = await wrapRunSaga(kanban.sagaReloadBoardData, { silent: true }, state);

      expect(dispatched).toHaveLength(0);
      expect(spyGetBoardCards).not.toHaveBeenCalled();
    });

    it('refreshes every loaded swimlane cell instead of the flat columns', async () => {
      const state = {
        ...silentState,
        kanban: {
          [stateId]: {
            ...silentState.kanban[stateId],
            dataCards: [],
            swimlaneGrouping: swimlaneData.swimlaneGrouping,
            swimlanes: swimlaneData.swimlanes
          }
        }
      };

      const dispatched = await wrapRunSaga(kanban.sagaReloadBoardData, { silent: true }, state);

      expect(dispatched.some(d => d.type === setLoading().type)).toBeFalsy();
      const cells = dispatched.filter(d => d.type === setSwimlaneCellData().type).map(d => `${d.payload.swimlaneId}/${d.payload.statusId}`);
      expect(cells.sort()).toEqual([
        'priority-high/some-id-1',
        'priority-high/some-id-2',
        'priority-low/some-id-1',
        'priority-low/some-id-2'
      ]);
    });

    it('a swimlane cell loaded past the first page is re-fetched at its full loaded size', async () => {
      const records = Array.from({ length: 25 }, (_, i) => ({ id: `rec-${i}`, cardId: `rec-${i}` }));
      const swimlanes = [
        {
          ...swimlaneData.swimlanes[0],
          cells: {
            ...swimlaneData.swimlanes[0].cells,
            'some-id-1': { ...swimlaneData.swimlanes[0].cells['some-id-1'], records, totalCount: 40 }
          }
        },
        swimlaneData.swimlanes[1]
      ];
      const state = {
        ...silentState,
        kanban: {
          [stateId]: {
            ...silentState.kanban[stateId],
            dataCards: [],
            swimlaneGrouping: swimlaneData.swimlaneGrouping,
            swimlanes
          }
        }
      };

      // The first row request is priority-high: the server returns all 25 records but a stale
      // totalCount — the written totalCount must never fall below the loaded count.
      spyGetBoardCards.mockImplementationOnce(({ columns }) =>
        Promise.resolve(
          boardCardsFor(columns, col => (col.id === 'some-id-1' ? { records, totalCount: 20 } : { records: [], totalCount: 0 }))
        )
      );

      const dispatched = await wrapRunSaga(kanban.sagaReloadBoardData, { silent: true }, state);

      // The priority-high row request carries the cell's loaded volume for some-id-1 (25, from the
      // top) and the default page for some-id-2 — not the constant first page for both.
      const rowCall = spyGetBoardCards.mock.calls.map(([args]) => args).find(args => (args.columns || []).some(c => c.maxItems === 25));
      expect(rowCall).toBeDefined();
      expect(rowCall.columns).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: 'some-id-1', skipCount: 0, maxItems: 25 }),
          expect.objectContaining({ id: 'some-id-2', skipCount: 0, maxItems: DEFAULT_PAGINATION.maxItems })
        ])
      );
      expect(rowCall.maxItemsPerColumn).toBe(25);

      const bigCell = dispatched.find(
        d => d.type === setSwimlaneCellData().type && d.payload.swimlaneId === 'priority-high' && d.payload.statusId === 'some-id-1'
      );
      expect(bigCell).toBeDefined();
      expect(bigCell.payload.records).toHaveLength(25);
      expect(bigCell.payload.totalCount).toBe(25);
    });

    it('re-derives the swimlane rows: keeps loaded rows, adds new ones, drops vanished ones', async () => {
      const spyGetDistinctValues = jest.spyOn(api.kanban, 'getDistinctValues').mockReturnValueOnce([
        { id: 'priority-high', label: 'High' },
        { id: 'priority-new', label: 'New' }
      ]);

      const swimlanes = [{ ...swimlaneData.swimlanes[0], isCollapsed: true }, swimlaneData.swimlanes[1]];
      const state = {
        ...silentState,
        kanban: {
          [stateId]: {
            ...silentState.kanban[stateId],
            dataCards: [],
            swimlaneGrouping: swimlaneData.swimlaneGrouping,
            swimlanes
          }
        }
      };

      const dispatched = await wrapRunSaga(kanban.sagaReloadBoardData, { silent: true }, state);

      expect(spyGetDistinctValues).toHaveBeenCalledTimes(1);

      const valuesAction = dispatched.find(d => d.type === setSwimlaneValues().type);
      expect(valuesAction).toBeDefined();
      const merged = valuesAction.payload.swimlanes;
      expect(merged.map(sl => sl.id)).toEqual(['priority-high', 'priority-new']);

      // The surviving row keeps its collapsed state and its loaded cell records.
      const surviving = merged.find(sl => sl.id === 'priority-high');
      expect(surviving.isCollapsed).toBe(true);
      expect(surviving.cells['some-id-1'].records.map(r => r.id)).toEqual(['rec-1', 'rec-2']);

      // The new row appears with skeleton cells, exactly like a first swimlane load builds them.
      const fresh = merged.find(sl => sl.id === 'priority-new');
      expect(fresh.cells['some-id-1']).toEqual({ records: [], totalCount: 0, pagination: { ...DEFAULT_PAGINATION }, isLoading: true });
      expect(fresh.cells['some-id-2']).toEqual({ records: [], totalCount: 0, pagination: { ...DEFAULT_PAGINATION }, isLoading: true });

      // ...and the cell reload covers the new row too, while the vanished row is gone.
      const cells = dispatched.filter(d => d.type === setSwimlaneCellData().type).map(d => `${d.payload.swimlaneId}/${d.payload.statusId}`);
      expect(cells.sort()).toEqual([
        'priority-high/some-id-1',
        'priority-high/some-id-2',
        'priority-new/some-id-1',
        'priority-new/some-id-2'
      ]);
    });
  });

  describe('sagaRefreshCard', () => {
    const baseKanbanState = {
      boardConfig: data.boardConfig,
      formProps: data.formProps,
      pagination: DEFAULT_PAGINATION
    };

    const makeState = (kanbanOverrides = {}) => ({
      journals: { [stateId]: { journalConfig: data.journalConfig, journalSetting: data.journalSetting } },
      kanban: { [stateId]: { ...baseKanbanState, ...kanbanOverrides } }
    });

    it('flat mode > card stays in same column', async () => {
      spyRecordsGet.mockImplementation(id => ({
        id,
        getBaseRecord: () => ({ id, load }),
        load: async attrs => ({ ...attrs, _status: 'some-id-1', id, cardId: id })
      }));

      const dispatched = await wrapRunSaga(kanban.sagaRefreshCard, { recordRef: 'rec-1' }, makeState({ dataCards: dataCardsWithRecords }));

      const dataCardsAction = dispatched.find(d => d.type === setDataCards().type);
      expect(dataCardsAction).toBeDefined();
      expect(dataCardsAction.payload.dataCards[0].records).toHaveLength(2);
      expect(dataCardsAction.payload.dataCards[0].records.find(r => r.id === 'rec-1')).toBeDefined();
    });

    it('flat mode > card moves to different column', async () => {
      spyRecordsGet.mockImplementation(id => ({
        id,
        getBaseRecord: () => ({ id, load }),
        load: async attrs => ({ ...attrs, _status: 'some-id-2', id, cardId: id })
      }));

      const dispatched = await wrapRunSaga(kanban.sagaRefreshCard, { recordRef: 'rec-1' }, makeState({ dataCards: dataCardsWithRecords }));

      const dataCardsAction = dispatched.find(d => d.type === setDataCards().type);
      expect(dataCardsAction).toBeDefined();
      expect(dataCardsAction.payload.dataCards[0].records).toHaveLength(1);
      expect(dataCardsAction.payload.dataCards[1].records).toHaveLength(2);
    });

    it('flat mode > card not found dispatches reloadBoardData', async () => {
      spyRecordsGet.mockImplementation(id => ({
        id,
        getBaseRecord: () => ({ id, load }),
        load: async attrs => ({ ...attrs, _status: 'some-id-1', id, cardId: id })
      }));

      const dispatched = await wrapRunSaga(
        kanban.sagaRefreshCard,
        { recordRef: 'non-existent' },
        makeState({ dataCards: dataCardsWithRecords })
      );

      expect(dispatched.some(d => d.type === reloadBoardData().type)).toBeTruthy();
    });

    it('flat mode > no boardConfig dispatches reloadBoardData', async () => {
      const dispatched = await wrapRunSaga(kanban.sagaRefreshCard, { recordRef: 'rec-1' }, makeState({ boardConfig: null }));

      expect(dispatched.some(d => d.type === reloadBoardData().type)).toBeTruthy();
    });

    it('swimlane mode > card stays in same cell', async () => {
      spyRecordsGet.mockImplementation(id => ({
        id,
        getBaseRecord: () => ({ id, load }),
        load: async attrs => ({ ...attrs, _status: 'some-id-1', _swimlaneValue: 'priority-high', id, cardId: id })
      }));

      const dispatched = await wrapRunSaga(kanban.sagaRefreshCard, { recordRef: 'rec-1' }, makeState({ ...swimlaneData }));

      const cellActions = dispatched.filter(d => d.type === setSwimlaneCellData().type);
      expect(cellActions).toHaveLength(1);
      expect(cellActions[0].payload.swimlaneId).toBe('priority-high');
      expect(cellActions[0].payload.statusId).toBe('some-id-1');
    });

    it('swimlane mode > card moves to different status', async () => {
      spyRecordsGet.mockImplementation(id => ({
        id,
        getBaseRecord: () => ({ id, load }),
        load: async attrs => ({ ...attrs, _status: 'some-id-2', _swimlaneValue: 'priority-high', id, cardId: id })
      }));

      const dispatched = await wrapRunSaga(kanban.sagaRefreshCard, { recordRef: 'rec-1' }, makeState({ ...swimlaneData }));

      const cellActions = dispatched.filter(d => d.type === setSwimlaneCellData().type);
      expect(cellActions).toHaveLength(2);
    });

    it('swimlane mode > card moves to different swimlane', async () => {
      spyRecordsGet.mockImplementation(id => ({
        id,
        getBaseRecord: () => ({ id, load }),
        load: async attrs => ({ ...attrs, _status: 'some-id-1', _swimlaneValue: 'priority-low', id, cardId: id })
      }));

      const dispatched = await wrapRunSaga(kanban.sagaRefreshCard, { recordRef: 'rec-1' }, makeState({ ...swimlaneData }));

      const cellActions = dispatched.filter(d => d.type === setSwimlaneCellData().type);
      expect(cellActions).toHaveLength(2);
      const swimlaneIds = cellActions.map(a => a.payload.swimlaneId);
      expect(swimlaneIds).toContain('priority-high');
      expect(swimlaneIds).toContain('priority-low');
    });

    it('swimlane mode > unknown swimlane value dispatches reloadBoardData', async () => {
      spyRecordsGet.mockImplementation(id => ({
        id,
        getBaseRecord: () => ({ id, load }),
        load: async attrs => ({ ...attrs, _status: 'some-id-1', _swimlaneValue: 'unknown', id, cardId: id })
      }));

      const dispatched = await wrapRunSaga(kanban.sagaRefreshCard, { recordRef: 'rec-1' }, makeState({ ...swimlaneData }));

      expect(dispatched.some(d => d.type === reloadBoardData().type)).toBeTruthy();
    });

    it('error dispatches reloadBoardData', async () => {
      spyRecordsGet.mockImplementation(id => ({
        id,
        getBaseRecord: () => ({ id, load }),
        load: async () => {
          throw new Error('load failed');
        }
      }));

      const dispatched = await wrapRunSaga(kanban.sagaRefreshCard, { recordRef: 'rec-1' }, makeState({ dataCards: dataCardsWithRecords }));

      expect(dispatched.some(d => d.type === reloadBoardData().type)).toBeTruthy();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('sagaMoveSwimlaneCard', () => {
    const makeState = (kanbanOverrides = {}) => ({
      kanban: { [stateId]: { boardConfig: data.boardConfig, ...swimlaneData, ...kanbanOverrides } }
    });

    it('successful cross-cell move calls moveCard with boardRef/card/column/afterCard', async () => {
      const spyMoveCard = jest.spyOn(api.kanban, 'moveCard');

      const dispatched = await wrapRunSaga(
        kanban.sagaMoveSwimlaneCard,
        { cardIndex: 0, toIndex: 0, fromSwimlaneId: 'priority-high', fromStatusId: 'some-id-1', toStatusId: 'some-id-2' },
        {
          ...makeState(),
          journals: { [stateId]: { journalConfig: data.journalConfig, journalSetting: data.journalSetting } }
        }
      );

      const cellActions = dispatched.filter(d => d.type === setSwimlaneCellData().type);
      // 2 optimistic + reload from server (sagaLoadSwimlaneCells)
      expect(cellActions.length).toBeGreaterThanOrEqual(2);
      expect(cellActions[0].payload.statusId).toBe('some-id-1');
      expect(cellActions[1].payload.statusId).toBe('some-id-2');

      // afterCard = null because toIndex=0 (top of destination)
      expect(spyMoveCard).toHaveBeenCalledWith({
        boardRef: data.boardConfig.id,
        card: 'rec-1',
        column: 'some-id-2',
        afterCard: null,
        grouping: 'priority',
        cards: ['rec-1', 'rec-3']
      });
    });

    it('same-cell reorder computes correct afterCard anchor', async () => {
      // swimlaneData priority-high some-id-1 holds [rec-1, rec-2].
      // Move rec-1 (cardIndex 0) to toIndex 1 → afterCard should be 'rec-2'.
      const spyMoveCard = jest.spyOn(api.kanban, 'moveCard');

      const dispatched = await wrapRunSaga(
        kanban.sagaMoveSwimlaneCard,
        { cardIndex: 0, toIndex: 1, fromSwimlaneId: 'priority-high', fromStatusId: 'some-id-1', toStatusId: 'some-id-1' },
        {
          ...makeState(),
          journals: { [stateId]: { journalConfig: data.journalConfig, journalSetting: data.journalSetting } }
        }
      );

      const cellActions = dispatched.filter(d => d.type === setSwimlaneCellData().type);
      // 1 optimistic for same-cell + reloads from sagaLoadSwimlaneCells
      expect(cellActions.length).toBeGreaterThanOrEqual(1);

      expect(spyMoveCard).toHaveBeenCalledWith({
        boardRef: data.boardConfig.id,
        card: 'rec-1',
        column: 'some-id-1',
        afterCard: 'rec-2',
        grouping: 'priority',
        cards: ['rec-2', 'rec-1']
      });

      expect(spyError).not.toHaveBeenCalled();
      expect(console.error).not.toHaveBeenCalled();
    });

    it('post-move reload re-fetches each cell of the row at its loaded volume, not the first page', async () => {
      const bigRecords = Array.from({ length: 25 }, (_, i) => ({ id: `big-${i}`, cardId: `big-${i}` }));
      const swimlanes = swimlaneData.swimlanes.map(sl =>
        sl.id === 'priority-high'
          ? { ...sl, cells: { ...sl.cells, 'some-id-1': { ...sl.cells['some-id-1'], records: bigRecords, totalCount: 40 } } }
          : sl
      );

      await wrapRunSaga(
        kanban.sagaMoveSwimlaneCard,
        { cardIndex: 0, toIndex: 1, fromSwimlaneId: 'priority-high', fromStatusId: 'some-id-1', toStatusId: 'some-id-1' },
        {
          ...makeState({ swimlanes }),
          journals: { [stateId]: { journalConfig: data.journalConfig, journalSetting: data.journalSetting } }
        }
      );

      const reloadArgs = spyGetBoardCards.mock.calls[spyGetBoardCards.mock.calls.length - 1][0];
      const reloadedCell = (reloadArgs.columns || []).find(col => col.id === 'some-id-1');
      expect(reloadedCell).toEqual(expect.objectContaining({ id: 'some-id-1', skipCount: 0, maxItems: 25 }));
    });

    it('swimlane not found is noop', async () => {
      const dispatched = await wrapRunSaga(
        kanban.sagaMoveSwimlaneCard,
        { cardIndex: 0, toIndex: 0, fromSwimlaneId: 'non-existent', fromStatusId: 'some-id-1', toStatusId: 'some-id-2' },
        makeState()
      );

      expect(dispatched).toHaveLength(0);
    });

    it('API error triggers rollback', async () => {
      const origMoveCard = api.kanban.moveCard;
      api.kanban.moveCard = jest.fn().mockRejectedValue(new Error('move failed'));

      const dispatched = await wrapRunSaga(
        kanban.sagaMoveSwimlaneCard,
        { cardIndex: 0, toIndex: 0, fromSwimlaneId: 'priority-high', fromStatusId: 'some-id-1', toStatusId: 'some-id-2' },
        makeState()
      );

      const cellActions = dispatched.filter(d => d.type === setSwimlaneCellData().type);
      expect(cellActions).toHaveLength(4);
      expect(spyError).toHaveBeenCalled();

      api.kanban.moveCard = origMoveCard;
    });
  });

  describe('sagaSetSwimlaneGrouping', () => {
    it('enable grouping dispatches setSwimlaneGrouping', async () => {
      const dispatched = await wrapRunSaga(
        kanban.sagaSetSwimlaneGrouping,
        { swimlaneGrouping: { attribute: 'priority', label: 'Priority' } },
        {
          journals: { [stateId]: { journalConfig: data.journalConfig, journalSetting: data.journalSetting } },
          kanban: { [stateId]: { boardConfig: data.boardConfig, formProps: data.formProps, swimlaneGrouping: null, swimlanes: [] } }
        }
      );

      const groupingAction = dispatched.find(d => d.type === setSwimlaneGrouping().type);
      expect(groupingAction).toBeDefined();
      expect(groupingAction.payload.swimlaneGrouping).toEqual({ attribute: 'priority', label: 'Priority' });
    });

    it('disable grouping dispatches setSwimlaneGrouping(null) and reloads', async () => {
      const dispatched = await wrapRunSaga(
        kanban.sagaSetSwimlaneGrouping,
        { swimlaneGrouping: null },
        {
          journals: { [stateId]: { journalConfig: data.journalConfig, journalSetting: data.journalSetting } },
          kanban: {
            [stateId]: { boardConfig: data.boardConfig, formProps: data.formProps, ...swimlaneData, pagination: DEFAULT_PAGINATION }
          }
        }
      );

      const groupingAction = dispatched.find(d => d.type === setSwimlaneGrouping().type);
      expect(groupingAction).toBeDefined();
      expect(groupingAction.payload.swimlaneGrouping).toBeNull();

      const loadingActions = dispatched.filter(d => d.type === setLoading().type);
      expect(loadingActions.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('sagaLoadSwimlaneValues', () => {
    const journalsState = {
      journals: { [stateId]: { journalConfig: { ...data.journalConfig, id: 'set-data-cards' }, journalSetting: data.journalSetting } }
    };

    const makeState = (kanbanOverrides = {}) => ({
      ...journalsState,
      kanban: {
        [stateId]: {
          boardConfig: data.boardConfig,
          formProps: data.formProps,
          swimlaneGrouping: { attribute: 'priority', label: 'Priority' },
          swimlanes: [],
          ...kanbanOverrides
        }
      }
    });

    // per-column server counts used by the aggregate assertions below
    const countByColumn = { 'some-id-1': 3, 'some-id-2': 2 };

    beforeEach(() => {
      spyGetBoardCards.mockImplementation(({ columns }) =>
        Promise.resolve(
          boardCardsFor(columns, col => ({
            records: Array.from({ length: countByColumn[col.id] }, (_, i) => ({ id: `${col.id}-rec-${i}`, attributes: {} })),
            totalCount: countByColumn[col.id]
          }))
        )
      );
    });

    afterEach(() => {
      spyGetBoardCards.mockReset();
      spyGetBoardCards.mockResolvedValue([]);
    });

    it('builds a row per distinct value and fills every cell with the server totalCount', async () => {
      const dispatched = await wrapRunSaga(kanban.sagaLoadSwimlaneValues, {}, makeState());

      const valuesAction = dispatched.find(d => d.type === setSwimlaneValues().type);
      expect(valuesAction).toBeDefined();
      expect(valuesAction.payload.swimlanes.map(sl => sl.id)).toEqual(['priority-high', 'priority-low']);

      const cellActions = dispatched.filter(d => d.type === setSwimlaneCellData().type);
      // 2 rows x 2 columns
      expect(cellActions).toHaveLength(4);
      cellActions.forEach(action => {
        expect(action.payload.totalCount).toBe(countByColumn[action.payload.statusId]);
      });

      // every row is queried with the grouping attribute, i.e. the counts are per (row, column)
      spyGetBoardCards.mock.calls.forEach(([arg]) => expect(arg.grouping).toBe('priority'));
    });

    it('loads rows in bounded concurrent batches and still loads every row', async () => {
      const rows = 2 * kanban.SWIMLANE_ROWS_CHUNK + 5;
      const spyDistinct = jest
        .spyOn(api.kanban, 'getDistinctValues')
        .mockReturnValueOnce(Array.from({ length: rows }, (_, i) => ({ id: `group-${i}`, label: `Group ${i}` })));

      // Track how many row requests are in flight at once: resolution is deferred to a macrotask,
      // so every request of a batch starts before any of them settles.
      let inFlight = 0;
      let maxInFlight = 0;
      spyGetBoardCards.mockImplementation(
        ({ columns }) =>
          new Promise(resolve => {
            inFlight += 1;
            maxInFlight = Math.max(maxInFlight, inFlight);
            setTimeout(() => {
              inFlight -= 1;
              resolve(boardCardsFor(columns, () => ({ records: [], totalCount: 0 })));
            }, 0);
          })
      );

      const dispatched = await wrapRunSaga(kanban.sagaLoadSwimlaneValues, {}, makeState());

      // completeness: a broken chunk loop would skip or duplicate rows
      expect(spyGetBoardCards).toHaveBeenCalledTimes(rows);
      const valuesAction = dispatched.find(d => d.type === setSwimlaneValues().type);
      expect(valuesAction.payload.swimlanes).toHaveLength(rows);
      // boundedness: an unchunked all() would put all rows in flight at once
      expect(maxInFlight).toBeLessThanOrEqual(kanban.SWIMLANE_ROWS_CHUNK);

      spyDistinct.mockRestore();
    });

    it('column badges and the board total are the sum of the loaded cells', async () => {
      const dispatched = await wrapRunSaga(kanban.sagaLoadSwimlaneValues, {}, makeState());

      // replay what the store would do, then read the numbers the UI shows
      const storeState = dispatched.reduce((acc, action) => reducer(acc, action), {});
      const swimlanes = storeState[stateId].swimlanes;

      const badge = columnId => swimlanes.reduce((sum, sl) => sum + get(sl, ['cells', columnId, 'totalCount'], 0), 0);

      expect(badge('some-id-1')).toBe(6);
      expect(badge('some-id-2')).toBe(4);
      // "Total: N" must equal the sum of the badges — no stale state.totalCount from the flat path
      expect(computeSwimlanesTotalCount(swimlanes, data.boardConfig)).toBe(10);
    });
  });

  describe('sagaLoadSwimlaneCells', () => {
    const makeState = swimlanes => ({
      journals: { [stateId]: { journalConfig: { ...data.journalConfig, id: 'set-data-cards' }, journalSetting: data.journalSetting } },
      kanban: {
        [stateId]: {
          boardConfig: data.boardConfig,
          formProps: data.formProps,
          swimlaneGrouping: { attribute: 'priority', label: 'Priority' },
          swimlanes
        }
      }
    });

    it('reloads the whole loaded window of every cell from the start', async () => {
      // Both terms of the window formula must decide somewhere:
      // - cell 1: 25 records loaded but pagination is stale at 10 (a DnD insert via
      //   setSwimlaneCellData never updates pagination) — loadedCount must win, ask for 25;
      // - cell 2: 1 record on a window expanded to 30 — the stored window must win, ask for 30.
      // Always from skipCount 0 — requesting the "next" page would collapse the cell.
      const swimlanes = [
        {
          id: 'priority-high',
          label: 'High',
          cells: {
            'some-id-1': {
              records: Array.from({ length: 25 }, (_, i) => ({ id: `rec-${i}`, cardId: `rec-${i}` })),
              totalCount: 41,
              pagination: { skipCount: 0, maxItems: 10 },
              isLoading: false
            },
            'some-id-2': {
              records: [{ id: 'rec-x', cardId: 'rec-x' }],
              totalCount: 1,
              pagination: { skipCount: 0, maxItems: 30 },
              isLoading: false
            }
          }
        }
      ];

      await wrapRunSaga(kanban.sagaLoadSwimlaneCells, { swimlaneId: 'priority-high' }, makeState(swimlanes));

      const callArgs = spyGetBoardCards.mock.calls[spyGetBoardCards.mock.calls.length - 1][0];
      expect(callArgs.columns).toEqual([
        expect.objectContaining({ id: 'some-id-1', skipCount: 0, maxItems: 25 }),
        expect.objectContaining({ id: 'some-id-2', skipCount: 0, maxItems: 30 })
      ]);
      expect(callArgs.maxItemsPerColumn).toBe(30);
    });

    it('a cell badge never shows fewer than the cards it holds (missing/low server totalCount)', async () => {
      spyGetBoardCards.mockResolvedValueOnce([
        { columnId: 'some-id-1', records: Array.from({ length: 3 }, (_, i) => ({ id: `rec-${i}`, attributes: {} })) },
        { columnId: 'some-id-2', records: Array.from({ length: 2 }, (_, i) => ({ id: `rec-b-${i}`, attributes: {} })), totalCount: 1 }
      ]);

      const dispatched = await wrapRunSaga(
        kanban.sagaLoadSwimlaneCells,
        { swimlaneId: 'priority-high' },
        makeState([{ id: 'priority-high', label: 'High', cells: {} }])
      );

      const byStatus = new Map(dispatched.filter(d => d.type === setSwimlaneCellData().type).map(a => [a.payload.statusId, a.payload]));
      expect(byStatus.get('some-id-1').totalCount).toBe(3);
      expect(byStatus.get('some-id-2').totalCount).toBe(2);
    });

    it('reloadSwimlaneCells (silent reload after a card edit) keeps the expanded window too', async () => {
      const swimlanes = [
        {
          id: 'priority-high',
          label: 'High',
          cells: {
            'some-id-1': {
              records: Array.from({ length: 25 }, (_, i) => ({ id: `rec-${i}`, cardId: `rec-${i}` })),
              totalCount: 41,
              pagination: { skipCount: 0, maxItems: 25 },
              isLoading: false
            },
            'some-id-2': { records: [], totalCount: 0, pagination: DEFAULT_PAGINATION, isLoading: false }
          }
        }
      ];

      const dispatched = [];
      await runSaga({ dispatch: action => dispatched.push(action), getState: () => makeState(swimlanes) }, kanban.reloadSwimlaneCells, {
        api,
        stateId,
        boardConfig: data.boardConfig,
        swimlaneGrouping: { attribute: 'priority' },
        cells: [{ swimlaneId: 'priority-high', statusId: 'some-id-1' }]
      }).done;

      const callArgs = spyGetBoardCards.mock.calls[spyGetBoardCards.mock.calls.length - 1][0];
      expect(callArgs.columns).toEqual([expect.objectContaining({ id: 'some-id-1', skipCount: 0, maxItems: 25 })]);
      expect(callArgs.maxItemsPerColumn).toBe(25);

      const cellAction = dispatched.find(d => d.type === setSwimlaneCellData().type);
      expect(cellAction.payload.pagination).toEqual({ skipCount: 0, maxItems: 25 });
    });

    it('a failed row request keeps the previous counters instead of zeroing the whole row', async () => {
      spyGetBoardCards.mockRejectedValueOnce(new Error('row request failed'));

      const dispatched = await wrapRunSaga(
        kanban.sagaLoadSwimlaneCells,
        { swimlaneId: 'priority-high' },
        makeState(swimlaneData.swimlanes)
      );

      const cellActions = dispatched.filter(d => d.type === setSwimlaneCellData().type);
      expect(cellActions).toHaveLength(2);

      const byStatus = new Map(cellActions.map(a => [a.payload.statusId, a.payload]));
      // fixture counts for row priority-high: 2 and 1 — they must survive the error
      expect(byStatus.get('some-id-1').totalCount).toBe(2);
      expect(byStatus.get('some-id-1').records).toHaveLength(2);
      expect(byStatus.get('some-id-2').totalCount).toBe(1);
      cellActions.forEach(action => expect(action.payload.error).toBe('row request failed'));
    });
  });

  describe('sagaGetBoardData with swimlane grouping', () => {
    it('reloads the swimlanes instead of the flat columns when grouping is on', async () => {
      const dispatched = await wrapRunSaga(
        kanban.sagaGetBoardData,
        { stateId },
        {
          journals: {
            [stateId]: { journalConfig: { ...data.journalConfig, id: 'set-data-cards' }, journalSetting: data.journalSetting }
          },
          kanban: {
            [stateId]: {
              boardConfig: data.boardConfig,
              formProps: data.formProps,
              swimlaneGrouping: { attribute: 'priority', label: 'Priority' },
              swimlanes: []
            }
          }
        }
      );

      expect(dispatched.some(d => d.type === setSwimlaneValues().type)).toBeTruthy();
      expect(dispatched.some(d => d.type === setSwimlaneCellData().type)).toBeTruthy();
      // the flat path must not run in parallel — it would publish a second, inconsistent total
      expect(dispatched.some(d => d.type === setDataCards().type)).toBeFalsy();
      expect(dispatched.some(d => d.type === setTotalCount().type)).toBeFalsy();
      spyGetBoardCards.mock.calls.forEach(([arg]) => expect(arg.grouping).toBe('priority'));
    });
  });

  describe('swimlane counters stability', () => {
    it('"show more" with a short page does not shrink the cell counter', async () => {
      // 10 of 41 loaded, the server answers with a short page (4 records) — the badge must stay 41.
      const swimlanes = [
        {
          id: 'priority-high',
          label: 'High',
          cells: {
            'some-id-1': {
              records: Array.from({ length: 10 }, (_, i) => ({ id: `rec-${i}`, cardId: `rec-${i}` })),
              totalCount: 41,
              pagination: { skipCount: 0, maxItems: 10, page: 1 },
              isLoading: false
            }
          }
        }
      ];

      spyGetBoardCards.mockResolvedValueOnce([
        {
          columnId: 'some-id-1',
          records: Array.from({ length: 4 }, (_, i) => ({ id: `rec-new-${i}`, attributes: {} })),
          totalCount: 41
        }
      ]);

      const dispatched = await wrapRunSaga(
        kanban.sagaLoadMoreSwimlaneCell,
        { swimlaneId: 'priority-high', statusId: 'some-id-1' },
        {
          journals: { [stateId]: { journalConfig: { ...data.journalConfig, id: 'set-data-cards' }, journalSetting: data.journalSetting } },
          kanban: {
            [stateId]: {
              boardConfig: data.boardConfig,
              formProps: data.formProps,
              swimlaneGrouping: { attribute: 'priority', label: 'Priority' },
              swimlanes
            }
          }
        }
      );

      const cellDataAction = dispatched.find(d => d.type === setSwimlaneCellData().type);
      expect(cellDataAction.payload.records).toHaveLength(14);
      expect(cellDataAction.payload.totalCount).toBe(41);
      // the expanded window is remembered, so a later row reload restores all 14 cards
      expect(cellDataAction.payload.pagination).toEqual(expect.objectContaining({ skipCount: 0, maxItems: 14 }));
    });

    it('"show more" that returns only already-loaded records caps the counter (no infinite show-more)', async () => {
      // A concurrent reorder shifted the pages: the next page holds only known records, so
      // skipCount (= records.length) would never advance — the counter must cap at what is loaded.
      const swimlanes = [
        {
          id: 'priority-high',
          label: 'High',
          cells: {
            'some-id-1': {
              records: Array.from({ length: 10 }, (_, i) => ({ id: `rec-${i}`, cardId: `rec-${i}` })),
              totalCount: 41,
              pagination: { skipCount: 0, maxItems: 10 },
              isLoading: false
            }
          }
        }
      ];

      spyGetBoardCards.mockResolvedValueOnce([
        {
          columnId: 'some-id-1',
          records: Array.from({ length: 4 }, (_, i) => ({ id: `rec-${i}`, attributes: {} })),
          totalCount: 41
        }
      ]);

      const dispatched = await wrapRunSaga(
        kanban.sagaLoadMoreSwimlaneCell,
        { swimlaneId: 'priority-high', statusId: 'some-id-1' },
        {
          journals: { [stateId]: { journalConfig: { ...data.journalConfig, id: 'set-data-cards' }, journalSetting: data.journalSetting } },
          kanban: {
            [stateId]: {
              boardConfig: data.boardConfig,
              formProps: data.formProps,
              swimlaneGrouping: { attribute: 'priority', label: 'Priority' },
              swimlanes
            }
          }
        }
      );

      const cellDataAction = dispatched.find(d => d.type === setSwimlaneCellData().type);
      expect(cellDataAction.payload.records).toHaveLength(10);
      expect(cellDataAction.payload.totalCount).toBe(10);
    });

    it('DnD across cells moves the card without touching the counters', async () => {
      const state = {
        journals: { [stateId]: { journalConfig: data.journalConfig, journalSetting: data.journalSetting } },
        kanban: { [stateId]: { boardConfig: data.boardConfig, formProps: data.formProps, ...swimlaneData } }
      };

      const dispatched = await wrapRunSaga(
        kanban.sagaMoveSwimlaneCard,
        { cardIndex: 0, toIndex: 0, fromSwimlaneId: 'priority-high', fromStatusId: 'some-id-1', toStatusId: 'some-id-2' },
        state
      );

      const [fromOptimistic, toOptimistic] = dispatched.filter(d => d.type === setSwimlaneCellData().type);

      // records move at once...
      expect(fromOptimistic.payload.records).toHaveLength(1);
      expect(toOptimistic.payload.records).toHaveLength(2);
      // ...but the counters wait for the server reload — no "3 → 2 → 3" jump in the badge/total
      expect(fromOptimistic.payload.totalCount).toBe(2);
      expect(toOptimistic.payload.totalCount).toBe(1);
    });
  });

  describe('sagaLoadMoreSwimlaneCell', () => {
    const makeState = (kanbanOverrides = {}) => ({
      journals: { [stateId]: { journalConfig: { ...data.journalConfig, id: 'set-data-cards' }, journalSetting: data.journalSetting } },
      kanban: { [stateId]: { boardConfig: data.boardConfig, formProps: data.formProps, ...swimlaneData, ...kanbanOverrides } }
    });

    const makeSwimlanesWithRoom = () => [
      {
        id: 'priority-high',
        label: 'High',
        color: '#ff0000',
        isCollapsed: false,
        cells: {
          'some-id-1': {
            records: [
              { id: 'rec-1', cardId: 'rec-1' },
              { id: 'rec-2', cardId: 'rec-2' }
            ],
            totalCount: 5,
            pagination: { page: 0, maxItems: 10, skipCount: 0 },
            isLoading: false
          },
          'some-id-2': {
            records: [{ id: 'rec-3', cardId: 'rec-3' }],
            totalCount: 1,
            pagination: { page: 0, maxItems: 10, skipCount: 0 },
            isLoading: false
          }
        }
      }
    ];

    it('successful load more', async () => {
      const dispatched = await wrapRunSaga(
        kanban.sagaLoadMoreSwimlaneCell,
        { swimlaneId: 'priority-high', statusId: 'some-id-1' },
        makeState({ swimlanes: makeSwimlanesWithRoom() })
      );

      const loadingActions = dispatched.filter(d => d.type === setSwimlaneCellLoading().type);
      expect(loadingActions.length).toBeGreaterThanOrEqual(2);
      expect(loadingActions[0].payload.isLoading).toBe(true);
      expect(loadingActions[loadingActions.length - 1].payload.isLoading).toBe(false);

      const cellDataAction = dispatched.find(d => d.type === setSwimlaneCellData().type);
      expect(cellDataAction).toBeDefined();
    });

    it('no swimlaneGrouping returns early', async () => {
      const dispatched = await wrapRunSaga(
        kanban.sagaLoadMoreSwimlaneCell,
        { swimlaneId: 'priority-high', statusId: 'some-id-1' },
        makeState({ swimlaneGrouping: null })
      );

      expect(dispatched).toHaveLength(0);
    });

    it('cell not found returns early', async () => {
      const dispatched = await wrapRunSaga(
        kanban.sagaLoadMoreSwimlaneCell,
        { swimlaneId: 'priority-high', statusId: 'non-existent' },
        makeState()
      );

      expect(dispatched).toHaveLength(0);
    });

    it('returns early when all records already loaded', async () => {
      // Default swimlaneData fixture has records.length === totalCount === 2 for this cell.
      const dispatched = await wrapRunSaga(
        kanban.sagaLoadMoreSwimlaneCell,
        { swimlaneId: 'priority-high', statusId: 'some-id-1' },
        makeState()
      );

      expect(dispatched).toHaveLength(0);
      expect(spyGetBoardCards).not.toHaveBeenCalled();
    });

    it('caps totalCount to loaded records when server returns nothing new', async () => {
      // Simulate the COREDEV-82 scenario: server reports a totalCount larger than what it can
      // actually return — we must cap to records we have, otherwise "Show more" stays visible.
      spyGetBoardCards.mockResolvedValueOnce([{ columnId: 'some-id-1', records: [], totalCount: 99 }]);

      const swimlanes = makeSwimlanesWithRoom();
      const dispatched = await wrapRunSaga(
        kanban.sagaLoadMoreSwimlaneCell,
        { swimlaneId: 'priority-high', statusId: 'some-id-1' },
        makeState({ swimlanes })
      );

      const cellDataAction = dispatched.find(d => d.type === setSwimlaneCellData().type);
      expect(cellDataAction).toBeDefined();
      expect(cellDataAction.payload.records).toHaveLength(2);
      expect(cellDataAction.payload.totalCount).toBe(2);
    });

    it('dedups overlapping records so duplicates do not inflate the counter', async () => {
      // Server returns a record the client already has plus a new one.
      spyGetBoardCards.mockResolvedValueOnce([
        {
          columnId: 'some-id-1',
          records: [
            { id: 'rec-2', attributes: {} },
            { id: 'rec-new', attributes: {} }
          ],
          totalCount: 3
        }
      ]);

      const swimlanes = makeSwimlanesWithRoom();
      const dispatched = await wrapRunSaga(
        kanban.sagaLoadMoreSwimlaneCell,
        { swimlaneId: 'priority-high', statusId: 'some-id-1' },
        makeState({ swimlanes })
      );

      const cellDataAction = dispatched.find(d => d.type === setSwimlaneCellData().type);
      expect(cellDataAction).toBeDefined();
      const ids = cellDataAction.payload.records.map(r => r.id).sort();
      expect(ids).toEqual(['rec-1', 'rec-2', 'rec-new']);
    });

    it('forwards skipCount based on already loaded records to the data loader', async () => {
      // Regression: page.skipCount must equal the number of already-loaded records so that
      // "Show more" fetches the next page rather than refetching the first page.
      spyGetBoardCards.mockResolvedValueOnce([{ columnId: 'some-id-1', records: [{ id: 'rec-x', attributes: {} }], totalCount: 5 }]);

      const swimlanes = makeSwimlanesWithRoom();
      await wrapRunSaga(kanban.sagaLoadMoreSwimlaneCell, { swimlaneId: 'priority-high', statusId: 'some-id-1' }, makeState({ swimlanes }));

      const callArgs = spyGetBoardCards.mock.calls[spyGetBoardCards.mock.calls.length - 1][0];
      // ONE column requested with skipCount = already-loaded count (2).
      expect(callArgs.columns).toEqual([expect.objectContaining({ id: 'some-id-1', skipCount: 2, maxItems: DEFAULT_PAGINATION.maxItems })]);
    });
  });

  // COREDEV-288: "show only linked records" was lost for kanban — a reverse association never
  // produced a predicate at all (all records were shown), and even the direct one was dropped by
  // every repeated load (next page / search / filter / preset / reload).
  describe('only linked records filter', () => {
    const recordRef = 'emodel/request@request-1';
    const linkedAttr = 'request';
    const reverseFilter = { t: 'or', val: [{ t: 'contains', att: linkedAttr, val: recordRef }] };

    // The shared filter is either the single predicate or an `and` of all shared parts.
    const filterParts = filter => (get(filter, 't') === 'and' ? get(filter, 'v') || [] : [filter].filter(Boolean));
    const lastFilterParts = () => filterParts(get(spyGetBoardCards.mock.calls, [spyGetBoardCards.mock.calls.length - 1, 0, 'filter']));

    // earlier suites leave their own Records.get implementation behind (clearAllMocks keeps it)
    beforeEach(() => spyRecordsGet.mockImplementation(recordsGet));

    const journalsState = (extra = {}) => ({
      journalConfig: data.journalConfig,
      journalSetting: {
        ...data.journalSetting,
        columns: [{ attribute: 'name', type: 'text', searchable: true, default: true, visible: true }]
      },
      recordRef,
      ...extra
    });

    const kanbanState = (extra = {}) => ({
      boardConfig: data.boardConfig,
      formProps: data.formProps,
      pagination: DEFAULT_PAGINATION,
      ...extra
    });

    it('reverse association > board-cards filter gets OR[CONTAINS(attr, recordRef)]', async () => {
      const dispatched = await wrapRunSaga(
        kanban.sagaGetBoardData,
        { onlyLinked: true, attrsToLoad: [{ value: linkedAttr }] },
        { journals: { [stateId]: journalsState() }, kanban: { [stateId]: {} } }
      );

      expect(lastFilterParts()).toContainEqual(reverseFilter);

      // and it is kept in the store so repeated loads stay filtered
      const relatedAction = dispatched.find(d => d.type === setRelatedFilter().type);
      expect(get(relatedAction, 'payload.relatedFilter')).toEqual(reverseFilter);
      expect(console.error).not.toHaveBeenCalled();
    });

    it('direct association > refs handed over by the widget stay an id EQ predicate', async () => {
      await wrapRunSaga(
        kanban.sagaGetBoardData,
        { onlyLinked: true, attrsToLoad: [{ value: linkedAttr }], recordRefs: ['cand@1', 'cand@2'] },
        { journals: { [stateId]: journalsState() }, kanban: { [stateId]: {} } }
      );

      const parts = lastFilterParts();
      expect(parts).toContainEqual({ t: 'eq', att: 'id', val: ['cand@1', 'cand@2'] });
      expect(parts.find(p => get(p, 't') === 'or')).toBeUndefined();
    });

    it('direct association > refs loaded from the record win over the reverse predicate', async () => {
      const spyLinkedRefs = jest.spyOn(api.journals, 'fetchLinkedRefs').mockResolvedValue(['cand@7']);

      await wrapRunSaga(
        kanban.sagaGetBoardData,
        { onlyLinked: true, attrsToLoad: [{ value: linkedAttr }] },
        { journals: { [stateId]: journalsState() }, kanban: { [stateId]: {} } }
      );

      expect(spyLinkedRefs).toHaveBeenCalledWith(recordRef, [{ value: linkedAttr }]);
      const parts = lastFilterParts();
      expect(parts).toContainEqual({ t: 'eq', att: 'id', val: ['cand@7'] });
      expect(parts.find(p => get(p, 't') === 'or')).toBeUndefined();

      spyLinkedRefs.mockRestore();
    });

    it('journal dashlet config > kanban tab reads onlyLinked from the dashlet config', async () => {
      // KanbanView dispatches getBoardData without any related-records payload: the settings must be
      // taken from the journal dashlet config instead.
      await wrapRunSaga(
        kanban.sagaGetBoardData,
        {},
        {
          journals: {
            [stateId]: journalsState({
              config: {
                [JOURNAL_DASHLET_CONFIG_VERSION]: {
                  journalId: 'journalId',
                  onlyLinkedJournals: { journalId: true },
                  attrsToLoad: { journalId: [{ value: linkedAttr }] }
                }
              }
            })
          },
          kanban: { [stateId]: {} }
        }
      );

      expect(lastFilterParts()).toContainEqual(reverseFilter);
    });

    it('onlyLinked is off > no related predicate', async () => {
      await wrapRunSaga(
        kanban.sagaGetBoardData,
        { onlyLinked: false, attrsToLoad: [{ value: linkedAttr }] },
        { journals: { [stateId]: journalsState() }, kanban: { [stateId]: {} } }
      );

      expect(lastFilterParts().find(p => get(p, 't') === 'or')).toBeUndefined();
    });

    it('survives the next page load', async () => {
      await wrapRunSaga(
        kanban.sagaGetNextPage,
        {},
        {
          journals: { [stateId]: journalsState() },
          kanban: { [stateId]: kanbanState({ relatedFilter: reverseFilter, totalCount: 100 }) }
        }
      );

      expect(lastFilterParts()).toContainEqual(reverseFilter);
    });

    it('survives a search + reload', async () => {
      window.location = { search: '?search=abc' };

      await wrapRunSaga(
        kanban.sagaReloadBoardData,
        {},
        {
          journals: { [stateId]: journalsState() },
          kanban: { [stateId]: kanbanState({ relatedFilter: reverseFilter }) }
        }
      );

      const parts = lastFilterParts();
      expect(parts).toContainEqual(reverseFilter);
      // the search itself is still applied — related filter and search are ANDed, not replaced
      expect(JSON.stringify(parts)).toContain('abc');
    });

    it('survives applying a filter/preset', async () => {
      await wrapRunSaga(
        kanban.sagaApplyFilter,
        { settings: { predicate: { t: 'eq', att: 'name', val: 'x' } } },
        {
          journals: { [stateId]: journalsState() },
          kanban: { [stateId]: kanbanState({ relatedFilter: reverseFilter }) }
        }
      );

      expect(lastFilterParts()).toContainEqual(reverseFilter);
    });

    it('swimlane cells and swimlane values are filtered too', async () => {
      const spyDistinct = jest.spyOn(api.kanban, 'getDistinctValues');

      await wrapRunSaga(
        kanban.sagaLoadSwimlaneValues,
        {},
        {
          journals: { [stateId]: journalsState() },
          kanban: { [stateId]: kanbanState({ ...swimlaneData, relatedFilter: reverseFilter }) }
        }
      );

      // swimlane rows are built from the same record set...
      expect(get(spyDistinct.mock.calls, '[0][0].predicates')).toContainEqual(reverseFilter);
      // ...and so are the cards inside every row
      expect(lastFilterParts()).toContainEqual(reverseFilter);

      spyDistinct.mockRestore();
    });

    it('a settings-less reload keeps the stored filter of the SAME journal', async () => {
      const dispatched = await wrapRunSaga(
        kanban.sagaGetBoardData,
        {},
        {
          journals: { [stateId]: journalsState() },
          kanban: { [stateId]: { relatedFilter: reverseFilter, relatedFilterJournalId: 'journalId' } }
        }
      );

      expect(lastFilterParts()).toContainEqual(reverseFilter);
      const relatedAction = dispatched.find(d => d.type === setRelatedFilter().type);
      expect(get(relatedAction, 'payload.relatedFilter')).toEqual(reverseFilter);
    });

    it('another journal of the dashlet does not inherit the stored filter', async () => {
      // multi-journal dashlet: the user switches to a journal that has no only-linked entry at all —
      // the previous journal's OR[CONTAINS(...)] must not stick to it
      const dispatched = await wrapRunSaga(
        kanban.sagaGetBoardData,
        {},
        {
          journals: { [stateId]: journalsState() },
          kanban: { [stateId]: { relatedFilter: reverseFilter, relatedFilterJournalId: 'anotherJournal' } }
        }
      );

      expect(lastFilterParts().find(p => get(p, 't') === 'or')).toBeUndefined();
      const relatedAction = dispatched.find(d => d.type === setRelatedFilter().type);
      expect(get(relatedAction, 'payload.relatedFilter')).toBeNull();
    });

    it('survives the column reload after a card move', async () => {
      const dataCards = [
        { status: 'some-id-1', records: [{ id: '1', cardId: '1', attributes: {} }], totalCount: 1 },
        { status: 'some-id-2', records: [], totalCount: 0 }
      ];

      await wrapRunSaga(
        kanban.sagaMoveCard,
        { cardIndex: 0, toIndex: 0, fromColumnRef: 'some-id-1', toColumnRef: 'some-id-2' },
        {
          journals: { [stateId]: journalsState() },
          kanban: { [stateId]: kanbanState({ dataCards, relatedFilter: reverseFilter }) }
        }
      );

      expect(lastFilterParts()).toContainEqual(reverseFilter);
    });

    it('survives the silent swimlane cell reload after a card edit', async () => {
      const dispatched = [];
      await runSaga(
        {
          dispatch: action => dispatched.push(action),
          getState: () => ({
            journals: { [stateId]: journalsState() },
            kanban: { [stateId]: kanbanState({ ...swimlaneData, relatedFilter: reverseFilter }) }
          })
        },
        kanban.reloadSwimlaneCells,
        {
          api,
          stateId,
          boardConfig: data.boardConfig,
          swimlaneGrouping: swimlaneData.swimlaneGrouping,
          cells: [{ swimlaneId: 'priority-high', statusId: 'some-id-1' }]
        }
      ).done;

      expect(lastFilterParts()).toContainEqual(reverseFilter);
    });

    it('survives "show more" on a swimlane cell', async () => {
      // the cell needs room to grow, otherwise the saga bails out before any request
      const swimlanes = [
        {
          ...swimlaneData.swimlanes[0],
          cells: {
            ...swimlaneData.swimlanes[0].cells,
            'some-id-1': { ...swimlaneData.swimlanes[0].cells['some-id-1'], totalCount: 5 }
          }
        }
      ];

      await wrapRunSaga(
        kanban.sagaLoadMoreSwimlaneCell,
        { swimlaneId: 'priority-high', statusId: 'some-id-1' },
        {
          journals: { [stateId]: journalsState() },
          kanban: { [stateId]: kanbanState({ ...swimlaneData, swimlanes, relatedFilter: reverseFilter }) }
        }
      );

      expect(lastFilterParts()).toContainEqual(reverseFilter);
    });
  });
});
