import ConnectedKanbanView from '../KanbanView';

// The Kanban board and its bar drag in dnd, record actions and the whole widget registry —
// none of that can (or needs to) load in jsdom for lifecycle-level tests.
jest.mock('../../Kanban', () => ({
  __esModule: true,
  default: () => null,
  Bar: () => null
}));

jest.mock('../../Kanban/SwimlaneGroupingDropdown', () => ({
  __esModule: true,
  default: () => null
}));

jest.mock('@/components/common/form', () => ({
  Dropdown: () => null
}));

const KanbanView = ConnectedKanbanView.WrappedComponent;

const BOARD_REF = 'uiserv/board@main';
const OTHER_BOARD_REF = 'uiserv/board@other';

const makeProps = (overrides = {}) => ({
  isActivePage: true,
  stateId: 'stateId',
  journalId: 'journal-1',
  urlParams: { viewMode: 'kanban', boardId: BOARD_REF },
  boardList: [{ id: BOARD_REF }],
  boardConfig: { id: BOARD_REF },
  getJournalsData: jest.fn(),
  reloadBoardData: jest.fn(),
  getBoardData: jest.fn(),
  ...overrides
});

const createInstance = props => {
  const instance = new KanbanView(props);

  instance.state = { isClose: false };
  instance.setState = jest.fn((partial, cb) => {
    instance.state = { ...instance.state, ...partial };
    cb && cb();
  });

  return instance;
};

describe('KanbanView componentDidUpdate', () => {
  it('on return to the page tab dispatches one silent reload even when prevProps.urlParams describe another tab', () => {
    const props = makeProps();
    const instance = createInstance(props);
    const prevProps = {
      ...props,
      isActivePage: false,
      // Another tab's URL: every kanban-related param differs from the current one
      urlParams: { viewMode: 'kanban', boardId: OTHER_BOARD_REF, search: 'other-tab-search', journalSettingId: 'other-template' }
    };

    instance.componentDidUpdate(prevProps);

    expect(props.reloadBoardData).toHaveBeenCalledTimes(1);
    expect(props.reloadBoardData).toHaveBeenCalledWith({ silent: true });
    expect(props.getBoardData).not.toHaveBeenCalled();
    expect(instance.setState).not.toHaveBeenCalled();
  });

  it('on return to the page tab with identical urlParams (kanban -> kanban switch) still dispatches the silent reload', () => {
    const props = makeProps();
    const instance = createInstance(props);
    const prevProps = { ...props, isActivePage: false };

    instance.componentDidUpdate(prevProps);

    expect(props.reloadBoardData).toHaveBeenCalledTimes(1);
    expect(props.reloadBoardData).toHaveBeenCalledWith({ silent: true });
    expect(props.getBoardData).not.toHaveBeenCalled();
    expect(instance.setState).not.toHaveBeenCalled();
  });

  it('on a genuine search change of the active tab dispatches a silent reload', () => {
    const props = makeProps({ urlParams: { viewMode: 'kanban', boardId: BOARD_REF, search: 'new' } });
    const instance = createInstance(props);
    const prevProps = { ...props, urlParams: { viewMode: 'kanban', boardId: BOARD_REF, search: 'old' } };

    instance.componentDidUpdate(prevProps);

    expect(props.reloadBoardData).toHaveBeenCalledTimes(1);
    expect(props.reloadBoardData).toHaveBeenCalledWith({ silent: true });
    expect(props.getBoardData).not.toHaveBeenCalled();
  });

  it('on a genuine boardId change of the active tab reopens the board and requests its data', () => {
    const props = makeProps({ urlParams: { viewMode: 'kanban', boardId: OTHER_BOARD_REF } });
    const instance = createInstance(props);
    const prevProps = { ...props, urlParams: { viewMode: 'kanban', boardId: BOARD_REF } };

    instance.componentDidUpdate(prevProps);

    expect(instance.setState).toHaveBeenCalledWith({ isClose: false }, expect.any(Function));
    expect(props.getBoardData).toHaveBeenCalledTimes(1);
    expect(props.getBoardData).toHaveBeenCalledWith(OTHER_BOARD_REF, '');
    expect(props.reloadBoardData).not.toHaveBeenCalled();
  });

  it('on a genuine templateId change of the active tab closes the board', () => {
    const props = makeProps({ urlParams: { viewMode: 'kanban', boardId: BOARD_REF, journalSettingId: 'template-2' } });
    const instance = createInstance(props);
    const prevProps = { ...props, urlParams: { viewMode: 'kanban', boardId: BOARD_REF, journalSettingId: 'template-1' } };

    instance.componentDidUpdate(prevProps);

    expect(instance.setState).toHaveBeenCalledWith({ isClose: true });
    expect(props.getBoardData).not.toHaveBeenCalled();
    expect(props.reloadBoardData).not.toHaveBeenCalled();
  });

  it('does nothing on a no-change update of the active tab', () => {
    const props = makeProps();
    const instance = createInstance(props);
    const prevProps = { ...props };

    instance.componentDidUpdate(prevProps);

    expect(props.reloadBoardData).not.toHaveBeenCalled();
    expect(props.getBoardData).not.toHaveBeenCalled();
    expect(props.getJournalsData).not.toHaveBeenCalled();
    expect(instance.setState).not.toHaveBeenCalled();
  });
});
