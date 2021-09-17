import get from 'lodash/get';
import { runSaga } from 'redux-saga';
import { NotificationManager } from 'react-notifications';

import {
  setBoardConfig,
  setBoardList,
  setDataCards,
  setFormProps,
  setIsEnabled,
  setLoading,
  setResolvedActions,
  setTotalCount
} from '../../actions/kanban';
import { initJournalSettingData, setJournalConfig, setJournalSetting } from '../../actions/journals';
import EcosFormUtils from '../../components/EcosForm/EcosFormUtils';
import JournalsService from '../../components/Journals/service/journalsService';
import KanbanApi from '../__mocks__/kanbanApi';
import data from '../__mocks__/kanbanData';
import JournalApi from '../__mocks__/journalApi';
import * as kanban from '../kanban';

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
const spyGetJournalData = jest.spyOn(JournalsService, 'getJournalData').mockImplementation(data => {
  if (data.id === 'set-data-cards') {
    return data.journalData;
  }

  return {};
});
const spyGetRecordActions = jest.spyOn(JournalsService, 'getRecordActions').mockResolvedValue(data.journalActions);

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

    expect(dispatched.length).toEqual(2);
    expect(first.type).toEqual(setIsEnabled().type);
    expect(second.type).toEqual(setBoardList().type);
    expect(first.payload.isEnabled).toBeTruthy();
    expect(second.payload.boardList).toEqual(data.boardList);
  });

  it('sagaGetBoardList > there are _no boards', async () => {
    const dispatched = await wrapRunSaga(kanban.sagaGetBoardList, { stateId });
    const [first] = dispatched;

    expect(dispatched.length).toEqual(1);
    expect(first.type).toEqual(setIsEnabled().type);
    expect(first.payload.isEnabled).toBeFalsy();
  });

  it('sagaGetBoardConfig', async () => {
    const dispatched = await wrapRunSaga(kanban.sagaGetBoardConfig, { boardId, stateId });
    const [first] = dispatched;

    expect(dispatched.length).toEqual(1);
    expect(first.type).toEqual(setBoardConfig().type);
    expect(first.payload.boardConfig).toEqual(data.boardConfig);
  });

  it('sagaFormProps > there is _form', async () => {
    const dispatched = await wrapRunSaga(kanban.sagaFormProps, { formId });
    const [first] = dispatched;

    expect(spyGetFormById).toHaveBeenCalledTimes(1);
    expect(spyGetFormInputs).toHaveBeenCalledTimes(1);
    expect(spyError).not.toHaveBeenCalled();

    expect(dispatched.length).toEqual(1);
    expect(first.type).toEqual(setFormProps().type);
    expect(first.payload.formProps).toEqual(data.formProps);
  });

  it('sagaFormProps > there is _no form', async () => {
    const dispatched = await wrapRunSaga(kanban.sagaFormProps);
    const [first] = dispatched;

    expect(spyGetFormById).not.toHaveBeenCalled();
    expect(spyGetFormInputs).not.toHaveBeenCalled();
    expect(spyError).toHaveBeenCalledTimes(1);

    expect(dispatched.length).toEqual(1);
    expect(first.type).toEqual(setFormProps().type);
    expect(first.payload.formProps).toEqual({});
  });

  it('sagaFormProps > there is _no form _definition', async () => {
    const dispatched = await wrapRunSaga(kanban.sagaFormProps, { formId: 'no-def' });
    const [first] = dispatched;

    expect(spyGetFormById).toHaveBeenCalledTimes(1);
    expect(spyGetFormInputs).not.toHaveBeenCalled();
    expect(spyError).toHaveBeenCalledTimes(1);

    expect(dispatched.length).toEqual(1);
    expect(first.type).toEqual(setFormProps().type);
    expect(first.payload.formProps).toEqual({});
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

    const [
      _boardConfig,
      _formProps,
      _journalConfig,
      _journalSetting,
      _initJournalSettingData,
      _resolvedActions,
      _dataCards,
      _totalCount,
      _loading
    ] = dispatched;

    expect(_boardConfig.type).toEqual(setBoardConfig().type);
    const colsLen = get(_boardConfig, 'payload.boardConfig.columns.length');
    expect(_formProps.type).toEqual(setFormProps().type);
    expect(_journalConfig.type).toEqual(setJournalConfig().type);
    expect(_journalSetting.type).toEqual(setJournalSetting().type);
    expect(_initJournalSettingData.type).toEqual(initJournalSettingData().type);
    expect(_resolvedActions.type).toEqual(setResolvedActions().type);
    expect(_resolvedActions.payload.resolvedActions.length).toEqual(colsLen);
    expect(_dataCards.type).toEqual(setDataCards().type);
    expect(get(_dataCards, 'payload.dataCards.length')).toEqual(colsLen);
    expect(get(_dataCards, 'payload.dataCards[0].records')).toEqual([]);
    expect(get(_dataCards, 'payload.dataCards[0].error')).toBeUndefined();
    expect(_totalCount.type).toEqual(setTotalCount().type);
    expect(_totalCount.payload.totalCount).toEqual(0);
    expect(_loading.type).toEqual(setLoading().type);
    expect(_loading.payload.isLoading).toBeFalsy();

    expect(spyGetFormInputs).toHaveBeenCalledTimes(1);
    expect(spyGetJournalConfig).toHaveBeenCalledTimes(1);
    expect(spyGetJournalData).toHaveBeenCalledTimes(colsLen);
    expect(spyGetRecordActions).toHaveBeenCalledTimes(colsLen);

    expect(dispatched.length).toEqual(9);
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

    const [_boardConfig, _formProps, _resolvedActions, _dataCards, _totalCount, _loading] = dispatched;

    expect(_boardConfig.type).toEqual(setBoardConfig().type);
    const colsLen = get(_boardConfig, 'payload.boardConfig.columns.length');
    expect(_formProps.type).toEqual(setFormProps().type);
    expect(_resolvedActions.type).toEqual(setResolvedActions().type);
    expect(_resolvedActions.payload.resolvedActions.length).toEqual(colsLen);
    expect(_dataCards.type).toEqual(setDataCards().type);
    expect(get(_dataCards, 'payload.dataCards.length')).toEqual(colsLen);
    expect(get(_dataCards, 'payload.dataCards[0].records')).toEqual([]);
    expect(get(_dataCards, 'payload.dataCards[0].error')).toBeUndefined();
    expect(_totalCount.type).toEqual(setTotalCount().type);
    expect(_totalCount.payload.totalCount).toEqual(0);
    expect(_loading.type).toEqual(setLoading().type);
    expect(_loading.payload.isLoading).toBeFalsy();

    expect(spyGetFormInputs).toHaveBeenCalledTimes(1);
    expect(spyGetJournalConfig).not.toHaveBeenCalled();
    expect(spyGetJournalData).toHaveBeenCalledTimes(colsLen);
    expect(spyGetRecordActions).toHaveBeenCalledTimes(colsLen);

    expect(dispatched.length).toEqual(6);
  });

  it('sagaGetBoardData > there is _board config', async () => {
    const dispatched = await wrapRunSaga(kanban.sagaGetBoardData, { boardId: null });

    const [_boardConfig, _formProps, _resolvedActions, _dataCards, _totalCount, _loading] = dispatched;

    expect(_boardConfig.type).toEqual(setBoardConfig().type);
    expect(_boardConfig.payload.boardConfig).toEqual({});
    expect(_formProps.type).toEqual(setFormProps().type);
    expect(_resolvedActions.type).toEqual(setResolvedActions().type);
    expect(_resolvedActions.payload.resolvedActions.length).toEqual(0);
    expect(_dataCards.type).toEqual(setDataCards().type);
    expect(get(_dataCards, 'payload.dataCards.length')).toEqual(0);
    expect(get(_dataCards, 'payload.dataCards[0].records')).toBeUndefined();
    expect(get(_dataCards, 'payload.dataCards[0].error')).toBeUndefined();
    expect(_totalCount.type).toEqual(setTotalCount().type);
    expect(_totalCount.payload.totalCount).toEqual(0);
    expect(_loading.type).toEqual(setLoading().type);
    expect(_loading.payload.isLoading).toBeFalsy();

    expect(spyGetFormInputs).not.toHaveBeenCalled();
    expect(spyGetJournalConfig).not.toHaveBeenCalled();
    expect(spyGetJournalData).not.toHaveBeenCalled();
    expect(spyGetRecordActions).not.toHaveBeenCalled();

    expect(dispatched.length).toEqual(6);
  });
});
