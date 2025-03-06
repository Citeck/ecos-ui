import { runSaga } from 'redux-saga';

import { reloadBoardData } from '../../actions/kanban';
import { setForceUpdate } from '../../actions/journals';
import { JOURNAL_VIEW_MODE } from '../../components/Journals/constants';
import KanbanApi from '../__mocks__/kanbanApi';
import JournalApi from '../__mocks__/journalApi';
import * as journals from '../journals';
import { wrapArgs } from '../../helpers/redux';

const stateId = 'stateId',
  boardId = 'boardId',
  templateId = 'templateId';

const api = {
  kanban: new KanbanApi(),
  journals: new JournalApi(),
};

console.error = jest.fn();

beforeEach(() => {
  delete window.location;
  window.location = {};
});

afterEach(() => {
  jest.clearAllMocks();
});

async function wrapRunSaga(sagaFun, payload = {}, state = {}) {
  const dispatched = [];
  const w = wrapArgs(stateId);

  await runSaga(
    {
      dispatch: (action) => dispatched.push(action),
      getState: () => state,
    },
    sagaFun,
    { api, w },
    { payload: { stateId, boardId, templateId, ...payload } },
  ).done;

  return dispatched;
}

describe('journals sagas tests', () => {
  it('sagaToggleViewMode > viewMode is not kanban', async () => {
    const dispatched = await wrapRunSaga(
      journals.sagaToggleViewMode,
      {},
      {
        journals: {
          [stateId]: {
            forceUpdate: true,
            viewMode: JOURNAL_VIEW_MODE.TABLE,
          },
        },
        kanban: {
          [stateId]: {
            isFirstLoading: false,
          },
        },
      },
    );

    expect(console.error).not.toHaveBeenCalled();
    expect(dispatched).toHaveLength(0);
  });

  it('sagaToggleViewMode > all conditionals are resolved', async () => {
    const dispatched = await wrapRunSaga(
      journals.sagaToggleViewMode,
      { stateId },
      {
        payload: {
          stateId,
        },
        journals: {
          [stateId]: {
            forceUpdate: true,
            viewMode: JOURNAL_VIEW_MODE.KANBAN,
          },
        },
        kanban: {
          [stateId]: {
            isFirstLoading: false,
          },
        },
      },
    );

    const [first, second] = dispatched;

    expect(first.type).toEqual(reloadBoardData().type);
    expect(second.type).toEqual(setForceUpdate().type);

    expect(second.payload._args).toEqual(false);

    expect(console.error).not.toHaveBeenCalled();
    expect(dispatched).toHaveLength(2);
  });
});
