import { render, waitFor } from '@testing-library/react';
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
  Tooltip: ({ children }) => children
}));

jest.mock('@/components/common/TitlePageLoader', () => ({ children }) => children);

jest.mock('@/components/common/form', () => ({
  Badge: () => null
}));

jest.mock('@/helpers/urls', () => ({
  getWorkspaceId: () => 'TEST2'
}));

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

const SUM_COLUMN = { id: 'to-do', name: 'To do', hasSum: true, sumAtt: 'estimate' };

const baseProps = {
  data: SUM_COLUMN,
  targetId: 'sum_target',
  typeRef: 'emodel/type@ept-issue',
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
    typeRef: 'emodel/type@ept-issue',
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

  it('passes an empty predicate for the unassigned group', () => {
    render(<Swimlane {...swimlaneProps} swimlane={{ id: '__unassigned__', label: '', cells: {} }} />);

    expect(kanbanColumnProps[0].groupPredicate).toEqual({ t: 'empty', att: 'priority' });
  });

  it('passes no group predicate without grouping', () => {
    render(<Swimlane {...swimlaneProps} swimlaneGrouping={null} swimlane={{ id: '200_high', label: 'High', cells: {} }} />);

    expect(kanbanColumnProps[0].groupPredicate).toBeNull();
  });
});
