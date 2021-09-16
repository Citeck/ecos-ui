import reducer, { initialState } from '../kanban';
import { applyFilter, getBoardConfig, resetFilter, setBoardConfig, setBoardList, setDataCards, setPagination } from '../../actions/kanban';

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
});
