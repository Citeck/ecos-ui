import { runSaga } from 'redux-saga';
import { NotificationManager } from 'react-notifications';

import { setBoardConfig, setBoardList, setFormProps, setIsEnabled } from '../../actions/kanban';
import EcosFormUtils from '../../components/EcosForm/EcosFormUtils';
import { sagaFormProps, sagaGetBoardConfig, sagaGetBoardList } from '../kanban';

const journalId = 'journalId',
  stateId = 'stateId',
  boardId = 'boardId',
  formId = 'formId';

const data = Object.freeze({
  boardList: [{ id: 'id1', name: 'name1' }, { id: 'id2', name: 'name2' }],
  boardConfig: {
    id: 'identifier',
    name: { ru: 'Русское имя', en: 'English name' },
    readOnly: true,
    typeRef: 'emodel/type@some-type',
    journalRef: 'uiserv/journal@some-journal',
    cardFormRef: 'uiserv/form@some-form',
    actions: ['uiserv/action@some-action'],
    columns: [
      {
        id: 'some-id',
        name: { ru: 'Русское имя', en: 'English name' }
      }
    ]
  },
  formConfig: {
    i18n: {},
    formDefinition: {
      components: [
        {
          label: {
            ru: 'id'
          },
          key: 'id',
          refreshOn: [],
          type: 'hidden',
          input: true
        }
      ]
    }
  },
  formFields: {}
});

const api = {
  kanban: {
    getBoardList: ({ journalId }) => (journalId ? data.boardList : null),
    getBoardConfig: () => data.boardConfig
  }
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

async function wrapRunSaga(sagaFun, payload) {
  const dispatched = [];

  await runSaga(
    {
      dispatch: action => dispatched.push(action)
    },
    sagaFun,
    { api, logger },
    { payload }
  ).done;

  return dispatched;
}

describe('kanban sagas tests', () => {
  it('sagaGetBoardList > there are _boards', async () => {
    const dispatched = await wrapRunSaga(sagaGetBoardList, { journalId, stateId });
    const [first, second] = dispatched;

    expect(dispatched.length).toEqual(2);
    expect(first.type).toEqual(setIsEnabled().type);
    expect(second.type).toEqual(setBoardList().type);
    expect(first.payload.isEnabled).toBeTruthy();
    expect(second.payload.boardList).toEqual(data.boardList);
  });

  it('sagaGetBoardList > there are _no boards', async () => {
    const dispatched = await wrapRunSaga(sagaGetBoardList, { stateId });
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
    const dispatched = await wrapRunSaga(sagaFormProps, { formId, stateId });
    const [first] = dispatched;

    expect(spyGetFormById).toHaveBeenCalledTimes(1);
    expect(spyGetFormInputs).toHaveBeenCalledTimes(1);
    expect(spyError).not.toHaveBeenCalled();

    expect(dispatched.length).toEqual(1);
    expect(first.type).toEqual(setFormProps().type);
    expect(first.payload.formProps).toEqual({ ...data.formConfig, formFields: data.formFields });
  });

  it('sagaFormProps > there is _no form', async () => {
    const dispatched = await wrapRunSaga(sagaFormProps, { stateId });
    const [first] = dispatched;

    expect(spyGetFormById).not.toHaveBeenCalled();
    expect(spyGetFormInputs).not.toHaveBeenCalled();
    expect(spyError).toHaveBeenCalledTimes(1);

    expect(dispatched.length).toEqual(1);
    expect(first.type).toEqual(setFormProps().type);
    expect(first.payload.formProps).toEqual({});
  });

  it('sagaFormProps > there is _no form _definition', async () => {
    const dispatched = await wrapRunSaga(sagaFormProps, { formId: 'no-def', stateId });
    const [first] = dispatched;

    expect(spyGetFormById).toHaveBeenCalledTimes(1);
    expect(spyGetFormInputs).not.toHaveBeenCalled();
    expect(spyError).toHaveBeenCalledTimes(1);

    expect(dispatched.length).toEqual(1);
    expect(first.type).toEqual(setFormProps().type);
    expect(first.payload.formProps).toEqual({});
  });
});
