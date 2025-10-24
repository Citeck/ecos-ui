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
  setResolvedActions,
  setTotalCount
} from '../../actions/kanban';
import EcosFormUtils from '../../components/EcosForm/EcosFormUtils';
import { DEFAULT_PAGINATION } from '../../components/Journals/constants';
import JournalsService from '../../components/Journals/service/journalsService';
import Records from '../../components/Records/Records';
import RecordActions from '../../components/Records/actions/recordActions';
import { KanbanUrlParams } from '../../constants';
import PageService from '../../services/PageService';
import JournalApi from '../__mocks__/journalApi';
import KanbanApi from '../__mocks__/kanbanApi';
import data from '../__mocks__/kanbanData';
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
    expect(spyGetJournalData).toHaveBeenCalledTimes(colsLen);
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

    const [_boardConfig, _originKanbanSettings, _formProps, _pagination] = dispatched;
    const _loading = last(dispatched);

    expect(_boardConfig.type).toEqual(setBoardConfig().type);
    const colsLen = get(_boardConfig, 'payload.boardConfig.columns.length');
    expect(_formProps.type).toEqual(setFormProps().type);
    expect(_originKanbanSettings.type).toEqual(setOriginKanbanSettings().type);
    expect(_pagination.type).toEqual(setPagination().type);
    expect(_pagination.payload.pagination).toEqual(DEFAULT_PAGINATION);
    expect(_loading.type).toEqual(setLoading().type);
    expect(_loading.payload.isLoading).toBeFalsy();

    expect(spyGetFormInputs).toHaveBeenCalledTimes(1);
    expect(spyGetJournalConfig).not.toHaveBeenCalled();
    expect(spyGetJournalData).toHaveBeenCalledTimes(colsLen);
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
    const dispatched = await wrapRunSaga(kanban.sagaGetData, { ...data, journalConfig: { ...data.journalConfig, id: 'set-data-cards' } });
    const [_dataCards, _totalCount] = dispatched;
    const colsLen = data.boardConfig.columns.length;

    expect(_dataCards.type).toEqual(setDataCards().type);
    expect(get(_dataCards, 'payload.dataCards')).toHaveLength(colsLen);
    expect(_totalCount.type).toEqual(setTotalCount().type);
    expect(_totalCount.payload.totalCount).toEqual(colsLen * data.journalData.totalCount);

    expect(spyGetJournalData).toHaveBeenCalledTimes(colsLen);
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

  it('sagaRunAction', async () => {
    const spyGetRecordActions = jest.spyOn(RecordActions, 'execForRecord').mockResolvedValue(true);
    const dispatched = await wrapRunSaga(kanban.sagaRunAction, { recordRef: '111', action: {} });

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
    const dataCards = [data.journalData];
    expect(dataCards).toHaveLength(1);
    expect(get(dataCards, '[0].records')).toHaveLength(2);

    const dispatched = await wrapRunSaga(
      kanban.sagaMoveCard,
      {
        cardIndex: 0,
        fromColumnRef: 'some-id-1',
        toColumnRef: 'some-id-2'
      },
      {
        kanban: {
          [stateId]: {
            dataCards,
            boardConfig: data.boardConfig
          }
        }
      }
    );
    const [_firstLoadingColumns, _dataCards, _lastLoadingColumns] = dispatched;

    expect(_firstLoadingColumns.type).toEqual(setLoadingColumns().type);
    expect(_firstLoadingColumns.payload.isLoadingColumns).toEqual(['some-id-1', 'some-id-2']);
    expect(_dataCards.type).toEqual(setDataCards().type);
    expect(get(_dataCards, 'payload.dataCards')).toHaveLength(2);
    expect(get(_dataCards, 'payload.dataCards[0].records')).toHaveLength(1);
    expect(get(_dataCards, 'payload.dataCards[1].records')).toHaveLength(1);
    expect(get(_dataCards, 'payload.dataCards[0].records[0].id')).toEqual('2');
    expect(get(_dataCards, 'payload.dataCards[1].records[0].id')).toEqual('1');
    expect(_lastLoadingColumns.payload.isLoadingColumns).toEqual([]);

    expect(spyError).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();

    expect(dispatched).toHaveLength(3);
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
});
