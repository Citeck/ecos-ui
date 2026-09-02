import { render } from '@testing-library/react';
import React from 'react';

jest.mock('@citeck/records-core', () => ({ __esModule: true, default: { get: jest.fn() } }));
jest.mock('../../../../../common', () => ({ __esModule: true, Tooltip: ({ children }) => <>{children}</> }));
jest.mock('../../../../../common/btns', () => ({
  __esModule: true,
  Btn: ({ children, ...rest }) => (
    <button role={rest.role} disabled={rest.disabled}>
      {children}
    </button>
  ),
  IcoBtn: ({ children }) => <button>{children}</button>
}));
jest.mock('../../../../../common/grid', () => ({ __esModule: true, Grid: () => <div data-testid="grid" /> }));
jest.mock('../../../../grid/InlineTools/InlineToolsDisconnected', () => ({ __esModule: true, default: () => null }));
jest.mock('../../../AssocLink', () => ({
  __esModule: true,
  AssocLink: ({ label }) => <span className="assoc-link">{label}</span>
}));
jest.mock('../../CreateVariants', () => ({ __esModule: true, default: () => null }));
jest.mock('../../CreateVariants/MenuCreateVariants', () => ({ __esModule: true, default: () => null }));
jest.mock('@/components/core/Records/actions/handler/executor/DebugFormAction', () => ({ __esModule: true, default: {} }));
jest.mock('@/components/core/Records/actions/recordActions', () => ({ __esModule: true, default: {} }));
jest.mock('@/services/notifications', () => ({ __esModule: true, NotificationManager: { error: jest.fn() } }));

const InputView = require('../InputView').default;

describe('SelectJournal InputView', () => {
  const baseProps = { journalId: 'j1', selectedRows: [], viewMode: 'default', placeholder: 'Nothing here' };
  const errorText = container => container.querySelector('.select-journal__error');

  it('renders no error paragraph when nothing failed', () => {
    const { container } = render(<InputView {...baseProps} />);

    expect(errorText(container)).toBeNull();
  });

  // COREDEV-466: the failed value resolution used to be invisible in edit mode — the user was left
  // with the not-selected text and no hint that the server refused.
  it('shows the server text of a failed value resolution', () => {
    const message = 'Изменения строки не прошли внешнюю проверку: сумма превышает лимит';
    const { container } = render(<InputView {...baseProps} valueError={new Error(message)} />);

    expect(errorText(container).textContent).toBe(message);
  });

  it('falls back to the generic error text when the failure carries no message', () => {
    const { container } = render(<InputView {...baseProps} valueError={new Error('')} />);

    expect(errorText(container)).not.toBeNull();
    expect(errorText(container).textContent).not.toBe('');
  });

  it('lets the configuration error win over the value error, without doubling the paragraph', () => {
    const { container } = render(<InputView {...baseProps} error={new Error('no journalId')} valueError={new Error('server refused')} />);

    const errors = container.querySelectorAll('.select-journal__error');
    expect(errors).toHaveLength(1);
    expect(errors[0].textContent).toBe('no journalId');
  });

  // The value error arrives asynchronously, after the first render, with nothing else changing —
  // shouldComponentUpdate has to let it through.
  it('re-renders when the value error arrives after mount', () => {
    const { container, rerender } = render(<InputView {...baseProps} />);
    expect(errorText(container)).toBeNull();

    rerender(<InputView {...baseProps} valueError={new Error('server refused')} />);
    expect(errorText(container).textContent).toBe('server refused');

    rerender(<InputView {...baseProps} valueError={null} />);
    expect(errorText(container)).toBeNull();
  });
});
