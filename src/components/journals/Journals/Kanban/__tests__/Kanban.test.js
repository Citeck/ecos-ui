import { Kanban } from '../Kanban';

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
