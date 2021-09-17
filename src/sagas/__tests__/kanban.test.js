import { runSaga } from 'redux-saga';
import { NotificationManager } from 'react-notifications';

import { setBoardConfig, setBoardList, setFormProps, setIsEnabled } from '../../actions/kanban';
import EcosFormUtils from '../../components/EcosForm/EcosFormUtils';
import { sagaGetBoardConfig, sagaGetBoardData } from '../kanban';
import * as kanban from '../kanban';
import * as journals from '../journals';
import * as journalSelectors from '../../selectors/journals';
import KanbanApi from '../__mocks__/kanbanApi';
import data from '../__mocks__/kanbanData';
import JournalsService from '../../components/Journals/service/journalsService';
import JournalApi from '../__mocks__/journalApi';
import { initJournalSettingData, setJournalConfig, setJournalSetting } from '../../actions/journals';

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

const spyGetFormById = jest
  .spyOn(EcosFormUtils, 'getFormById')
  .mockImplementation((formId, props) => (formId ? (formId === 'no-def' ? {} : data.formConfig) : null));
const spyGetFormInputs = jest.spyOn(EcosFormUtils, 'getFormInputs').mockImplementation(() => data.formFields);
const spyError = jest.spyOn(NotificationManager, 'error').mockResolvedValue(null);
const spyGetJournalConfig = jest.spyOn(JournalsService, 'getJournalConfig').mockResolvedValue(data.journalConfig);
const spyGetJournalData = jest.spyOn(JournalsService, 'getJournalData').mockResolvedValue(data.journalData);

async function wrapRunSaga(sagaFun, payload, state) {
  const dispatched = [];

  await runSaga(
    {
      dispatch: action => dispatched.push(action),
      getState: () => state
    },
    sagaFun,
    { api, logger },
    { payload }
  ).done;

  return dispatched;
}

describe('kanban sagas tests', () => {
  it('sagaGetBoardList > there are _boards', async () => {
    const dispatched = await wrapRunSaga(kanban.sagaGetBoardList, { journalId, stateId });
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
    const dispatched = await wrapRunSaga(sagaGetBoardConfig, { boardId, stateId });
    const [first] = dispatched;

    expect(dispatched.length).toEqual(1);
    expect(first.type).toEqual(setBoardConfig().type);
    expect(first.payload.boardConfig).toEqual(data.boardConfig);
  });

  it('sagaFormProps > there is _form', async () => {
    const dispatched = await wrapRunSaga(kanban.sagaFormProps, { formId, stateId });
    const [first] = dispatched;

    expect(spyGetFormById).toHaveBeenCalledTimes(1);
    expect(spyGetFormInputs).toHaveBeenCalledTimes(1);
    expect(spyError).not.toHaveBeenCalled();

    expect(dispatched.length).toEqual(1);
    expect(first.type).toEqual(setFormProps().type);
    expect(first.payload.formProps).toEqual(data.formProps);
  });

  it('sagaFormProps > there is _no form', async () => {
    const dispatched = await wrapRunSaga(kanban.sagaFormProps, { stateId });
    const [first] = dispatched;

    expect(spyGetFormById).not.toHaveBeenCalled();
    expect(spyGetFormInputs).not.toHaveBeenCalled();
    expect(spyError).toHaveBeenCalledTimes(1);

    expect(dispatched.length).toEqual(1);
    expect(first.type).toEqual(setFormProps().type);
    expect(first.payload.formProps).toEqual({});
  });

  it('sagaFormProps > there is _no form _definition', async () => {
    const dispatched = await wrapRunSaga(kanban.sagaFormProps, { formId: 'no-def', stateId });
    const [first] = dispatched;

    expect(spyGetFormById).toHaveBeenCalledTimes(1);
    expect(spyGetFormInputs).not.toHaveBeenCalled();
    expect(spyError).toHaveBeenCalledTimes(1);

    expect(dispatched.length).toEqual(1);
    expect(first.type).toEqual(setFormProps().type);
    expect(first.payload.formProps).toEqual({});
  });

  it('sagaGetBoardData > there is _journal config', async () => {
    const dispatched = await wrapRunSaga(
      sagaGetBoardData,
      { stateId },
      {
        journals: {
          [stateId]: {
            journalConfig: {},
            journalSetting: {}
          }
        }
      }
    );
    console.log(dispatched);
    const [a, b, c, d, e] = dispatched;

    expect(dispatched.length).toEqual(5);
    expect(spyGetJournalConfig).toHaveBeenCalledTimes(1);
    expect(a.type).toEqual(setBoardConfig().type);
    expect(b.type).toEqual(setFormProps().type);
    expect(c.type).toEqual(setJournalConfig().type);
    expect(d.type).toEqual(setJournalSetting().type);
    expect(e.type).toEqual(initJournalSettingData().type);
  });

  // it('sagaGetBoardData > there is _no journal config', async () => {

  // });
});
