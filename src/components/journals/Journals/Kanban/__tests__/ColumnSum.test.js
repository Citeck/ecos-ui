import { act, render, waitFor } from '@testing-library/react';
import React from 'react';

import ColumnSum from '../ColumnSum';
import HeaderColumn from '../HeaderColumn';
import Swimlane from '../Swimlane';

jest.mock('@citeck/records-core', () => ({
  __esModule: true,
  default: {
    queryOne: jest.fn(() => Promise.resolve({ value: 0 })),
    get: jest.fn(() => ({ load: jest.fn(() => Promise.resolve({ ru: 'Сумма', en: 'Sum' })) }))
  }
}));

jest.mock('@/components/common', () => ({
  Tooltip: ({ children }) => children,
  Loader: () => null
}));

// Only needed by the real KanbanColumn used in the cell test at the bottom of this file.
jest.mock('react-beautiful-dnd', () => ({
  Droppable: ({ children }) => children({ droppableProps: {}, innerRef: () => {}, placeholder: null }, {})
}));

jest.mock('../Card', () => () => null);
jest.mock('../SkeletonCard', () => () => null);

jest.mock(
  '@/components/common/TitlePageLoader',
  () =>
    ({ children }) =>
      children
);

jest.mock('@/components/common/form', () => ({
  Badge: () => null
}));

jest.mock('@/helpers/urls', () => ({
  getWorkspaceId: () => 'TEST2'
}));

// Kept real — only wrapped, to count how often the query is rebuilt.
jest.mock('@/dto/kanban', () => {
  const actual = jest.requireActual('@/dto/kanban');
  return { ...actual, __esModule: true, buildColumnSumQuery: jest.fn(actual.buildColumnSumQuery) };
});

// The real formatter drags in the whole grid/formatters registry, which cannot be loaded in jsdom
jest.mock('@/components/common/grid/formatters/gql/NumberFormatter', () => ({
  __esModule: true,
  default: { formatNumber: value => (value === undefined ? '' : String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ',')) }
}));

// The cell (KanbanColumn) drags in dnd/actions machinery — capture its props instead of rendering it
const kanbanColumnProps = [];
jest.mock('../KanbanColumn', () => props => {
  kanbanColumnProps.push(props);
  return null;
});

import Records from '@citeck/records-core';

import { buildColumnSumQuery } from '@/dto/kanban';

const SUM_COLUMN = { id: 'to-do', name: 'To do', hasSum: true, sumAtt: 'estimate' };

const baseProps = {
  data: SUM_COLUMN,
  targetId: 'sum_target',
  sumTypeRef: 'emodel/type@ept-issue',
  // `sourceId` doubles as the "journal config has arrived" flag — nothing is queried without it.
  sourceId: 'emodel/ept-issue',
  ecosType: 'ept-issue',
  predicate: null,
  searchPredicate: null
};

describe('<ColumnSum />', () => {
  beforeEach(() => {
    Records.queryOne.mockClear();
    Records.queryOne.mockImplementation(() => Promise.resolve({ value: 12600000 }));
  });

  it('queries the whole column when there is no group predicate', async () => {
    render(<ColumnSum {...baseProps} />);

    await waitFor(() => expect(Records.queryOne).toHaveBeenCalled());
    const [query, attrs] = Records.queryOne.mock.calls[0];

    expect(query.query.v).toEqual([{ t: 'eq', a: '_status', v: 'to-do' }]);
    expect(attrs).toEqual({ value: 'sum(estimate)?num' });
  });

  it('scopes the query to the swimlane cell via groupPredicate', async () => {
    const groupPredicate = { t: 'eq', att: 'priority', val: '200_high' };
    render(<ColumnSum {...baseProps} groupPredicate={groupPredicate} />);

    await waitFor(() => expect(Records.queryOne).toHaveBeenCalled());
    const [query] = Records.queryOne.mock.calls[0];

    expect(query.query.v).toEqual([{ t: 'eq', a: '_status', v: 'to-do' }, groupPredicate]);
  });

  it('applies the board "only linked records" filter to the sum query', async () => {
    const relatedFilter = { t: 'or', val: [{ t: 'contains', att: 'request', val: 'emodel/request@req-1' }] };
    render(<ColumnSum {...baseProps} relatedFilter={relatedFilter} />);

    await waitFor(() => expect(Records.queryOne).toHaveBeenCalled());
    const [query] = Records.queryOne.mock.calls[0];

    expect(query.query.v).toContainEqual(relatedFilter);
  });

  it('renders the fetched sum and does not query when hasSum is off', async () => {
    const { container } = render(<ColumnSum {...baseProps} />);

    await waitFor(() => expect(container.querySelector('.ecos-kanban__column-sum-value p').textContent).toBe('12,600,000'));

    const { container: noSum } = render(<ColumnSum {...baseProps} data={{ id: 'done', hasSum: false, sumAtt: '' }} />);
    expect(noSum.querySelector('.ecos-kanban__column-sum')).toBeNull();
    expect(Records.queryOne).toHaveBeenCalledTimes(1);
  });

  it('does not mutate the shared predicate array between instances', async () => {
    const shared = [{ t: 'eq', att: 'x', val: 1 }];
    const search = { t: 'contains', att: 'summary', val: 'test' };

    render(<ColumnSum {...baseProps} predicate={shared} searchPredicate={search} />);
    render(<ColumnSum {...baseProps} predicate={shared} searchPredicate={search} />);

    await waitFor(() => expect(Records.queryOne).toHaveBeenCalledTimes(2));
    expect(shared).toHaveLength(1);
  });
});

describe('<HeaderColumn /> sum visibility', () => {
  beforeEach(() => {
    Records.queryOne.mockClear();
    Records.queryOne.mockImplementation(() => Promise.resolve({ value: 1 }));
  });

  const headerProps = {
    data: SUM_COLUMN,
    totalCount: 4,
    isReady: true,
    sumTypeRef: 'emodel/type@ept-issue',
    sourceId: 'emodel/ept-issue',
    predicate: null,
    searchPredicate: null
  };

  it('renders the hanging sum banner by default (flat mode)', () => {
    const { container } = render(<HeaderColumn {...headerProps} />);
    expect(container.querySelector('.ecos-kanban__column-sum')).toBeTruthy();
  });

  it('hides the header sum when showSum is false (grouped mode)', () => {
    const { container } = render(<HeaderColumn {...headerProps} showSum={false} />);
    expect(container.querySelector('.ecos-kanban__column-sum')).toBeNull();
    expect(Records.queryOne).not.toHaveBeenCalled();
  });
});

describe('<Swimlane /> cell sum scope', () => {
  const swimlaneProps = {
    columns: [SUM_COLUMN],
    formProps: {},
    boardConfig: { typeRef: 'emodel/type@ept-issue' },
    resolvedActions: [],
    swimlaneGrouping: { attribute: 'priority', label: 'Priority' },
    predicate: { t: 'and', val: [] },
    searchPredicate: null,
    sourceId: 'emodel/ept-issue',
    ecosType: 'ept-issue',
    sumTypeRef: 'emodel/type@ept-issue',
    journalPredicate: { t: 'eq', att: '_type', val: 'emodel/type@ept-issue' },
    onToggleCollapse: () => {},
    onLoadMore: () => {}
  };

  beforeEach(() => {
    kanbanColumnProps.length = 0;
  });

  it('passes an eq predicate for a regular group', () => {
    render(<Swimlane {...swimlaneProps} swimlane={{ id: '200_high', label: 'High', cells: {} }} />);

    expect(kanbanColumnProps).toHaveLength(1);
    expect(kanbanColumnProps[0].groupPredicate).toEqual({ t: 'eq', att: 'priority', val: '200_high' });
    expect(kanbanColumnProps[0].predicate).toBe(swimlaneProps.predicate);
  });

  it('passes the card scope of the board down to the cell', () => {
    render(<Swimlane {...swimlaneProps} swimlane={{ id: '200_high', label: 'High', cells: {} }} />);

    expect(kanbanColumnProps[0].sourceId).toBe('emodel/ept-issue');
    expect(kanbanColumnProps[0].ecosType).toBe('ept-issue');
    expect(kanbanColumnProps[0].sumTypeRef).toBe('emodel/type@ept-issue');
    expect(kanbanColumnProps[0].journalPredicate).toBe(swimlaneProps.journalPredicate);
  });

  /**
   * `ColumnSum` memoizes the whole query build (cloning every predicate + serializing the result) on
   * the props it reads, and `groupPredicate` is one of them. A lane that rebuilds it per render hands
   * every one of its cells a brand-new object, so that memo would never hit — in the very mode it was
   * added for, on every frame of a drag. The lane object itself is recreated by the store on every
   * board commit, so the identity has to survive that: only the grouped attribute and the lane id
   * may change it.
   */
  it('keeps the groupPredicate reference stable across renders with the same grouping and lane', () => {
    const { rerender } = render(<Swimlane {...swimlaneProps} swimlane={{ id: '200_high', label: 'High', cells: {} }} />);
    rerender(<Swimlane {...swimlaneProps} swimlane={{ id: '200_high', label: 'High', cells: {} }} isDragging />);

    expect(kanbanColumnProps).toHaveLength(2);
    expect(kanbanColumnProps[1].groupPredicate).toBe(kanbanColumnProps[0].groupPredicate);
  });

  it('rebuilds the groupPredicate when the grouping attribute changes', () => {
    const { rerender } = render(<Swimlane {...swimlaneProps} swimlane={{ id: '200_high', label: 'High', cells: {} }} />);
    rerender(
      <Swimlane
        {...swimlaneProps}
        swimlaneGrouping={{ attribute: 'assignee', label: 'Assignee' }}
        swimlane={{ id: '200_high', label: 'High', cells: {} }}
      />
    );

    expect(kanbanColumnProps[1].groupPredicate).toEqual({ t: 'eq', att: 'assignee', val: '200_high' });
  });

  it('passes an empty predicate for the unassigned group', () => {
    render(<Swimlane {...swimlaneProps} swimlane={{ id: '__unassigned__', label: '', cells: {} }} />);

    expect(kanbanColumnProps[0].groupPredicate).toEqual({ t: 'empty', att: 'priority' });
  });

  it('passes no group predicate without grouping', () => {
    render(<Swimlane {...swimlaneProps} swimlaneGrouping={null} swimlane={{ id: '200_high', label: 'High', cells: {} }} />);

    expect(kanbanColumnProps[0].groupPredicate).toBeNull();
  });
});

/**
 * COREDEV-87 (QA return 24.08): the cells were empty but a sum was still shown.
 *
 * Two independent causes, both covered here:
 *   1. the request did not reproduce the scope of the card request — the journal predicate and the
 *      journal's own record source were missing, so records that can never be on the board were summed;
 *   2. the effect only depended on `totalCount`, so a new selection (filter/search/preset/linked
 *      filter) left the previous number on screen — `0 → 0` never re-fires the effect.
 */
describe('<ColumnSum /> board scope', () => {
  beforeEach(() => {
    Records.queryOne.mockClear();
    Records.queryOne.mockImplementation(() => Promise.resolve({ value: 4 }));
  });

  const journalPredicate = { t: 'and', val: [{ t: 'eq', att: 'sprint._status', val: 'in-progress' }] };

  it('adds the journal predicate that the server adds to the card query', async () => {
    render(<ColumnSum {...baseProps} journalPredicate={journalPredicate} />);

    await waitFor(() => expect(Records.queryOne).toHaveBeenCalled());
    expect(Records.queryOne.mock.calls[0][0].query.v).toContainEqual(journalPredicate);
  });

  /**
   * The record source is a generic DAO that resolves attributes THROUGH the type: the server passes
   * the card type with every board-cards request (`withEcosType`), and without it neither
   * `sum(<sumAtt>)` nor a predicate over an association resolves to anything.
   */
  it('sends the card type the server scopes the cards by', async () => {
    render(<ColumnSum {...baseProps} ecosType="ept-issue" />);

    await waitFor(() => expect(Records.queryOne).toHaveBeenCalled());
    expect(Records.queryOne.mock.calls[0][0].ecosType).toBe('ept-issue');
  });

  it('queries the journal source instead of one guessed from the type ref', async () => {
    render(<ColumnSum {...baseProps} sourceId="uiserv/journal-records" />);

    await waitFor(() => expect(Records.queryOne).toHaveBeenCalled());
    expect(Records.queryOne.mock.calls[0][0].sourceId).toBe('uiserv/journal-records');
  });

  it('does not query before the journal config has arrived', async () => {
    const { container } = render(<ColumnSum {...baseProps} sourceId={undefined} />);

    await act(async () => {});
    expect(Records.queryOne).not.toHaveBeenCalled();
    // The banner is rendered, but empty — never a number from a wrong scope.
    expect(container.querySelector('.ecos-kanban__column-sum-value p').textContent).toBe('');
  });
});

/**
 * The tooltip reads `Sum by "<attribute label>"`, and the label is resolved on a TYPE. That type must
 * be the one the sum itself is computed on (the card type), not the board's own `typeRef`: a
 * journal-backed board is scoped by the JOURNAL's type, and an attribute looked up on the wrong type
 * resolves to nothing — `Sum by ""`.
 */
describe('<ColumnSum /> tooltip label', () => {
  let load;
  const defaultGet = () => ({ load: jest.fn(() => Promise.resolve({ ru: 'Сумма', en: 'Sum' })) });

  beforeEach(() => {
    Records.queryOne.mockImplementation(() => Promise.resolve({ value: 1 }));
    load = jest.fn(() => Promise.resolve({ ru: 'Оценка', en: 'Estimate' }));
    Records.get.mockClear();
    Records.get.mockImplementation(() => ({ load }));
  });

  afterEach(() => {
    // The mock is module-wide — the following suites must not inherit this `load`.
    Records.get.mockImplementation(defaultGet);
  });

  it('loads the attribute label from the type the sum is computed on', async () => {
    render(<ColumnSum {...baseProps} sumTypeRef="emodel/type@ept-journal-type" />);

    await waitFor(() => expect(load).toHaveBeenCalled());
    expect(Records.get).toHaveBeenCalledWith('emodel/type@ept-journal-type');
    expect(load).toHaveBeenCalledWith('attributeById.estimate.name{ru,en}');
  });

  it('is resolved on the card type the flat header is given, not on the board type', async () => {
    render(<HeaderColumn data={SUM_COLUMN} totalCount={4} isReady sourceId="emodel/ept-issue" sumTypeRef="emodel/type@ept-issue" />);

    await waitFor(() => expect(Records.get).toHaveBeenCalled());
    expect(Records.get).toHaveBeenCalledWith('emodel/type@ept-issue');
  });

  it('does not ask for the label before the card type is known', async () => {
    render(<ColumnSum {...baseProps} sumTypeRef={undefined} />);

    await act(async () => {});
    expect(Records.get).not.toHaveBeenCalled();
  });

  /**
   * Without a `.catch` a failing label request is an unhandled rejection — the sum effect next to it
   * has always had one. The banner keeps working, only the tooltip stays empty.
   */
  it('survives a failing label request instead of leaving an unhandled rejection', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    load.mockImplementation(() => Promise.reject(new Error('HTTP 500')));

    const { container } = render(<ColumnSum {...baseProps} />);

    await waitFor(() => expect(warn).toHaveBeenCalled());
    expect(container.querySelector('.ecos-kanban__column-sum')).toBeTruthy();

    warn.mockRestore();
  });
});

describe('<ColumnSum /> refetch', () => {
  const sumText = container => container.querySelector('.ecos-kanban__column-sum-value p').textContent;

  beforeEach(() => {
    Records.queryOne.mockClear();
    Records.queryOne.mockImplementation(() => Promise.resolve({ value: 13 }));
  });

  const changes = [
    [
      'predicate',
      { predicate: [{ t: 'eq', att: 'priority', val: '200_high' }] },
      { predicate: [{ t: 'eq', att: 'priority', val: '400_low' }] }
    ],
    [
      'searchPredicate',
      { searchPredicate: { t: 'contains', att: '_name', val: 'TEST2-1' } },
      { searchPredicate: { t: 'contains', att: '_name', val: 'TEST2-9' } }
    ],
    [
      'relatedFilter',
      { relatedFilter: { t: 'or', val: [{ t: 'contains', att: 'request', val: 'emodel/request@req-1' }] } },
      { relatedFilter: { t: 'or', val: [{ t: 'contains', att: 'request', val: 'emodel/request@req-2' }] } }
    ],
    [
      'groupPredicate',
      { groupPredicate: { t: 'eq', att: 'priority', val: '200_high' } },
      { groupPredicate: { t: 'eq', att: 'priority', val: '400_low' } }
    ]
  ];

  it.each(changes)('refetches when %s changes while totalCount stays the same', async (_name, before, after) => {
    const { rerender } = render(<ColumnSum {...baseProps} totalCount={0} {...before} />);
    await waitFor(() => expect(Records.queryOne).toHaveBeenCalledTimes(1));

    rerender(<ColumnSum {...baseProps} totalCount={0} {...after} />);

    await waitFor(() => expect(Records.queryOne).toHaveBeenCalledTimes(2));
    const changed = [].concat(Object.values(after)[0]);
    changed.forEach(item => expect(Records.queryOne.mock.calls[1][0].query.v).toContainEqual(item));
  });

  it('does not refetch on renders with value-equal but reference-new props', async () => {
    const props = () => ({
      groupPredicate: { t: 'eq', att: 'priority', val: '200_high' },
      searchPredicate: { t: 'contains', att: '_name', val: 'TEST2-1' },
      predicate: [{ t: 'eq', att: 'assignee', val: 'emodel/person@ivan' }]
    });

    const { rerender } = render(<ColumnSum {...baseProps} totalCount={3} {...props()} />);
    await waitFor(() => expect(Records.queryOne).toHaveBeenCalledTimes(1));

    rerender(<ColumnSum {...baseProps} totalCount={3} {...props()} />);
    rerender(<ColumnSum {...baseProps} totalCount={3} {...props()} />);
    rerender(<ColumnSum {...baseProps} totalCount={3} {...props()} />);
    await act(async () => {});

    expect(Records.queryOne).toHaveBeenCalledTimes(1);
  });

  /**
   * Rebuilding the query means cloning every predicate and serializing the result — on EVERY render of
   * EVERY cell, and a board re-renders on every frame of a drag. Renders that change nothing the query
   * reads must not pay for it.
   */
  it('does not rebuild the query on a render that changes nothing it reads', async () => {
    buildColumnSumQuery.mockClear();

    const stable = { groupPredicate: { t: 'eq', att: 'priority', val: '200_high' }, predicate: [] };
    const { rerender } = render(<ColumnSum {...baseProps} totalCount={3} {...stable} />);
    await waitFor(() => expect(Records.queryOne).toHaveBeenCalledTimes(1));

    const calls = buildColumnSumQuery.mock.calls.length;
    rerender(<ColumnSum {...baseProps} totalCount={3} {...stable} className="dragging" />);
    rerender(<ColumnSum {...baseProps} totalCount={3} {...stable} className="dragging" />);

    expect(buildColumnSumQuery.mock.calls).toHaveLength(calls);
  });

  it('shows 0 for a cell whose selection is empty', async () => {
    Records.queryOne.mockImplementation(() => Promise.resolve({ value: null }));
    const { container } = render(<ColumnSum {...baseProps} />);

    await waitFor(() => expect(sumText(container)).toBe('0'));
  });

  it('does not let a late answer of the previous request overwrite the newer one', async () => {
    const resolvers = [];
    Records.queryOne.mockImplementation(() => new Promise(resolve => resolvers.push(resolve)));

    const { rerender, container } = render(<ColumnSum {...baseProps} totalCount={0} predicate={[{ t: 'eq', att: 'a', val: '1' }]} />);
    await waitFor(() => expect(resolvers).toHaveLength(1));

    rerender(<ColumnSum {...baseProps} totalCount={0} predicate={[{ t: 'eq', att: 'a', val: '2' }]} />);
    await waitFor(() => expect(resolvers).toHaveLength(2));

    await act(async () => {
      resolvers[1]({ value: 7 }); // the current request answers first
      resolvers[0]({ value: 99 }); // the stale one answers after it
    });

    expect(sumText(container)).toBe('7');
  });

  it('does not keep the previous number when the request fails', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const { rerender, container } = render(<ColumnSum {...baseProps} totalCount={0} predicate={[{ t: 'eq', att: 'a', val: '1' }]} />);
    await waitFor(() => expect(sumText(container)).toBe('13'));

    Records.queryOne.mockImplementation(() => Promise.reject(new Error('HTTP 500')));
    rerender(<ColumnSum {...baseProps} totalCount={0} predicate={[{ t: 'eq', att: 'a', val: '2' }]} />);

    await waitFor(() => expect(sumText(container)).toBe(''));
    expect(warn).toHaveBeenCalled();

    warn.mockRestore();
  });
});

/**
 * The last hop of the sum's scope — the swimlane CELL. `KanbanColumn` is mocked at the top of this
 * file for the lane tests, so the real component is pulled in here: it used to hand its `ColumnSum`
 * the BOARD's own `typeRef`, which on a journal-backed board is not the type the sum is computed on.
 */
describe('swimlane cell → ColumnSum', () => {
  const KanbanColumn = jest.requireActual('../KanbanColumn').default;

  beforeEach(() => {
    Records.queryOne.mockClear();
    Records.queryOne.mockImplementation(() => Promise.resolve({ value: 5 }));
    Records.get.mockClear();
  });

  it('resolves the cell sum label on the card type, not on the board type', async () => {
    render(
      <KanbanColumn
        columnInfo={SUM_COLUMN}
        swimlaneId="200_high"
        statusId="to-do"
        records={[]}
        totalCount={2}
        boardConfig={{ typeRef: 'emodel/type@ept-task' }}
        sourceId="uiserv/ept-issue-records"
        ecosType="ept-issue"
        sumTypeRef="emodel/type@ept-issue"
      />
    );

    await waitFor(() => expect(Records.get).toHaveBeenCalled());
    expect(Records.get).toHaveBeenCalledWith('emodel/type@ept-issue');
    expect(Records.get).not.toHaveBeenCalledWith('emodel/type@ept-task');
  });

  it('queries the cell sum with the card scope it is handed', async () => {
    render(
      <KanbanColumn
        columnInfo={SUM_COLUMN}
        swimlaneId="200_high"
        statusId="to-do"
        records={[]}
        totalCount={2}
        boardConfig={{ typeRef: 'emodel/type@ept-task' }}
        sourceId="uiserv/ept-issue-records"
        ecosType="ept-issue"
        sumTypeRef="emodel/type@ept-issue"
        groupPredicate={{ t: 'eq', att: 'priority', val: '200_high' }}
      />
    );

    await waitFor(() => expect(Records.queryOne).toHaveBeenCalled());
    const [query] = Records.queryOne.mock.calls[0];

    expect(query.sourceId).toBe('uiserv/ept-issue-records');
    expect(query.ecosType).toBe('ept-issue');
    expect(query.query.v).toContainEqual({ t: 'eq', att: 'priority', val: '200_high' });
  });
});
