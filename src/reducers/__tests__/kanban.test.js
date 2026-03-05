import reducer, { initialState } from '../kanban';
import {
  applyFilter,
  getBoardConfig,
  resetFilter,
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

  it('resetFilter', () => {
    const newState = reducer(undefined, resetFilter({ stateId, dataCards: [{ c: 1 }] }));
    const ownState = newState[stateId];

    expect(ownState.dataCards).toEqual([]);
    expect(ownState.isLoading).toBeTruthy();
  });

  it('reloadBoardData', () => {
    const newState = reducer(undefined, resetFilter({ stateId, dataCards: [{ c: 1 }] }));
    const ownState = newState[stateId];

    expect(ownState.dataCards).toEqual([]);
    expect(ownState.isFirstLoading).toBeTruthy();
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
      { id: 'sl-1', cells: { 'col-1': { records: [], totalCount: 0, isLoading: true }, 'col-2': { records: [{ id: 'x' }], totalCount: 1, isLoading: false } } },
      { id: 'sl-2', cells: { 'col-1': { records: [], totalCount: 0, isLoading: true } } }
    ];
    const prevState = { [stateId]: { ...initialState, swimlanes } };
    const newState = reducer(prevState, setSwimlaneCellData({ stateId, swimlaneId: 'sl-1', statusId: 'col-1', records: [{ id: 'r1' }], totalCount: 1 }));
    const ownState = newState[stateId];

    expect(ownState.swimlanes[0].cells['col-1'].records).toEqual([{ id: 'r1' }]);
    expect(ownState.swimlanes[0].cells['col-1'].totalCount).toBe(1);
    expect(ownState.swimlanes[0].cells['col-1'].isLoading).toBe(false);
    expect(ownState.swimlanes[0].cells['col-2'].records).toEqual([{ id: 'x' }]);
    expect(ownState.swimlanes[1].cells['col-1'].records).toEqual([]);
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
    const swimlanes = [
      { id: 'sl-1', cells: { 'col-1': { records: [{ id: 'r1' }], totalCount: 1, isLoading: false } } }
    ];
    const prevState = { [stateId]: { ...initialState, swimlanes } };
    const newState = reducer(prevState, setSwimlaneCellLoading({ stateId, swimlaneId: 'sl-1', statusId: 'col-1', isLoading: true }));
    const ownState = newState[stateId];

    expect(ownState.swimlanes[0].cells['col-1'].isLoading).toBe(true);
    expect(ownState.swimlanes[0].cells['col-1'].records).toEqual([{ id: 'r1' }]);
  });
});
