import get from 'lodash/get';
import first from 'lodash/first';
import last from 'lodash/last';
import { runSaga } from 'redux-saga';
import { NotificationManager } from 'react-notifications';

import {
  setBoardConfig,
  setBoardList,
  setDataCards,
  setFormProps,
  setIsEnabled,
  setIsFiltered,
  setLoading,
  setLoadingColumns,
  setPagination,
  setResolvedActions,
  setTotalCount
} from '../../actions/kanban';
import { initJournalSettingData, setJournalConfig, setJournalSetting, setPredicate } from '../../actions/journals';
import EcosFormUtils from '../../components/EcosForm/EcosFormUtils';
import JournalsService from '../../components/Journals/service/journalsService';
import { DEFAULT_PAGINATION } from '../../components/Journals/constants';
import RecordActions from '../../components/Records/actions/recordActions';
import PageService from '../../services/PageService';
import KanbanApi from '../__mocks__/kanbanApi';
import data from '../__mocks__/kanbanData';
import JournalApi from '../__mocks__/journalApi';
import * as kanban from '../kanban';
import { sagaReloadBoardData } from '../kanban';

const journalId = 'journalId',
  stateId = 'stateId',
  boardId = 'boardId',
  formId = 'formId';

const api = {
  kanban: new KanbanApi(),
  journals: new JournalApi()
};

const logger = { error: jest.fn() };

afterEach(() => {
  jest.clearAllMocks();
});

const spyError = jest.spyOn(NotificationManager, 'error').mockResolvedValue(null);
const spyGetFormById = jest
  .spyOn(EcosFormUtils, 'getFormById')
  .mockImplementation(formId => (formId ? (formId === 'no-def' ? {} : data.formConfig) : null));
const spyGetFormInputs = jest.spyOn(EcosFormUtils, 'getFormInputs').mockReturnValue(data.formFields);
const spyGetJournalConfig = jest.spyOn(JournalsService, 'getJournalConfig').mockResolvedValue(data.journalConfig);
const spyGetJournalData = jest
  .spyOn(JournalsService, 'getJournalData')
  .mockImplementation(d => (d.id === 'set-data-cards' ? data.journalData : {}));
const spyGetRecordActions = jest.spyOn(JournalsService, 'getRecordActions').mockResolvedValue(data.journalActions);
const spyChangeUrlLink = jest.spyOn(PageService, 'changeUrlLink').mockResolvedValue(data.journalActions);

async function wrapRunSaga(sagaFun, payload = {}, state = {}) {
  const dispatched = [];

  await runSaga(
    {
      dispatch: action => dispatched.push(action),
      getState: () => state
    },
    sagaFun,
    { api, logger },
    { payload: { stateId, boardId, ...payload } }
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

    expect(logger.error).not.toHaveBeenCalled();

    expect(dispatched).toHaveLength(2);
  });

  it('sagaGetBoardList > there are _no boards', async () => {
    const dispatched = await wrapRunSaga(kanban.sagaGetBoardList);
    const [first] = dispatched;

    expect(first.type).toEqual(setIsEnabled().type);
    expect(first.payload.isEnabled).toBeFalsy();

    expect(logger.error).not.toHaveBeenCalled();

    expect(dispatched).toHaveLength(1);
  });

  it('sagaGetBoardConfig', async () => {
    const dispatched = await wrapRunSaga(kanban.sagaGetBoardConfig);
    const [first] = dispatched;

    expect(first.type).toEqual(setBoardConfig().type);
    expect(first.payload.boardConfig).toEqual(data.boardConfig);

    expect(logger.error).not.toHaveBeenCalled();

    expect(dispatched).toHaveLength(1);
  });

  it('sagaFormProps > there is _form', async () => {
    const dispatched = await wrapRunSaga(kanban.sagaFormProps, { formId });
    const [first] = dispatched;

    expect(first.type).toEqual(setFormProps().type);
    expect(first.payload.formProps).toEqual(data.formProps);

    expect(spyGetFormById).toHaveBeenCalledTimes(1);
    expect(spyGetFormInputs).toHaveBeenCalledTimes(1);
    expect(spyError).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();

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
    expect(logger.error).toHaveBeenCalled();

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
    expect(logger.error).toHaveBeenCalled();

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

    const [_boardConfig, _formProps, _journalConfig, _journalSetting, _initJournalSettingData] = dispatched;
    const _loading = last(dispatched);

    expect(_boardConfig.type).toEqual(setBoardConfig().type);
    const colsLen = get(_boardConfig, 'payload.boardConfig.columns.length');
    expect(_formProps.type).toEqual(setFormProps().type);
    expect(_journalConfig.type).toEqual(setJournalConfig().type);
    expect(_journalSetting.type).toEqual(setJournalSetting().type);
    expect(_initJournalSettingData.type).toEqual(initJournalSettingData().type);
    expect(_loading.type).toEqual(setLoading().type);
    expect(_loading.payload.isLoading).toBeFalsy();

    expect(spyGetFormInputs).toHaveBeenCalledTimes(1);
    expect(spyGetJournalConfig).toHaveBeenCalledTimes(1);
    expect(spyGetJournalData).toHaveBeenCalledTimes(colsLen);
    expect(logger.error).not.toHaveBeenCalled();
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

    const [_boardConfig, _formProps] = dispatched;
    const _loading = last(dispatched);

    expect(_boardConfig.type).toEqual(setBoardConfig().type);
    const colsLen = get(_boardConfig, 'payload.boardConfig.columns.length');
    expect(_formProps.type).toEqual(setFormProps().type);
    expect(_loading.type).toEqual(setLoading().type);
    expect(_loading.payload.isLoading).toBeFalsy();

    expect(spyGetFormInputs).toHaveBeenCalledTimes(1);
    expect(spyGetJournalConfig).not.toHaveBeenCalled();
    expect(spyGetJournalData).toHaveBeenCalledTimes(colsLen);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('sagaGetBoardData > there is _no board config', async () => {
    const dispatched = await wrapRunSaga(kanban.sagaGetBoardData, { boardId: null });

    const [_boardConfig, _formProps] = dispatched;
    const _loading = last(dispatched);

    expect(_boardConfig.type).toEqual(setBoardConfig().type);
    expect(_boardConfig.payload.boardConfig).toEqual({});
    expect(_formProps.type).toEqual(setFormProps().type);
    expect(_loading.type).toEqual(setLoading().type);
    expect(_loading.payload.isLoading).toBeFalsy();

    expect(logger.error).toHaveBeenCalled();
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
    expect(logger.error).not.toHaveBeenCalled();
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
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('sagaGetActions > there is _no data', async () => {
    const dispatched = await wrapRunSaga(kanban.sagaGetActions);
    const [_resolvedActions] = dispatched;

    expect(_resolvedActions.type).toEqual(setResolvedActions().type);
    expect(_resolvedActions.payload.resolvedActions).toHaveLength(0);

    expect(spyGetRecordActions).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();

    expect(dispatched).toHaveLength(1);
  });

  it('sagaGetActions > there is _some data', async () => {
    const dispatched = await wrapRunSaga(kanban.sagaGetActions, { boardConfig: data.boardConfig, newRecordRefs: [1, 2] });
    const [_resolvedActions] = dispatched;
    const colsLen = data.boardConfig.columns.length;

    expect(_resolvedActions.type).toEqual(setResolvedActions().type);
    expect(_resolvedActions.payload.resolvedActions).toHaveLength(colsLen);

    expect(spyGetRecordActions).toHaveBeenCalledTimes(colsLen);
    expect(logger.error).not.toHaveBeenCalled();

    expect(dispatched).toHaveLength(1);
  });

  it('sagaSelectBoard > there is _boardId', async () => {
    delete window.location;
    window.location = { pathname: '/test' };

    const dispatched = await wrapRunSaga(kanban.sagaSelectBoard, { text: boardId });

    expect(spyChangeUrlLink).toHaveBeenCalledTimes(1);
    expect(spyChangeUrlLink).toHaveBeenCalledWith('/test?boardId=boardId', { updateUrl: true });
    expect(logger.error).not.toHaveBeenCalled();
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

    expect(logger.error).not.toHaveBeenCalled();
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
    expect(logger.error).toHaveBeenCalled();

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
    expect(_firstLoadingColumns.payload.isLoadingColumns).toEqual([0, 1]);
    expect(_dataCards.type).toEqual(setDataCards().type);
    expect(get(_dataCards, 'payload.dataCards')).toHaveLength(2);
    expect(get(_dataCards, 'payload.dataCards[0].records')).toHaveLength(1);
    expect(get(_dataCards, 'payload.dataCards[1].records')).toHaveLength(1);
    expect(get(_dataCards, 'payload.dataCards[0].records[0].id')).toEqual('2');
    expect(get(_dataCards, 'payload.dataCards[1].records[0].id')).toEqual('1');
    expect(_lastLoadingColumns.payload.isLoadingColumns).toEqual([]);

    expect(spyError).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();

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
    const [_predicate, _journalSetting, _pagination] = dispatched;
    const _loading = last(dispatched);

    expect(_predicate.type).toEqual(setPredicate().type);
    expect(_journalSetting.type).toEqual(setJournalSetting().type);
    expect(_pagination.type).toEqual(setPagination().type);
    expect(_pagination.payload.pagination.page).toEqual(DEFAULT_PAGINATION.page);
    expect(_loading.type).toEqual(setLoading().type);

    expect(logger.error).not.toHaveBeenCalled();
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
    const [_predicate, _journalSetting, _pagination] = dispatched;
    const _isFiltered = last(dispatched);

    expect(_predicate.type).toEqual(setPredicate().type);
    expect(_predicate.payload._args).toEqual({ b: 1 });
    expect(_journalSetting.type).toEqual(setJournalSetting().type);
    expect(_pagination.type).toEqual(setPagination().type);
    expect(_pagination.payload.pagination.page).toEqual(DEFAULT_PAGINATION.page);
    expect(_isFiltered.type).toEqual(setIsFiltered().type);
    expect(_isFiltered.payload.isFiltered).toEqual(false);

    expect(logger.error).not.toHaveBeenCalled();
  });

  it('sagaRunSearchCard > there is _no text & was no', async () => {
    delete window.location;
    window.location = { pathname: '/test' };

    const dispatched = await wrapRunSaga(kanban.sagaRunSearchCard);

    expect(spyChangeUrlLink).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();

    expect(dispatched).toHaveLength(0);
  });

  it('sagaRunSearchCard > there is _new text & was no', async () => {
    delete window.location;
    window.location = { pathname: '/test' };

    const dispatched = await wrapRunSaga(kanban.sagaRunSearchCard, { text: 'test' });

    expect(spyChangeUrlLink).toHaveBeenCalledTimes(1);
    expect(spyChangeUrlLink).toHaveBeenCalledWith('/test?search=test', { updateUrl: true });
    expect(logger.error).not.toHaveBeenCalled();

    expect(dispatched).toHaveLength(0);
  });

  it('sagaRunSearchCard > there is _same text & was', async () => {
    delete window.location;
    window.location = { pathname: '/test', search: '?search=test' };

    const dispatched = await wrapRunSaga(kanban.sagaRunSearchCard, { text: 'test' });

    expect(spyChangeUrlLink).not.toHaveBeenCalled();
    expect(dispatched).toHaveLength(0);
  });

  it('sagaRunSearchCard > there is _clean text & was', async () => {
    delete window.location;
    window.location = { pathname: '/test', search: '?search=test' };

    const dispatched = await wrapRunSaga(kanban.sagaRunSearchCard);

    expect(spyChangeUrlLink).toHaveBeenCalledTimes(1);
    expect(spyChangeUrlLink).toHaveBeenCalledWith('/test', { updateUrl: true });
    expect(logger.error).not.toHaveBeenCalled();

    expect(dispatched).toHaveLength(0);
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
    expect(logger.error).toHaveBeenCalled();
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

    expect(_firstLoading.type).toEqual(setLoading().type);
    expect(_firstLoading.payload.isLoading).toBeTruthy();
    expect(logger.error).not.toHaveBeenCalled();
    expect(_lastLoading.type).toEqual(setLoading().type);
    expect(_lastLoading.payload.isLoading).toBeFalsy();
  });
});
