import { runSaga } from 'redux-saga';

import { setForceUpdate } from '../../actions/journals';
import { reloadBoardData } from '../../actions/kanban';
import { JOURNAL_VIEW_MODE } from '../../components/Journals/constants';
import { wrapArgs } from '../../helpers/redux';
import JournalApi from '../__mocks__/journalApi';
import KanbanApi from '../__mocks__/kanbanApi';
import * as journals from '../journals';
import { setGrid } from '../../actions/journals';
import { NotificationManager } from '@/services/notifications';

jest.mock('@/services/notifications', () => ({
  NotificationManager: {
    error: jest.fn(),
    success: jest.fn(),
    warning: jest.fn(),
    info: jest.fn()
  }
}));

const stateId = 'stateId',
  boardId = 'boardId',
  templateId = 'templateId';

const api = {
  kanban: new KanbanApi(),
  journals: new JournalApi()
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
      dispatch: action => dispatched.push(action),
      getState: () => state
    },
    sagaFun,
    { api, w },
    { payload: { stateId, boardId, templateId, ...payload } }
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
            viewMode: JOURNAL_VIEW_MODE.TABLE
          }
        },
        kanban: {
          [stateId]: {
            isFirstLoading: false
          }
        }
      }
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
          stateId
        },
        journals: {
          [stateId]: {
            forceUpdate: true,
            viewMode: JOURNAL_VIEW_MODE.KANBAN
          }
        },
        kanban: {
          [stateId]: {
            isFirstLoading: false
          }
        }
      }
    );

    const [first, second] = dispatched;

    expect(first.type).toEqual(reloadBoardData().type);
    expect(second.type).toEqual(setForceUpdate().type);

    expect(second.payload._args).toEqual(false);

    expect(console.error).not.toHaveBeenCalled();
    expect(dispatched).toHaveLength(2);
  });
});

describe('sagaSaveRecords: a failed inline save is visible (COREDEV-466)', () => {
  const rowId = 'workspace://SpacesStore/row-1';
  const column = { attribute: 'summary', dataField: 'summary', type: 'text', attSchema: 'summary' };
  const state = { journals: { [stateId]: { grid: { columns: [column], data: [{ id: rowId, summary: 'old' }], editingRules: {} } } } };

  const run = async journalsApi => {
    const dispatched = [];

    await runSaga(
      { dispatch: action => dispatched.push(action), getState: () => state },
      journals.sagaSaveRecords,
      { api: { journals: { checkRowEditRules: async () => false, ...journalsApi } }, stateId, w: wrapArgs(stateId) },
      { payload: { id: rowId, attributes: { summary: 'new' } } }
    ).done;

    return dispatched.filter(action => action.type === setGrid.toString()).map(action => action.payload._args.data[0]);
  };

  it('shows the server text and puts the old value back when the save fails', async () => {
    const text = 'Изменения строки не прошли внешнюю проверку: Нельзя изменить строку Е';
    const rows = await run({
      saveRecords: async () => {
        throw new Error(text);
      }
    });

    expect(NotificationManager.error).toHaveBeenCalledTimes(1);
    expect(NotificationManager.error.mock.calls[0][0]).toBe(text);
    expect(rows[0]).toEqual({ id: rowId, summary: 'new' }); // the optimistic put
    expect(rows[rows.length - 1]).toEqual({ id: rowId, summary: 'old', error: 'summary' }); // rolled back and marked
  });

  it('keeps the saved value when only the re-read after a successful save fails', async () => {
    const rows = await run({
      saveRecords: async () => ({}),
      getRecord: async () => {
        throw new Error('re-read failed');
      }
    });

    expect(NotificationManager.error).toHaveBeenCalledTimes(1);
    expect(rows[rows.length - 1]).toEqual({ id: rowId, summary: 'new' });
  });
});
