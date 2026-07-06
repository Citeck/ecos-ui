import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

import MessageActions from '../components/messages/MessageActions';

// Keep labels verbatim so DOM-order assertions read the backend-provided text.
jest.mock('@/helpers/export/util', () => ({
  t: key => key
}));

const labels = () => screen.getAllByRole('button').map(b => b.textContent);

describe('MessageActions button ordering (positive on the right)', () => {
  it('renders nothing when there are no actions', () => {
    const { container } = render(<MessageActions actions={[]} messageId="m" onActionClick={jest.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('puts the primary (positive) action on the right and danger on the left — deploy pair', () => {
    // Backend emits positive-first: [confirm, reject]
    const actions = [
      { id: 'deploy_confirm', label: 'Развернуть', style: 'primary' },
      { id: 'deploy_reject', label: 'Отмена', style: 'danger' }
    ];
    render(<MessageActions actions={actions} messageId="m" onActionClick={jest.fn()} />);
    expect(labels()).toEqual(['Отмена', 'Развернуть']);
  });

  it('orders a mutate confirm/reject pair with confirm on the right (reject is style=default)', () => {
    const actions = [
      { id: 'mutate_confirm', label: 'Подтвердить', style: 'primary' },
      { id: 'mutate_reject', label: 'Отмена', style: 'default' }
    ];
    render(<MessageActions actions={actions} messageId="m" onActionClick={jest.fn()} />);
    expect(labels()).toEqual(['Отмена', 'Подтвердить']);
  });

  it('orders a three-button recovery set danger→default→primary (Retry on the right)', () => {
    const actions = [
      { id: 'RETRY', label: 'Повторить', style: 'primary' },
      { id: 'SKIP', label: 'Пропустить', style: 'default' },
      { id: 'ABORT', label: 'Отменить', style: 'danger' }
    ];
    render(<MessageActions actions={actions} messageId="m" onActionClick={jest.fn()} />);
    // These ids resolve via ACTION_LABEL_KEYS; the mocked `t` echoes the i18n key.
    // Order proves danger(ABORT)→default(SKIP)→primary(RETRY): positive on the right.
    expect(labels()).toEqual(['ai-assistant.action.cancel', 'ai-assistant.action.skip', 'ai-assistant.action.retry']);
  });

  it('does not mutate the incoming actions array', () => {
    const actions = [
      { id: 'deploy_confirm', label: 'Развернуть', style: 'primary' },
      { id: 'deploy_reject', label: 'Отмена', style: 'danger' }
    ];
    const snapshot = actions.map(a => a.id);
    render(<MessageActions actions={actions} messageId="m" onActionClick={jest.fn()} />);
    expect(actions.map(a => a.id)).toEqual(snapshot);
  });

  it('forwards the clicked action id and messageId', () => {
    const onActionClick = jest.fn();
    const actions = [
      { id: 'deploy_confirm', label: 'Развернуть', style: 'primary' },
      { id: 'deploy_reject', label: 'Отмена', style: 'danger' }
    ];
    render(<MessageActions actions={actions} messageId="msg-9" onActionClick={onActionClick} />);
    fireEvent.click(screen.getByText('Развернуть'));
    expect(onActionClick).toHaveBeenCalledWith('deploy_confirm', { messageId: 'msg-9' });
  });
});
