// Unit tests for the Kanban board's scroll bookkeeping and lazy paging gates (COREDEV-426).
// Methods are exercised on a bare instance (new WrappedComponent(props)) — the repo's pattern
// for testing arrow-method logic without mounting the whole board.

// The child components drag in the record actions registry and other jsdom-hostile modules.
jest.mock('../KanbanColumn', () => () => null);
jest.mock('../Swimlane', () => () => null);
jest.mock('../HeaderColumn', () => () => null);
jest.mock('@/components/common', () => ({
  Loader: () => null,
  PointsLoader: () => null
}));
jest.mock('@/components/common/icons/EmptyColumns', () => () => null);
jest.mock('@/helpers/util', () => ({
  t: key => key
}));
jest.mock('@/selectors/journals', () => ({
  selectJournalPageProps: jest.fn(() => ({})),
  selectJournalSetting: jest.fn(() => ({}))
}));
jest.mock('@/selectors/kanban', () => ({
  selectKanbanProps: jest.fn(() => ({})),
  selectBoardConfig: jest.fn(() => ({})),
  selectRelatedFilter: jest.fn(() => null)
}));
// The column-sum scope helpers pull in the records registry and XHR layer — cut the chain.
jest.mock('@/services/AttributesService', () => ({ parseId: jest.fn(v => v) }));
jest.mock('@/dto/kanban', () => ({ guessTypeSourceId: jest.fn(() => undefined) }));
jest.mock('@/actions/kanban', () => ({
  cancelGetNextBoardPage: jest.fn(p => p),
  getNextPage: jest.fn(p => p),
  loadMoreSwimlaneCell: jest.fn(p => p),
  moveCard: jest.fn(p => p),
  moveSwimlaneCard: jest.fn(p => p),
  runAction: jest.fn(p => p),
  toggleSwimlaneCollapse: jest.fn(p => p)
}));
jest.mock('@citeck/records-predicates', () => ({
  ParserPredicate: {
    getSearchPredicates: jest.fn(),
    getAvailableSearchColumns: jest.fn()
  }
}));

const ConnectedKanban = require('../Kanban').default;

const Kanban = ConnectedKanban.WrappedComponent;

const makeInstance = (props = {}) => {
  return new Kanban({
    isLoading: false,
    isFirstLoading: false,
    isRefreshing: false,
    swimlaneGrouping: false,
    totalCount: 10,
    dataCards: [{ records: [1, 2] }],
    getNextPage: jest.fn(),
    cancelGetNextBoardPage: jest.fn(),
    ...props
  });
};

describe('Kanban.handleScrollFrame — _lastScrollTop sampling', () => {
  it('keeps a previously sampled deep offset when the frame comes from a hidden container (zero metrics)', () => {
    const instance = makeInstance();
    instance._lastScrollTop = 1200;

    instance.handleScrollFrame({ scrollTop: 0, clientHeight: 0, scrollHeight: 0 });

    expect(instance._lastScrollTop).toBe(1200);
  });

  it('overwrites the sample with 0 on a deliberate jump to the top of a visible board', () => {
    const instance = makeInstance();
    instance._lastScrollTop = 1200;

    instance.handleScrollFrame({ scrollTop: 0, clientHeight: 600, scrollHeight: 5000 });

    expect(instance._lastScrollTop).toBe(0);
  });

  it('samples ordinary frames', () => {
    const instance = makeInstance();
    instance._lastScrollTop = 0;

    instance.handleScrollFrame({ scrollTop: 400, clientHeight: 600, scrollHeight: 5000 });

    expect(instance._lastScrollTop).toBe(400);
  });
});

describe('Kanban.handleScrollFrame — lazy paging gates', () => {
  const bottomFrame = { scrollTop: 400, clientHeight: 600, scrollHeight: 1000 };

  it('requests the next page at the bottom of a flat, idle board', () => {
    const instance = makeInstance();

    instance.handleScrollFrame(bottomFrame);

    expect(instance.props.getNextPage).toHaveBeenCalledTimes(1);
  });

  it('does not request the next page while a silent refresh is in flight', () => {
    const instance = makeInstance({ isRefreshing: true });

    instance.handleScrollFrame(bottomFrame);

    expect(instance.props.getNextPage).not.toHaveBeenCalled();
  });

  it('does not request the next page in swimlane mode (cells page themselves)', () => {
    const instance = makeInstance({ swimlaneGrouping: { attribute: 'assignee' } });

    instance.handleScrollFrame(bottomFrame);

    expect(instance.props.getNextPage).not.toHaveBeenCalled();
  });
});

describe('Kanban.render — swimlane layout wiring', () => {
  it('passes handleScrollFrame to renderLayout so scroll positions are sampled in swimlane mode too', () => {
    const instance = makeInstance({ swimlaneGrouping: { attribute: 'assignee' } });
    instance.renderLayout = jest.fn(() => null);

    instance.render();

    expect(instance.renderLayout).toHaveBeenCalledWith(expect.objectContaining({ onScrollFrame: instance.handleScrollFrame }));
  });
});

describe('Kanban.componentDidUpdate — lazy paging gate', () => {
  const makeUpdatedInstance = props => {
    const instance = makeInstance({
      columns: [{ id: 'col-1' }],
      kanbanSettings: {},
      ...props
    });

    instance.state = { ...instance.state, isInView: true };
    instance.refHeader = { current: null };
    instance.refBody = { current: null };
    instance.refScroll = { current: null };

    return instance;
  };

  const prevProps = { isFirstLoading: false, isRefreshing: false };

  it('requests the next page when the bottom marker is in view on an idle flat board', () => {
    const instance = makeUpdatedInstance();

    instance.componentDidUpdate(prevProps, instance.state, null);

    expect(instance.props.getNextPage).toHaveBeenCalledTimes(1);
  });

  it('does not request the next page while a silent refresh is in flight', () => {
    const instance = makeUpdatedInstance({ isRefreshing: true });

    instance.componentDidUpdate(prevProps, instance.state, null);

    expect(instance.props.getNextPage).not.toHaveBeenCalled();
  });
});

describe('Kanban.componentDidUpdate — full reload starts the board over', () => {
  const makeReloadingInstance = ({ scrollTop = 0, ...props } = {}) => {
    const instance = makeInstance({ columns: [], kanbanSettings: {}, ...props });
    const scrollTopSetter = jest.fn();

    instance.refHeader = { current: null };
    instance.refBody = { current: null };
    instance.refScroll = { current: { getScrollTop: () => scrollTop, scrollTop: scrollTopSetter } };
    instance._lastScrollTop = scrollTop;

    return { instance, scrollTopSetter };
  };

  it('scrolls the board back to the top when isFirstLoading is raised (grouping off, filter apply/reset)', () => {
    const { instance, scrollTopSetter } = makeReloadingInstance({ scrollTop: 1600, isFirstLoading: true, isLoading: true });

    instance.componentDidUpdate({ isFirstLoading: false, isRefreshing: false }, instance.state, null);

    expect(scrollTopSetter).toHaveBeenCalledWith(0);
    expect(instance._lastScrollTop).toBe(0);
  });

  it('leaves the scroll alone on a lazy page load (isLoading flips, isFirstLoading does not)', () => {
    const { instance, scrollTopSetter } = makeReloadingInstance({ scrollTop: 1600, isFirstLoading: false, isLoading: true });

    instance.componentDidUpdate({ isFirstLoading: false, isRefreshing: false, isLoading: false }, instance.state, null);

    expect(scrollTopSetter).not.toHaveBeenCalled();
    expect(instance._lastScrollTop).toBe(1600);
  });

  it('leaves the scroll alone while the first load stays in flight', () => {
    const { instance, scrollTopSetter } = makeReloadingInstance({ scrollTop: 300, isFirstLoading: true, isLoading: true });

    instance.componentDidUpdate({ isFirstLoading: true, isRefreshing: false }, instance.state, null);

    expect(scrollTopSetter).not.toHaveBeenCalled();
  });
});

describe('Kanban.restoreScrollPosition', () => {
  it('puts a sampled position back on a scrollable board that sits at the top', () => {
    const instance = makeInstance();
    const scrollTop = jest.fn();

    instance._lastScrollTop = 800;
    instance.refScroll = {
      current: {
        getScrollTop: () => 0,
        getScrollHeight: () => 2000,
        getClientHeight: () => 600,
        scrollTop
      }
    };

    instance.restoreScrollPosition();

    expect(scrollTop).toHaveBeenCalledWith(800);
  });
});
