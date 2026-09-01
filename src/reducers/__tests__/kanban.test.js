import reducer, { initialState } from '../kanban';
import {
  applyFilter,
  getBoardConfig,
  getBoardData,
  reloadBoardData,
  resetFilter,
  setRefreshing,
  setBoardConfig,
  setBoardList,
  setDataCards,
  setPagination,
  setSwimlaneGrouping,
  setSwimlaneValues,
  setSwimlaneCellData,
  toggleSwimlaneCollapse,
  setSwimlaneCellLoading
} from '../../actions/kanban';

const stateId = 'stateId';
const _initialState = Object.freeze({ [stateId]: initialState });

describe('kanban reducer tests', () => {
  it('setBoardList', () => {
    const newState = reducer(undefined, setBoardList({ boardList: [{ a: 1 }], stateId }));
    const ownState = newState[stateId];

    expect(ownState.boardList).toEqual([{ a: 1 }]);
  });

  it('getBoardConfig', () => {
    const newState = reducer(undefined, getBoardConfig({ stateId, boardConfig: {} }));
    const ownState = newState[stateId];

    expect(ownState.boardConfig).toBeUndefined();
    expect(ownState.isFirstLoading).toBeTruthy();
    expect(ownState.isLoading).toBeTruthy();
  });

  it('getBoardData drops the swimlanes of the previous board', () => {
    const swimlanes = [{ id: 'sl-1', cells: { 'col-1': { records: [{ id: 'r1' }], totalCount: 7 } } }];
    const prevState = { [stateId]: { ...initialState, swimlanes, swimlaneGrouping: { attribute: 'priority' } } };

    const newState = reducer(prevState, getBoardData({ stateId, boardId: 'other-board' }));
    const ownState = newState[stateId];

    expect(ownState.swimlanes).toEqual([]);
    expect(ownState.dataCards).toEqual([]);
    // grouping itself must survive the board switch — only its data is stale
    expect(ownState.swimlaneGrouping).toEqual({ attribute: 'priority' });
    expect(ownState.isLoading).toBeTruthy();
  });

  it('setBoardConfig', () => {
    const newState = reducer(undefined, setBoardConfig({ stateId, boardConfig: { b: 1 } }));
    const ownState = newState[stateId];

    expect(ownState.boardConfig).toEqual({ b: 1 });
  });

  it('setDataCards', () => {
    const newState = reducer(undefined, setDataCards({ stateId, dataCards: [{ c: 1 }] }));
    const ownState = newState[stateId];

    expect(ownState.dataCards).toEqual([{ c: 1 }]);
    expect(ownState.isFirstLoading).toBeFalsy();
  });

  it('applyFilter', () => {
    const newState = reducer(undefined, applyFilter({ stateId, dataCards: [{ c: 1 }] }));
    const ownState = newState[stateId];

    expect(ownState.dataCards).toEqual([]);
    expect(ownState.isLoading).toBeTruthy();
    expect(ownState.isFiltered).toBeTruthy();
  });

  it('applyFilter > starts the board over, so the loaded scroll position is forgotten (COREDEV-426)', () => {
    const prevState = { [stateId]: { ...initialState, isFirstLoading: false, swimlanes: [{ id: 'sl-1', cells: {} }] } };
    const ownState = reducer(prevState, applyFilter({ stateId, settings: { predicate: {} } }))[stateId];

    expect(ownState.isFirstLoading).toBeTruthy();
  });

  it('resetFilter', () => {
    const newState = reducer(undefined, resetFilter({ stateId, dataCards: [{ c: 1 }] }));
    const ownState = newState[stateId];

    expect(ownState.dataCards).toEqual([]);
    expect(ownState.isLoading).toBeTruthy();
  });

  it('resetFilter > starts the board over, so the loaded scroll position is forgotten (COREDEV-426)', () => {
    const prevState = { [stateId]: { ...initialState, isFirstLoading: false, swimlanes: [{ id: 'sl-1', cells: {} }] } };
    const ownState = reducer(prevState, resetFilter({ stateId }))[stateId];

    expect(ownState.isFirstLoading).toBeTruthy();
  });

  it('reloadBoardData', () => {
    const newState = reducer(undefined, resetFilter({ stateId, dataCards: [{ c: 1 }] }));
    const ownState = newState[stateId];

    expect(ownState.dataCards).toEqual([]);
    expect(ownState.isFirstLoading).toBeTruthy();
  });

  it('reloadBoardData > drops the loaded cards and clears isRefreshing', () => {
    const loaded = [{ status: 'backlog', records: [{ id: 'r1' }], totalCount: 1 }];
    const prevState = { [stateId]: { ...initialState, dataCards: loaded, isFirstLoading: false, isRefreshing: true } };
    const ownState = reducer(prevState, reloadBoardData({ stateId }))[stateId];

    expect(ownState.dataCards).toEqual([]);
    expect(ownState.isFirstLoading).toBeTruthy();
    expect(ownState.isRefreshing).toBeFalsy();
  });

  it('reloadBoardData silent > keeps the loaded cards and pagination; the saga owns isRefreshing', () => {
    const loaded = [{ status: 'backlog', records: [{ id: 'r1' }], totalCount: 1 }];
    const prevState = {
      [stateId]: { ...initialState, dataCards: loaded, isFirstLoading: false, pagination: { skipCount: 20, maxItems: 10, page: 3 } }
    };
    const ownState = reducer(prevState, reloadBoardData({ stateId, silent: true }))[stateId];

    expect(ownState.dataCards).toEqual(loaded);
    expect(ownState.isFirstLoading).toBeFalsy();
    expect(ownState.isLoading).toEqual(prevState[stateId].isLoading);
    expect(ownState.pagination).toEqual({ skipCount: 20, maxItems: 10, page: 3 });
    // sagaRefreshBoardData raises isRefreshing itself (and only when it actually refreshes in place),
    // so the reducer must NOT pre-set it — otherwise the button spins during the full-reload fallback.
    expect(ownState.isRefreshing).toBeFalsy();
  });

  it('setRefreshing', () => {
    const prevState = { [stateId]: { ...initialState, isRefreshing: true } };
    const ownState = reducer(prevState, setRefreshing({ stateId, isRefreshing: false }))[stateId];

    expect(ownState.isRefreshing).toBeFalsy();
  });

  it('setSwimlaneGrouping', () => {
    const grouping = { attribute: 'priority', label: 'Priority' };
    const newState = reducer(undefined, setSwimlaneGrouping({ stateId, swimlaneGrouping: grouping }));
    const ownState = newState[stateId];

    expect(ownState.swimlaneGrouping).toEqual(grouping);
    expect(ownState.swimlanes).toEqual([]);
    expect(ownState.dataCards).toEqual([]);
    expect(ownState.isLoading).toBeTruthy();
    expect(ownState.isFirstLoading).toBeTruthy();
  });

  it('setSwimlaneValues', () => {
    const swimlanes = [
      { id: 'sl-1', label: 'High', cells: {} },
      { id: 'sl-2', label: 'Low', cells: {} }
    ];
    const newState = reducer(undefined, setSwimlaneValues({ stateId, swimlanes }));
    const ownState = newState[stateId];

    expect(ownState.swimlanes).toEqual(swimlanes);
    expect(ownState.isFirstLoading).toBeFalsy();
  });

  it('setSwimlaneCellData', () => {
    const swimlanes = [
      {
        id: 'sl-1',
        cells: {
          'col-1': { records: [], totalCount: 0, isLoading: true },
          'col-2': { records: [{ id: 'x' }], totalCount: 1, isLoading: false }
        }
      },
      { id: 'sl-2', cells: { 'col-1': { records: [], totalCount: 0, isLoading: true } } }
    ];
    const prevState = { [stateId]: { ...initialState, swimlanes } };
    const newState = reducer(
      prevState,
      setSwimlaneCellData({ stateId, swimlaneId: 'sl-1', statusId: 'col-1', records: [{ id: 'r1' }], totalCount: 1 })
    );
    const ownState = newState[stateId];

    expect(ownState.swimlanes[0].cells['col-1'].records).toEqual([{ id: 'r1' }]);
    expect(ownState.swimlanes[0].cells['col-1'].totalCount).toBe(1);
    expect(ownState.swimlanes[0].cells['col-1'].isLoading).toBe(false);
    expect(ownState.swimlanes[0].cells['col-2'].records).toEqual([{ id: 'x' }]);
    expect(ownState.swimlanes[1].cells['col-1'].records).toEqual([]);
  });

  it('setSwimlaneCellData keeps the cell pagination unless a new one is given', () => {
    const pagination = { skipCount: 0, maxItems: 30, page: 3 };
    const swimlanes = [{ id: 'sl-1', cells: { 'col-1': { records: [], totalCount: 0, pagination, isLoading: true } } }];
    const prevState = { [stateId]: { ...initialState, swimlanes } };

    const kept = reducer(
      prevState,
      setSwimlaneCellData({ stateId, swimlaneId: 'sl-1', statusId: 'col-1', records: [{ id: 'r1' }], totalCount: 1 })
    );
    expect(kept[stateId].swimlanes[0].cells['col-1'].pagination).toEqual(pagination);

    const next = { skipCount: 0, maxItems: 40, page: 4 };
    const updated = reducer(
      prevState,
      setSwimlaneCellData({ stateId, swimlaneId: 'sl-1', statusId: 'col-1', records: [{ id: 'r1' }], totalCount: 1, pagination: next })
    );
    expect(updated[stateId].swimlanes[0].cells['col-1'].pagination).toEqual(next);
  });

  it('toggleSwimlaneCollapse', () => {
    const swimlanes = [
      { id: 'sl-1', isCollapsed: false, cells: {} },
      { id: 'sl-2', isCollapsed: false, cells: {} }
    ];
    const prevState = { [stateId]: { ...initialState, swimlanes } };
    const newState = reducer(prevState, toggleSwimlaneCollapse({ stateId, swimlaneId: 'sl-1' }));
    const ownState = newState[stateId];

    expect(ownState.swimlanes[0].isCollapsed).toBe(true);
    expect(ownState.swimlanes[1].isCollapsed).toBe(false);
  });

  it('setSwimlaneCellLoading', () => {
    const swimlanes = [{ id: 'sl-1', cells: { 'col-1': { records: [{ id: 'r1' }], totalCount: 1, isLoading: false } } }];
    const prevState = { [stateId]: { ...initialState, swimlanes } };
    const newState = reducer(prevState, setSwimlaneCellLoading({ stateId, swimlaneId: 'sl-1', statusId: 'col-1', isLoading: true }));
    const ownState = newState[stateId];

    expect(ownState.swimlanes[0].cells['col-1'].isLoading).toBe(true);
    expect(ownState.swimlanes[0].cells['col-1'].records).toEqual([{ id: 'r1' }]);
  });
});
