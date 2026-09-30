import { JournalsDashletPagination } from '../JournalsDashletPagination';
import { HEIGHT_GRID_ROW, HEIGHT_GRID_WRAPPER, HEIGHT_THEAD, JOURNAL_VIEW_MODE } from '../../constants';

const MAX_HEIGHT = 700;
const FITTING_ROWS = Math.floor((MAX_HEIGHT - HEIGHT_GRID_WRAPPER - HEIGHT_THEAD) / HEIGHT_GRID_ROW);

// Runs the first height-driven update the journals page goes through and returns the page size it set
const firstUpdate = props => {
  const setGridPagination = jest.fn();
  const fullProps = {
    viewMode: JOURNAL_VIEW_MODE.TABLE,
    grid: {},
    previewListProps: {},
    isViewNewJournal: true,
    maxHeightJournalData: MAX_HEIGHT,
    setGridPagination,
    reloadGrid: jest.fn(),
    cancelReloadGrid: jest.fn(),
    ...props
  };
  const instance = new JournalsDashletPagination(fullProps);

  instance.props = fullProps;
  instance.setState = (update, callback) => {
    instance.state = { ...instance.state, ...update };
    callback && callback();
  };
  instance.componentDidUpdate({ ...fullProps, maxHeightJournalData: null }, { maxHeightJournalData: null, maxItems: null });

  return setGridPagination.mock.calls.map(([pagination]) => pagination);
};

describe('JournalsDashletPagination: journals page size (COREDEV-583)', () => {
  it('fits the rows to the window height by default', () => {
    expect(FITTING_ROWS).toBe(23);
    expect(firstUpdate({})).toEqual([{ skipCount: 0, maxItems: FITTING_ROWS, page: 1 }]);
  });

  it('uses the fixed count from the global config instead of the height', () => {
    expect(firstUpdate({ fixedPageSize: 15 })).toEqual([{ skipCount: 0, maxItems: 15, page: 1 }]);
  });

  it('keeps a fixed count below the auto minimum as is', () => {
    expect(firstUpdate({ fixedPageSize: 3, isDecrementLastRow: true })).toEqual([{ skipCount: 0, maxItems: 3, page: 1 }]);
  });

  it('applies the fixed count to the preview list view as well', () => {
    expect(firstUpdate({ fixedPageSize: 15, viewMode: JOURNAL_VIEW_MODE.PREVIEW_LIST })).toEqual([{ skipCount: 0, maxItems: 15, page: 1 }]);
  });

  it('leaves the journal widget alone: it never gets the page height', () => {
    expect(firstUpdate({ fixedPageSize: 15, isViewNewJournal: undefined, maxHeightJournalData: undefined })).toEqual([]);
  });
});
