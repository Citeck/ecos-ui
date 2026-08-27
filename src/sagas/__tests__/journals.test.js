import { runSaga } from 'redux-saga';

import { setForceUpdate } from '../../actions/journals';
import { reloadBoardData } from '../../actions/kanban';
import { GROUPED_QUERY_MAX_ITEMS, JOURNAL_VIEW_MODE } from '@/components/journals/Journals/constants';
import JournalsService from '@/components/journals/Journals/service';
import { wrapArgs } from '../../helpers/redux';
import JournalApi from '../__mocks__/journalApi';
import KanbanApi from '../__mocks__/kanbanApi';
import * as journals from '../journals';

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

describe('getGridData > page size of the records query', () => {
  const pagination = { skipCount: 0, maxItems: 10, page: 1 };
  const columns = [{ attribute: 'priority', dataField: 'priority', type: 'TEXT' }];

  function journalsState(extra = {}) {
    return {
      journals: {
        [stateId]: {
          recordRef: '',
          journalConfig: { id: 'test-journal', typeRef: 'emodel/type@test', columns },
          journalSetting: {},
          grid: { columns },
          grouping: { groupBy: [], columns: [] },
          ...extra
        }
      }
    };
  }

  async function runGetGridData(params, state) {
    await runSaga(
      {
        dispatch: () => {},
        getState: () => state
      },
      journals.getGridData,
      api,
      params,
      stateId
    ).done;
  }

  let getJournalData;

  beforeEach(() => {
    getJournalData = jest.spyOn(JournalsService, 'getJournalData').mockResolvedValue({ records: [], totalCount: 0 });
    jest.spyOn(JournalsService, 'getRecordActions').mockResolvedValue({});
    jest.spyOn(JournalsService, 'resolveColumns').mockResolvedValue(columns);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('a grouped query is capped at GROUPED_QUERY_MAX_ITEMS instead of going out without a page size', async () => {
    const grouping = { groupBy: ['priority'], columns };

    await runGetGridData({ columns, pagination, groupBy: ['priority'], grouping, predicates: [] }, journalsState({ grouping }));

    expect(getJournalData).toHaveBeenCalledTimes(1);
    const settings = getJournalData.mock.calls[0][1];
    expect(settings.groupBy).toEqual(['priority']);
    expect(settings.page).toEqual({ skipCount: 0, page: 1, maxItems: GROUPED_QUERY_MAX_ITEMS });
    expect(GROUPED_QUERY_MAX_ITEMS).toBe(100);
  });

  it('a plain query keeps the pagination the grid asked for', async () => {
    await runGetGridData({ columns, pagination, groupBy: [], predicates: [] }, journalsState());

    expect(getJournalData).toHaveBeenCalledTimes(1);
    expect(getJournalData.mock.calls[0][1].page).toEqual(pagination);
  });
});
