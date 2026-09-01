import { computeSwimlanesTotalCount, selectKanbanPageProps } from '../kanban';

const stateId = 'stateId';

const boardConfig = {
  id: 'boardId',
  columns: [{ id: 'col-1' }, { id: 'col-2' }]
};

const makeCell = totalCount => ({ records: [], totalCount, pagination: { skipCount: 0, maxItems: 10, page: 1 }, isLoading: false });

const swimlanes = [
  { id: 'high', label: 'High', cells: { 'col-1': makeCell(5), 'col-2': makeCell(3) } },
  { id: 'low', label: 'Low', cells: { 'col-1': makeCell(2), 'col-2': makeCell(0) } }
];

const makeState = ownState => ({ kanban: { [stateId]: ownState } });

describe('kanban selectors: board total count', () => {
  describe('computeSwimlanesTotalCount', () => {
    it('sums the cells of every swimlane', () => {
      expect(computeSwimlanesTotalCount(swimlanes, boardConfig)).toBe(10);
    });

    it('counts only cells that belong to a board column (same scope as the flat path)', () => {
      const withAlien = [{ id: 'high', cells: { ...swimlanes[0].cells, 'col-removed': makeCell(100) } }];

      expect(computeSwimlanesTotalCount(withAlien, boardConfig)).toBe(8);
    });

    it('is tolerant to missing/degenerate data', () => {
      expect(computeSwimlanesTotalCount(undefined, boardConfig)).toBe(0);
      expect(computeSwimlanesTotalCount([], boardConfig)).toBe(0);
      expect(computeSwimlanesTotalCount([{ id: 'x' }], boardConfig)).toBe(0);
      expect(computeSwimlanesTotalCount([{ id: 'x', cells: { 'col-1': {} } }], boardConfig)).toBe(0);
      // no board config yet — count everything rather than nothing
      expect(computeSwimlanesTotalCount(swimlanes, undefined)).toBe(10);
    });
  });

  describe('selectKanbanPageProps', () => {
    it('derives the total from the swimlane cells when grouping is on', () => {
      // state.totalCount is the stale value left by the last flat load — it must NOT be used.
      const state = makeState({
        boardConfig,
        swimlanes,
        swimlaneGrouping: { attribute: 'priority' },
        totalCount: 999,
        dataCards: [],
        pagination: { skipCount: 0, maxItems: 10, page: 1 }
      });

      expect(selectKanbanPageProps(state, stateId).totalCount).toBe(10);
    });

    it('follows the cells when they change (filter/search/DnD recompute)', () => {
      const filtered = [{ id: 'high', cells: { 'col-1': makeCell(1), 'col-2': makeCell(0) } }];
      const state = makeState({
        boardConfig,
        swimlanes: filtered,
        swimlaneGrouping: { attribute: 'priority' },
        totalCount: 999,
        dataCards: [],
        pagination: { skipCount: 0, maxItems: 10, page: 1 }
      });

      expect(selectKanbanPageProps(state, stateId).totalCount).toBe(1);
    });

    it('keeps state.totalCount in flat mode', () => {
      const state = makeState({
        boardConfig,
        swimlanes,
        swimlaneGrouping: null,
        totalCount: 42,
        dataCards: [],
        pagination: { skipCount: 0, maxItems: 10, page: 1 }
      });

      expect(selectKanbanPageProps(state, stateId).totalCount).toBe(42);
    });
  });
});
