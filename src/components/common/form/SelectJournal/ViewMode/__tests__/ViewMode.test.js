import { render } from '@testing-library/react';
import React from 'react';

jest.mock('../../InputView', () => ({
  __esModule: true,
  default: () => <div data-testid="input-view" />
}));

jest.mock('../../../AssocLink', () => ({
  __esModule: true,
  AssocLink: ({ label }) => <span className="assoc-link">{label}</span>
}));

const ViewMode = require('../ViewMode').default;

describe('SelectJournal ViewMode', () => {
  const baseProps = { selectedRows: [], viewMode: 'default' };

  // COREDEV-429: while the value is being resolved, the dots stand in the value's own place —
  // the not-selected text about a value nobody has seen yet is exactly the bug.
  it('renders in-place dots instead of the not-selected text while loading', () => {
    const { container } = render(<ViewMode {...baseProps} isLoading />);

    expect(container.querySelector('.select-journal-view-mode__loader')).not.toBeNull();
    expect(container.querySelector('p')).toBeNull();
  });

  it('renders the values, and no dots, when rows are resolved — even if a late load flag is set', () => {
    const { container } = render(<ViewMode {...baseProps} isLoading selectedRows={[{ id: 'r1', disp: 'one' }]} />);

    expect(container.querySelector('.select-journal-view-mode__list')).not.toBeNull();
    expect(container.textContent).toContain('one');
    expect(container.querySelector('.select-journal-view-mode__loader')).toBeNull();
  });

  it('renders the not-selected text once the answer is known to be empty', () => {
    const { container } = render(<ViewMode {...baseProps} placeholder="Nothing here" />);

    expect(container.textContent).toContain('Nothing here');
    expect(container.querySelector('.select-journal-view-mode__loader')).toBeNull();
  });

  it('says error, not «None», when the resolution failed', () => {
    const { container } = render(<ViewMode {...baseProps} valueError={new Error('boom')} placeholder="Nothing here" />);

    expect(container.querySelector('.select-journal-view-mode__error')).not.toBeNull();
    expect(container.textContent).not.toContain('Nothing here');
  });

  // COREDEV-466: the server already explains what went wrong («Изменения строки не прошли внешнюю
  // проверку: …»); a bare «Error» throws that explanation away.
  it('shows the server text of the failed resolution', () => {
    const message = 'Изменения строки не прошли внешнюю проверку: сумма превышает лимит';
    const { container } = render(<ViewMode {...baseProps} valueError={new Error(message)} />);

    expect(container.querySelector('.select-journal-view-mode__error').textContent).toBe(message);
  });

  it('falls back to the generic error text when the failure carries no message', () => {
    const { container } = render(<ViewMode {...baseProps} valueError={new Error('')} />);

    const error = container.querySelector('.select-journal-view-mode__error');
    expect(error).not.toBeNull();
    expect(error.textContent).not.toBe('');
  });

  it('keeps a loading indication on the TABLE branch too', () => {
    const { container } = render(<ViewMode {...baseProps} viewMode="table" isLoading />);

    expect(container.querySelector('[data-testid="input-view"]')).not.toBeNull();
    expect(container.querySelector('.ecos-points-loader')).not.toBeNull();
  });
});
