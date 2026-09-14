import React from 'react';
import { render, screen } from '@testing-library/react';

import Swimlane from '../Swimlane';

jest.mock('@/components/common', () => ({ Loader: () => null }));
jest.mock('@/components/journals/Journals/constants', () => ({ Labels: { Kanban: {} } }));
jest.mock('@/helpers/util', () => ({ t: key => key }));
jest.mock('../ColumnSum', () => () => null);
jest.mock('../SkeletonCard', () => () => null);
jest.mock('../SwimlaneHeader', () => () => null);
jest.mock('../Card', () => ({ data, isDragDisabled }) => <div data-testid={`card-${data.cardId}`} data-disabled={isDragDisabled} />);
jest.mock('react-beautiful-dnd', () => ({
  Droppable: ({ children, isDropDisabled }) => (
    <div data-testid="droppable" data-disabled={isDropDisabled}>
      {children({ innerRef: () => {}, droppableProps: {}, placeholder: null }, {})}
    </div>
  )
}));

const props = {
  columns: [{ id: 'todo' }, { id: 'done' }],
  onToggleCollapse: jest.fn(),
  onLoadMore: jest.fn(),
  readOnly: false,
  swimlane: {
    id: 'high',
    cells: {
      // The optimistic move has emptied todo, but its badge still has the server's count.
      todo: { records: [], totalCount: 1, isLoading: false },
      // An idle cell with a real next page: only the row-wide busy flag can hide its More.
      done: { records: [{ cardId: 'card-1' }], totalCount: 5, isLoading: false }
    }
  }
};

it('keeps the moved card but hides the false More and disables DnD until the row settles', () => {
  const { rerender } = render(<Swimlane {...props} swimlane={{ ...props.swimlane, isMoving: true }} />);
  expect(screen.queryByRole('button', { name: 'kanban.swimlane.show-more' })).toBeNull();
  expect(screen.getByTestId('card-card-1').getAttribute('data-disabled')).toBe('true');
  screen.getAllByTestId('droppable').forEach(el => expect(el.getAttribute('data-disabled')).toBe('true'));

  rerender(
    <Swimlane
      {...props}
      swimlane={{
        ...props.swimlane,
        cells: {
          todo: { records: [], totalCount: 0 },
          done: { records: [{ cardId: 'card-1' }], totalCount: 1 }
        }
      }}
    />
  );
  expect(screen.queryByRole('button')).toBeNull();
  expect(screen.getByTestId('card-card-1').getAttribute('data-disabled')).toBe('false');
});

it('keeps legitimate paging available on an idle row and blocks dragging while a page is pending', () => {
  const { rerender } = render(<Swimlane {...props} />);
  expect(screen.getAllByRole('button', { name: 'kanban.swimlane.show-more' })).toHaveLength(2);
  rerender(
    <Swimlane
      {...props}
      swimlane={{
        ...props.swimlane,
        cells: {
          ...props.swimlane.cells,
          todo: { ...props.swimlane.cells.todo, isLoading: true }
        }
      }}
    />
  );
  expect(screen.queryByRole('button')).toBeNull();
  expect(screen.getByTestId('card-card-1').getAttribute('data-disabled')).toBe('true');
});
