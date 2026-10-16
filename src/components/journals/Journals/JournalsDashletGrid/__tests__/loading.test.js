import { act, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';
import { createStore } from 'redux';

import JournalsDashletGrid from '../JournalsDashletGrid';

import { reloadGrid, setGrid, setLoadingGrid } from '@/actions/journals';
import { wrapArgs } from '@/helpers/redux';
import reducer, { defaultState } from '@/reducers/journals';

jest.mock('@/components/common', () => ({
  InfoText: () => null,
  Loader: () => <div role="progressbar" aria-label="Loading table" />
}));
jest.mock('@/components/common/grid', () => ({
  EmptyGrid: ({ children }) => children,
  InlineTools: () => null,
  Grid: ({ columns, data, sortBy = [], onSort }) => (
    <table>
      <thead>
        <tr>
          {columns.map(column => (
            <th key={column.attribute}>
              <button onClick={() => onSort({ column, ascending: sortBy.find(s => s.attribute === column.attribute)?.ascending })}>
                {column.name}
              </button>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map(row => (
          <tr key={row.id}>
            <td>{row.name}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}));

const stateId = 'sorting';
const w = wrapArgs(stateId);
const column = { attribute: 'name', name: 'Name', type: 'text', default: true };

function setup({ columns = [column], data = [], loadingGrid = false, isWidget = false } = {}) {
  const actions = [];
  const store = createStore(
    (state, action) => {
      actions.push(action);
      return { journals: reducer(state.journals, action) };
    },
    { journals: { [stateId]: { ...defaultState, loading: false, loadingGrid, grid: { ...defaultState.grid, columns, data } } } }
  );
  const result = render(
    <Provider store={store}>
      <JournalsDashletGrid stateId={stateId} autoHeight isWidget={isWidget} />
    </Provider>
  );
  return { ...result, store, actions };
}

describe('journal loading when sorting (COREDEV-636)', () => {
  it.each([[[]], [[{ id: 'record', name: 'Existing row' }]]])(
    'keeps headers in place and overlays the table on both sort clicks (rows: %j)',
    data => {
      const { container, store, actions } = setup({ data });
      const header = screen.getByRole('columnheader');
      for (const ascending of [true, false]) {
        fireEvent.click(screen.getByRole('button', { name: 'Name' }));
        const request = actions.filter(a => a.type === reloadGrid.toString()).pop();
        expect(request.payload._args.sortBy).toEqual([{ attribute: 'name', ascending }]);
        act(() => {
          store.dispatch(setLoadingGrid(w(true)));
        });
        expect(screen.getByRole('progressbar', { name: 'Loading table' })).toBeInTheDocument();
        expect(container.querySelector('.ecos-journal-grid-skeleton')).toBeNull();
        expect(screen.getByRole('columnheader')).toBe(header);
        if (data.length) expect(screen.getByText('Existing row')).toBeInTheDocument();
        act(() => {
          store.dispatch(setGrid(w({ sortBy: request.payload._args.sortBy })));
          store.dispatch(setLoadingGrid(w(false)));
        });
        expect(screen.queryByRole('progressbar')).toBeNull();
      }
    }
  );

  it('reserves the initial table skeleton for unresolved columns and rows', () => {
    const { container, store } = setup({ columns: [], loadingGrid: true });
    expect(container.querySelector('.ecos-journal-grid-skeleton')).toBeInTheDocument();
    act(() => {
      store.dispatch(setGrid(w({ columns: [column] })));
    });
    expect(container.querySelector('.ecos-journal-grid-skeleton')).toBeNull();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByRole('columnheader')).toBeInTheDocument();
  });

  it('leaves the widget loading indicator to the dashlet', () => {
    const { container } = setup({ columns: [], loadingGrid: true, isWidget: true });
    expect(container.querySelector('.ecos-journal-grid-skeleton')).toBeNull();
    expect(screen.queryByRole('progressbar')).toBeNull();
  });
});
