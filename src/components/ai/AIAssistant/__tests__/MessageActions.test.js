import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

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

describe('MessageActions disabled state (gate no longer live)', () => {
  const actions = [
    { id: 'deploy_confirm', label: 'Развернуть', style: 'primary' },
    { id: 'deploy_reject', label: 'Отмена', style: 'danger' }
  ];

  it('marks every button disabled and adds the stale modifier class', () => {
    render(<MessageActions actions={actions} messageId="m" onActionClick={jest.fn()} disabled stale />);

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(2);
    buttons.forEach(button => {
      expect(button.disabled).toBe(true);
      expect(button.className).toContain('ai-assistant-chat__action-button--stale');
    });
  });

  it('does not call onActionClick when a disabled button is clicked', () => {
    const onActionClick = jest.fn();
    render(<MessageActions actions={actions} messageId="m" onActionClick={onActionClick} disabled />);

    fireEvent.click(screen.getByText('Развернуть'));
    expect(onActionClick).not.toHaveBeenCalled();
  });

  it('keeps a file-save button of a mixed set live while the gate buttons go stale', () => {
    // The backend merges the Save/Cancel pair of a freshly proposed file onto the gate produced by
    // the same turn and never re-emits it later, so disabling the whole set would strand the file.
    const onActionClick = jest.fn();
    const mixed = [
      ...actions,
      { id: 'main_content|temp-file@a', label: 'Сохранить в контент', style: 'primary' },
      // `file_cancel|<tempRef>` resolves through ACTION_LABEL_KEYS, so it renders the echoed key.
      { id: 'file_cancel|temp-file@a', label: 'Не сохранять', style: 'default' }
    ];

    render(<MessageActions actions={mixed} messageId="m" onActionClick={onActionClick} disabled stale />);

    expect(screen.getByText('Развернуть').closest('button').disabled).toBe(true);
    expect(screen.getByText('Отмена').closest('button').disabled).toBe(true);

    const save = screen.getByText('Сохранить в контент').closest('button');
    expect(save.disabled).toBe(false);
    expect(save.className).not.toContain('ai-assistant-chat__action-button--stale');
    expect(screen.getByText('ai-assistant.action.cancel').closest('button').disabled).toBe(false);

    fireEvent.click(save);
    expect(onActionClick).toHaveBeenCalledWith('main_content|temp-file@a', { messageId: 'm' });
  });

  it('retires a file-save button once its own tempRef is answered', () => {
    // The exemption from staleness lasts only until that file's decision is taken: the backend
    // deletes the temp file on save, so a second click would act on a ref that no longer exists.
    const onActionClick = jest.fn();
    const pairs = [
      { id: 'main_content|temp-file@a', label: 'Сохранить в контент', style: 'primary' },
      { id: 'new_record|temp-file@b', label: 'Сохранить как запись', style: 'primary' }
    ];

    render(
      <MessageActions actions={pairs} messageId="m" onActionClick={onActionClick} disabled stale resolvedFileTempRefs={['temp-file@a']} />
    );

    const resolved = screen.getByText('Сохранить в контент').closest('button');
    expect(resolved.disabled).toBe(true);
    expect(resolved.className).toContain('ai-assistant-chat__action-button--stale');
    fireEvent.click(resolved);
    expect(onActionClick).not.toHaveBeenCalled();

    // The other pending file is untouched by that decision
    const live = screen.getByText('Сохранить как запись').closest('button');
    expect(live.disabled).toBe(false);
    expect(live.className).not.toContain('ai-assistant-chat__action-button--stale');
  });

  it('retires an answered file-save button even when the message itself is not stale', () => {
    // A pure file-save set is never superseded by position, so `disabled` stays false there —
    // the resolved tempRef must disable the button on its own.
    const onActionClick = jest.fn();
    const pair = [
      { id: 'new_record|temp-file@a', label: 'Сохранить как запись', style: 'primary' },
      { id: 'file_cancel|temp-file@a', label: 'Не сохранять', style: 'default' }
    ];

    render(<MessageActions actions={pair} messageId="m" onActionClick={onActionClick} resolvedFileTempRefs={['temp-file@a']} />);

    screen.getAllByRole('button').forEach(button => {
      expect(button.disabled).toBe(true);
      expect(button.className).toContain('ai-assistant-chat__action-button--stale');
    });

    fireEvent.click(screen.getByText('Сохранить как запись'));
    expect(onActionClick).not.toHaveBeenCalled();
  });

  it('freezes file-save buttons as well while a request is in flight', () => {
    const onActionClick = jest.fn();
    const mixed = [...actions, { id: 'main_content|temp-file@a', label: 'Сохранить в контент', style: 'primary' }];

    render(<MessageActions actions={mixed} messageId="m" onActionClick={onActionClick} disabled frozen stale />);

    screen.getAllByRole('button').forEach(button => {
      expect(button.disabled).toBe(true);
    });

    fireEvent.click(screen.getByText('Сохранить в контент'));
    expect(onActionClick).not.toHaveBeenCalled();
  });

  it('locks a live gate during a request without painting it retired', () => {
    // The freeze is transient and says nothing about this gate: `MessageList` passes it through
    // `disabled`/`frozen` but leaves `stale` false, and only staleness may mute a button. Painting
    // the freeze made every button in the history look decided for the length of any request.
    const onActionClick = jest.fn();
    render(<MessageActions actions={actions} messageId="m" onActionClick={onActionClick} disabled frozen />);

    screen.getAllByRole('button').forEach(button => {
      expect(button.disabled).toBe(true);
      expect(button.className).not.toContain('ai-assistant-chat__action-button--stale');
    });

    fireEvent.click(screen.getByText('Развернуть'));
    expect(onActionClick).not.toHaveBeenCalled();
  });

  it('paints a stale gate retired even while no request is running', () => {
    render(<MessageActions actions={actions} messageId="m" onActionClick={jest.fn()} disabled stale />);

    screen.getAllByRole('button').forEach(button => {
      expect(button.disabled).toBe(true);
      expect(button.className).toContain('ai-assistant-chat__action-button--stale');
    });
  });

  it('keeps the buttons live and the modifier off when not disabled', () => {
    const onActionClick = jest.fn();
    render(<MessageActions actions={actions} messageId="msg-3" onActionClick={onActionClick} />);

    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button.disabled).toBe(false);
      expect(button.className).not.toContain('ai-assistant-chat__action-button--stale');
    });

    fireEvent.click(screen.getByText('Развернуть'));
    expect(onActionClick).toHaveBeenCalledWith('deploy_confirm', { messageId: 'msg-3' });
  });
});
