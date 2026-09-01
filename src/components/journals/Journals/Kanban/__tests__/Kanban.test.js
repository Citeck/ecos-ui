import HeaderColumn from '../HeaderColumn';
import { Kanban, mapStateToProps } from '../Kanban';
import Swimlane from '../Swimlane';

/**
 * `componentDidUpdate` is exercised directly: it only reads props, state and the two layout refs,
 * and rendering the whole board would need a store, a DragDropContext and a real scrollbar.
 */
function buildKanban(props = {}) {
  const getNextPage = jest.fn();
  const cancelGetNextBoardPage = jest.fn();

  const instance = new Kanban({
    columns: [{ id: 'backlog' }, { id: 'done' }],
    kanbanSettings: {},
    isLoadingColumns: [],
    getNextPage,
    cancelGetNextBoardPage,
    ...props
  });

  instance.state = { ...instance.state, isDragging: false, isInView: true };
  instance.refHeader = { current: null };
  instance.refBody = { current: null };
  instance.isNoMore = () => false;

  return { instance, getNextPage, cancelGetNextBoardPage };
}

describe('<Kanban /> pagination on board updates', () => {
  it('should request the next page when the board is idle and scrolled to the bottom', () => {
    const { instance, getNextPage } = buildKanban();

    instance.componentDidUpdate({}, {});

    expect(getNextPage).toHaveBeenCalledTimes(1);
  });

  /**
   * A card move commits the board data twice (optimistic, then settled) and keeps the affected
   * columns marked as loading for the whole time. Without the check both commits re-dispatch
   * getNextPage, so the loader flashes on and off twice per move.
   */
  it('should not request the next page while a column is being moved into or out of', () => {
    const { instance, getNextPage, cancelGetNextBoardPage } = buildKanban({ isLoadingColumns: ['backlog', 'done'] });

    // Both board data commits of a single move.
    instance.componentDidUpdate({}, {});
    instance.componentDidUpdate({}, {});

    expect(getNextPage).not.toHaveBeenCalled();
    expect(cancelGetNextBoardPage).not.toHaveBeenCalled();
  });

  it('should request the next page again once the move has settled', () => {
    const { instance, getNextPage } = buildKanban({ isLoadingColumns: ['backlog'] });

    instance.componentDidUpdate({}, {});
    expect(getNextPage).not.toHaveBeenCalled();

    instance.props = { ...instance.props, isLoadingColumns: [] };
    instance.componentDidUpdate({}, {});

    expect(getNextPage).toHaveBeenCalledTimes(1);
  });
});

/**
 * COREDEV-87: the column sum queries the record source directly, while the cards go through
 * `board-cards`, where the SERVER adds the journal predicate and resolves the source. Both have to
 * reach every ColumnSum — through the swimlane cells AND through the flat header.
 */
function findElements(node, type, acc = []) {
  if (Array.isArray(node)) {
    node.forEach(item => findElements(item, type, acc));
    return acc;
  }

  if (!node || typeof node !== 'object' || !node.props) {
    return acc;
  }

  if (node.type === type) {
    acc.push(node);
  }

  return findElements(node.props.children, type, acc);
}

describe('<Kanban /> journal scope plumbing', () => {
  const journalPredicate = { t: 'and', val: [{ t: 'eq', att: 'sprint._status', val: 'in-progress' }] };

  // The config of the journal the PAGE is showing. It is always loaded (sagaInitJournal), so a state
  // without it is not a state the app can be in — the only realistic question is whether the board
  // that is selected is backed by THIS journal or by nothing at all.
  const journalConfig = {
    id: 'ept-issue-journal',
    typeRef: 'emodel/type@ept-issue',
    // Deliberately NOT derivable from the type ref: that is what tells the two branches apart.
    sourceId: 'uiserv/ept-issue-records',
    predicate: journalPredicate
  };

  function buildState(boardConfig, config = journalConfig) {
    return {
      journals: { s1: { journalConfig: config, journalSetting: {} } },
      kanban: { s1: { boardConfig, pagination: {} } }
    };
  }

  it('reproduces the whole card scope for a board backed by the journal of the page', () => {
    const props = mapStateToProps(buildState({ journalRef: 'uiserv/journal@ept-issue-journal', typeRef: 'emodel/type@ept-issue' }), {
      stateId: 's1'
    });

    expect(props.journalPredicate).toEqual(journalPredicate);
    expect(props.sourceId).toBe('uiserv/ept-issue-records');
    expect(props.ecosType).toBe('ept-issue');
    expect(props.sumTypeRef).toBe('emodel/type@ept-issue');
  });

  /**
   * `BoardCardOrderService.resolveCardsSourceAndPredicate`: with a journal behind the board the cards
   * are scoped by the JOURNAL's type, not by the board's own one.
   */
  it('takes the card type from the journal, not from the board, when the board is journal-backed', () => {
    const props = mapStateToProps(buildState({ journalRef: 'uiserv/journal@ept-issue-journal', typeRef: 'emodel/type@ept-task' }), {
      stateId: 's1'
    });

    expect(props.ecosType).toBe('ept-issue');
  });

  /**
   * The sum is computed on the card type, and the tooltip label of the summed attribute has to be
   * resolved on the SAME type. A journal-backed board whose own `typeRef` differs used to look the
   * label up on `boardConfig.typeRef`, where that attribute does not exist — the tooltip then read
   * `Sum by ""` next to a number computed on another type.
   */
  it('resolves the sum label on the journal type when the board declares a different one', () => {
    const props = mapStateToProps(buildState({ journalRef: 'uiserv/journal@ept-issue-journal', typeRef: 'emodel/type@ept-task' }), {
      stateId: 's1'
    });

    expect(props.sumTypeRef).toBe('emodel/type@ept-issue');
  });

  it('resolves the sum label on the board type when the board has no journal', () => {
    const props = mapStateToProps(buildState({ typeRef: 'emodel/type@ept-task' }), { stateId: 's1' });

    expect(props.sumTypeRef).toBe('emodel/type@ept-task');
  });

  /**
   * The server gives such a board `VoidPredicate` and the source/type of the BOARD. Applying the
   * predicate of the page journal here would filter the sum by something the cards are not filtered
   * by at all — the very COREDEV-87 mismatch, only the other way round.
   */
  it('scopes the sum by the board type alone when the board has no journal', () => {
    const props = mapStateToProps(buildState({ typeRef: 'emodel/type@ept-task' }), { stateId: 's1' });

    expect(props.journalPredicate).toBeUndefined();
    expect(props.sourceId).toBe('emodel/ept-task');
    expect(props.ecosType).toBe('ept-task');
  });

  it('keeps the source undefined while the config of a journal-backed board is still loading', () => {
    const props = mapStateToProps(buildState({ journalRef: 'uiserv/journal@ept-issue-journal', typeRef: 'emodel/type@ept-issue' }, {}), {
      stateId: 's1'
    });

    // Querying now would sum the whole type, and that wrong number would sit on screen until the
    // config lands — `ColumnSum` treats a missing sourceId as "not ready".
    expect(props.sourceId).toBeUndefined();
    expect(props.journalPredicate).toBeUndefined();
    expect(props.ecosType).toBeUndefined();
    expect(props.sumTypeRef).toBeUndefined();
  });

  it('leaves everything undefined while no board is selected yet', () => {
    const props = mapStateToProps(buildState(undefined), { stateId: 's1' });

    expect(props.journalPredicate).toBeUndefined();
    expect(props.sourceId).toBeUndefined();
    expect(props.ecosType).toBeUndefined();
  });

  const cols = [{ id: 'to-do', name: 'To do', hasSum: true, sumAtt: 'eptNumber' }];

  function buildBoard() {
    const instance = new Kanban({
      columns: cols,
      dataCards: [{ status: 'to-do', totalCount: 3 }],
      swimlanes: [{ id: '200_high', cells: { 'to-do': { totalCount: 2, records: [] } } }],
      swimlaneGrouping: { attribute: 'priority' },
      // Deliberately NOT the type the sum is computed on: the board's own type is what the label used
      // to be resolved on, so a differing one is what catches the regression.
      boardConfig: { typeRef: 'emodel/type@ept-task', columns: cols },
      journalSetting: { columns: [] },
      predicate: null,
      journalPredicate,
      sourceId: 'uiserv/ept-issue-records',
      ecosType: 'ept-issue',
      sumTypeRef: 'emodel/type@ept-issue',
      toggleSwimlaneCollapse: () => {},
      loadMoreSwimlaneCell: () => {},
      runAction: () => {}
    });

    instance.state = { ...instance.state, isDragging: false, draggingSwimlaneId: null };

    return instance;
  }

  it('passes them to every swimlane cell', () => {
    const swimlanes = findElements(buildBoard().renderSwimlaneBody(cols), Swimlane);

    expect(swimlanes).toHaveLength(1);
    expect(swimlanes[0].props.journalPredicate).toEqual(journalPredicate);
    expect(swimlanes[0].props.sourceId).toBe('uiserv/ept-issue-records');
    expect(swimlanes[0].props.ecosType).toBe('ept-issue');
    expect(swimlanes[0].props.sumTypeRef).toBe('emodel/type@ept-issue');
  });

  it('passes them to the flat header, which owns the sum without grouping', () => {
    const headers = findElements(buildBoard().renderDefaultHeader(cols), HeaderColumn);

    expect(headers).toHaveLength(1);
    expect(headers[0].props.journalPredicate).toEqual(journalPredicate);
    expect(headers[0].props.sourceId).toBe('uiserv/ept-issue-records');
    expect(headers[0].props.ecosType).toBe('ept-issue');
    // The card type, NOT `boardConfig.typeRef` — the tooltip label must be resolved where the summed
    // attribute actually exists.
    expect(headers[0].props.sumTypeRef).toBe('emodel/type@ept-issue');
    expect(headers[0].props.showSum).toBeUndefined();
  });

  /**
   * In grouped mode each swimlane CELL renders its own sum, so the lane header explicitly turns the
   * banner off — and `HeaderColumn` mounts no `ColumnSum` at all when it is off. Everything the sum
   * needs is therefore dead weight in this call; only the switch itself is worth pinning.
   */
  it('keeps the sum off in the swimlane header, which never renders one', () => {
    const headers = findElements(buildBoard().renderSwimlaneHeader(cols), HeaderColumn);

    expect(headers).toHaveLength(1);
    expect(headers[0].props.showSum).toBe(false);
  });
});

/**
 * Every `ColumnSum` (one per column, or one per CELL under grouping) memoizes its query — cloning
 * every predicate and serializing the result — on the props it is handed. The search predicate is one
 * of them, and the board re-renders on every frame of a drag, so a getter that rebuilds it per read
 * would defeat that memo everywhere at once.
 */
describe('<Kanban /> searchPredicate identity', () => {
  const columns = [{ attribute: '_name', type: 'text', visible: true, default: true, searchable: true }];

  function buildSearch(searchText) {
    const instance = new Kanban({ searchText, journalSetting: { columns } });
    instance.state = { ...instance.state };
    return instance;
  }

  it('hands out the same reference while the search text does not change', () => {
    const instance = buildSearch('TEST2-1');
    const first = instance.searchPredicate;

    expect(first).not.toBeNull();
    expect(instance.searchPredicate).toBe(first);
    expect(instance.searchPredicate).toBe(first);
  });

  it('rebuilds it when the search text changes', () => {
    const instance = buildSearch('TEST2-1');
    const first = instance.searchPredicate;

    instance.props = { ...instance.props, searchText: 'TEST2-9' };
    const second = instance.searchPredicate;

    expect(second).not.toBe(first);
    expect(JSON.stringify(second)).toContain('TEST2-9');
    expect(instance.searchPredicate).toBe(second);
  });

  it('rebuilds it when the journal columns change', () => {
    const instance = buildSearch('TEST2-1');
    const first = instance.searchPredicate;

    instance.props = { ...instance.props, journalSetting: { columns: [...columns, { attribute: 'assignee', type: 'text' }] } };

    expect(instance.searchPredicate).not.toBe(first);
  });

  it('returns null without a search text', () => {
    expect(buildSearch('').searchPredicate).toBeNull();
    expect(buildSearch(undefined).searchPredicate).toBeNull();
  });
});
