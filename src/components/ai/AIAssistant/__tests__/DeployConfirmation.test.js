import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

import DeployConfirmation from '../components/messages/DeployConfirmation';

jest.mock('@/components/common', () => ({
  Icon: ({ className }) => <i className={className} data-testid="icon" />
}));

const CONFIRM = { id: 'deploy_confirm', label: 'Развернуть', style: 'primary' };
const REJECT = { id: 'deploy_reject', label: 'Отмена', style: 'default' };

const buildMessage = pendingDeploy => ({
  id: 'msg-1',
  text: 'Артефакт готов к развёртыванию.',
  messageData: {
    pendingDeploy,
    actions: [CONFIRM, REJECT]
  }
});

describe('DeployConfirmation', () => {
  const markdownComponents = {};

  it('returns null when pendingDeploy is missing', () => {
    const { container } = render(<DeployConfirmation message={{ id: 'x', messageData: {} }} markdownComponents={markdownComponents} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the global target scope label and no selector when not changeable', () => {
    const message = buildMessage({
      artifactType: 'FORM',
      targetScope: { kind: 'GLOBAL', label: 'Будет создано глобально' },
      changeable: false
    });

    render(<DeployConfirmation message={message} markdownComponents={markdownComponents} onActionClick={jest.fn()} />);

    expect(screen.getByText('Будет создано глобально')).toBeTruthy();
    expect(screen.getByText('Артефакт готов к развёртыванию.')).toBeTruthy();
    // No scope-change selector chrome when not changeable
    expect(screen.queryByText('ai-assistant.deploy.scope.change')).toBeNull();
  });

  it('renders a clickable link for a prior deployed artifact riding on the gate', () => {
    const message = buildMessage({
      artifactType: 'FORM',
      targetScope: { kind: 'GLOBAL', label: 'Будет создано глобально' },
      changeable: false
    });
    message.messageData.artifacts = [
      {
        name: 'Regress Test Type',
        url: 'http://localhost/v2/dashboard?recordRef=emodel/type@x',
        type: { displayName: 'Тип данных', icon: 'fa-database' }
      }
    ];

    render(<DeployConfirmation message={message} markdownComponents={markdownComponents} onActionClick={jest.fn()} />);

    const link = screen.getByText('Regress Test Type');
    expect(link).toBeTruthy();
    expect(link.getAttribute('href')).toBe('http://localhost/v2/dashboard?recordRef=emodel/type@x');
  });

  it('renders the workspace target scope label', () => {
    const message = buildMessage({
      artifactType: 'FORM',
      targetScope: { kind: 'WORKSPACE', workspaceId: 'ws-1', label: 'В рабочем пространстве Demo' },
      changeable: false
    });

    render(<DeployConfirmation message={message} markdownComponents={markdownComponents} onActionClick={jest.fn()} />);

    expect(screen.getByText('В рабочем пространстве Demo')).toBeTruthy();
  });

  it('hides the selector when changeable but only one option is available', () => {
    const message = buildMessage({
      artifactType: 'FORM',
      targetScope: { kind: 'GLOBAL', label: 'Глобально' },
      changeable: true,
      options: [{ kind: 'GLOBAL', label: 'Глобально' }]
    });

    render(<DeployConfirmation message={message} markdownComponents={markdownComponents} onActionClick={jest.fn()} />);

    expect(screen.queryByText('ai-assistant.deploy.scope.change')).toBeNull();
  });

  it('shows the scope selector with options when changeable', () => {
    const message = buildMessage({
      artifactType: 'FORM',
      targetScope: { kind: 'WORKSPACE', workspaceId: 'ws-1', label: 'В рабочем пространстве Demo' },
      changeable: true,
      options: [
        { kind: 'WORKSPACE', workspaceId: 'ws-1', label: 'В рабочем пространстве Demo' },
        { kind: 'GLOBAL', label: 'Глобально' }
      ]
    });

    render(<DeployConfirmation message={message} markdownComponents={markdownComponents} onActionClick={jest.fn()} />);

    expect(screen.getByText('ai-assistant.deploy.scope.change')).toBeTruthy();
    expect(screen.getByText('Глобально')).toBeTruthy();
    const radios = screen.getAllByRole('radio');
    expect(radios.length).toBe(2);
    // Default selection mirrors targetScope (the workspace option)
    expect(radios[0].checked).toBe(true);
    expect(radios[1].checked).toBe(false);
  });

  it('sends the default (target) scope on confirm', () => {
    const onActionClick = jest.fn();
    const message = buildMessage({
      artifactType: 'FORM',
      targetScope: { kind: 'GLOBAL', label: 'Глобально' },
      changeable: false
    });

    render(<DeployConfirmation message={message} markdownComponents={markdownComponents} onActionClick={onActionClick} />);

    fireEvent.click(screen.getByText('Развернуть'));
    expect(onActionClick).toHaveBeenCalledWith('deploy_confirm', {
      messageId: 'msg-1',
      deployScope: { kind: 'GLOBAL' },
      deployScopeOption: { kind: 'GLOBAL', label: 'Глобально' }
    });
  });

  it('sends the newly selected workspace scope (with workspaceId) on confirm', () => {
    const onActionClick = jest.fn();
    const message = buildMessage({
      artifactType: 'FORM',
      targetScope: { kind: 'GLOBAL', label: 'Глобально' },
      changeable: true,
      options: [
        { kind: 'GLOBAL', label: 'Глобально' },
        { kind: 'WORKSPACE', workspaceId: 'ws-7', label: 'В рабочем пространстве X' }
      ]
    });

    render(<DeployConfirmation message={message} markdownComponents={markdownComponents} onActionClick={onActionClick} />);

    const radios = screen.getAllByRole('radio');
    fireEvent.click(radios[1]); // pick the workspace option
    fireEvent.click(screen.getByText('Развернуть'));

    expect(onActionClick).toHaveBeenCalledWith('deploy_confirm', {
      messageId: 'msg-1',
      deployScope: { kind: 'WORKSPACE', workspaceId: 'ws-7' },
      deployScopeOption: { kind: 'WORKSPACE', workspaceId: 'ws-7', label: 'В рабочем пространстве X' }
    });
  });

  it('updates the displayed scope label when a different option is selected', () => {
    const message = buildMessage({
      artifactType: 'FORM',
      targetScope: { kind: 'GLOBAL', label: 'Глобально' },
      changeable: true,
      options: [
        { kind: 'GLOBAL', label: 'Глобально' },
        { kind: 'WORKSPACE', workspaceId: 'ws-7', label: 'В рабочем пространстве X' }
      ]
    });

    const { container } = render(
      <DeployConfirmation message={message} markdownComponents={markdownComponents} onActionClick={jest.fn()} />
    );

    const scopeLabel = container.querySelector('.ai-assistant-chat__deploy-confirm-scope-label');
    expect(scopeLabel.textContent).toBe('Глобально');

    fireEvent.click(screen.getAllByRole('radio')[1]); // pick the workspace option
    expect(scopeLabel.textContent).toBe('В рабочем пространстве X');
  });

  it('locks the scope selector together with the buttons once the gate is no longer live', () => {
    // Without this the scope shown next to a resolved gate could be changed after the fact and
    // would no longer be the one that was actually sent to the backend.
    const onActionClick = jest.fn();
    const message = buildMessage({
      artifactType: 'FORM',
      targetScope: { kind: 'GLOBAL', label: 'Глобально' },
      changeable: true,
      options: [
        { kind: 'GLOBAL', label: 'Глобально' },
        { kind: 'WORKSPACE', workspaceId: 'ws-7', label: 'В рабочем пространстве X' }
      ]
    });

    const { container } = render(
      <DeployConfirmation
        message={message}
        markdownComponents={markdownComponents}
        onActionClick={onActionClick}
        actionsDisabled
        actionsStale
      />
    );

    // The `disabled` attribute is what stops the browser from delivering the click; a synthetic
    // `fireEvent.click` bypasses it (React derives onChange from a dispatched click for radios),
    // so the attribute and the muted styling are what this asserts.
    const radios = screen.getAllByRole('radio');
    radios.forEach(radio => expect(radio.disabled).toBe(true));
    expect(container.querySelectorAll('.ai-assistant-chat__deploy-confirm-option--stale')).toHaveLength(radios.length);

    screen.getAllByRole('button').forEach(button => expect(button.disabled).toBe(true));
    fireEvent.click(screen.getByText('Развернуть'));
    expect(onActionClick).not.toHaveBeenCalled();
  });

  it('locks but does not mute the scope selector while an unrelated request is in flight', () => {
    // The freeze (`actionsDisabled` without `actionsStale`) is transient and says nothing about
    // this gate: the card is still live and undecided, so it must not render itself as resolved
    // for the length of someone else's round trip. Interactivity follows the freeze, display
    // follows staleness — the same split MessageList documents for every card.
    const message = buildMessage({
      artifactType: 'FORM',
      targetScope: { kind: 'GLOBAL', label: 'Глобально' },
      changeable: true,
      options: [
        { kind: 'GLOBAL', label: 'Глобально' },
        { kind: 'WORKSPACE', workspaceId: 'ws-7', label: 'В рабочем пространстве X' }
      ]
    });

    const { container } = render(
      <DeployConfirmation
        message={message}
        markdownComponents={markdownComponents}
        onActionClick={jest.fn()}
        actionsDisabled
        actionsFrozen
      />
    );

    screen.getAllByRole('radio').forEach(radio => expect(radio.disabled).toBe(true));
    expect(container.querySelector('.ai-assistant-chat__deploy-confirm-option--stale')).toBeNull();
  });

  it('falls back to the backend target scope when the gate goes stale without a confirm', () => {
    // The gate can be answered without touching this card (free text, a newer gate). The selection
    // made here was never sent, so freezing it would claim a deploy target that was never used.
    const message = buildMessage({
      artifactType: 'FORM',
      targetScope: { kind: 'GLOBAL', label: 'Глобально' },
      changeable: true,
      options: [
        { kind: 'GLOBAL', label: 'Глобально' },
        { kind: 'WORKSPACE', workspaceId: 'ws-7', label: 'В рабочем пространстве X' }
      ]
    });

    const { container, rerender } = render(
      <DeployConfirmation message={message} markdownComponents={markdownComponents} onActionClick={jest.fn()} />
    );

    fireEvent.click(screen.getAllByRole('radio')[1]); // pick the workspace option, but never confirm
    expect(container.querySelector('.ai-assistant-chat__deploy-confirm-scope-label').textContent).toBe('В рабочем пространстве X');

    rerender(
      <DeployConfirmation
        message={message}
        markdownComponents={markdownComponents}
        onActionClick={jest.fn()}
        actionsDisabled
        actionsStale
      />
    );

    expect(container.querySelector('.ai-assistant-chat__deploy-confirm-scope-label').textContent).toBe('Глобально');
    expect(screen.getAllByRole('radio')[0].checked).toBe(true);
  });

  it('keeps the chosen scope on screen while the confirm request is still in flight', () => {
    // `handleActionClick` freezes every gate before the POST and only records `sentDeployScope`
    // once it returns. If the card read the freeze as "gate resolved" it would spend the whole
    // round trip reporting the backend default — the label flipping away from the scope the user
    // had just confirmed and the radio jumping back to the first option.
    const message = buildMessage({
      artifactType: 'FORM',
      targetScope: { kind: 'GLOBAL', label: 'Глобально' },
      changeable: true,
      options: [
        { kind: 'GLOBAL', label: 'Глобально' },
        { kind: 'WORKSPACE', workspaceId: 'ws-7', label: 'В рабочем пространстве X' }
      ]
    });

    const { container, rerender } = render(
      <DeployConfirmation message={message} markdownComponents={markdownComponents} onActionClick={jest.fn()} />
    );

    fireEvent.click(screen.getAllByRole('radio')[1]);

    // In flight: frozen and locked, but the gate itself is neither resolved nor superseded yet.
    rerender(
      <DeployConfirmation
        message={message}
        markdownComponents={markdownComponents}
        onActionClick={jest.fn()}
        actionsDisabled
        actionsFrozen
      />
    );

    expect(container.querySelector('.ai-assistant-chat__deploy-confirm-scope-label').textContent).toBe('В рабочем пространстве X');
    expect(screen.getAllByRole('radio')[1].checked).toBe(true);
    screen.getAllByRole('radio').forEach(radio => expect(radio.disabled).toBe(true));
  });

  it('keeps showing the confirmed scope after the gate is resolved', () => {
    const onActionClick = jest.fn();
    const message = buildMessage({
      artifactType: 'FORM',
      targetScope: { kind: 'GLOBAL', label: 'Глобально' },
      changeable: true,
      options: [
        { kind: 'GLOBAL', label: 'Глобально' },
        { kind: 'WORKSPACE', workspaceId: 'ws-7', label: 'В рабочем пространстве X' }
      ]
    });

    const { container, rerender } = render(
      <DeployConfirmation message={message} markdownComponents={markdownComponents} onActionClick={onActionClick} />
    );

    fireEvent.click(screen.getAllByRole('radio')[1]);
    fireEvent.click(screen.getByText('Развернуть'));
    const sentOption = onActionClick.mock.calls[0][1].deployScopeOption;
    expect(sentOption).toEqual({ kind: 'WORKSPACE', workspaceId: 'ws-7', label: 'В рабочем пространстве X' });

    // `handleActionClick` records the sent option on the message once the POST is accepted.
    const resolvedMessage = { ...message, messageData: { ...message.messageData, sentDeployScope: sentOption } };
    rerender(
      <DeployConfirmation
        message={resolvedMessage}
        markdownComponents={markdownComponents}
        onActionClick={onActionClick}
        actionsDisabled
        actionsStale
      />
    );

    expect(container.querySelector('.ai-assistant-chat__deploy-confirm-scope-label').textContent).toBe('В рабочем пространстве X');
    expect(screen.getAllByRole('radio')[1].checked).toBe(true);
  });

  it('still shows the sent scope after the card has been remounted', () => {
    // Minimizing the chat unmounts the whole message list (`AIAssistantChat`: `{!isMinimized && …}`),
    // so anything the card remembers in its own state is gone by the time the user restores it. The
    // sent scope has to survive that, or a resolved gate goes back to claiming the backend default.
    const sentDeployScope = { kind: 'WORKSPACE', workspaceId: 'ws-7', label: 'В рабочем пространстве X' };
    const message = buildMessage({
      artifactType: 'FORM',
      targetScope: { kind: 'GLOBAL', label: 'Глобально' },
      changeable: true,
      options: [
        { kind: 'GLOBAL', label: 'Глобально' },
        { kind: 'WORKSPACE', workspaceId: 'ws-7', label: 'В рабочем пространстве X' }
      ]
    });
    message.messageData.sentDeployScope = sentDeployScope;

    const { container } = render(
      <DeployConfirmation
        message={message}
        markdownComponents={markdownComponents}
        onActionClick={jest.fn()}
        actionsDisabled
        actionsStale
      />
    );

    expect(container.querySelector('.ai-assistant-chat__deploy-confirm-scope-label').textContent).toBe('В рабочем пространстве X');
    expect(screen.getAllByRole('radio')[1].checked).toBe(true);
  });

  it('reports the picked scope up so it can be recorded on the message', () => {
    const onSelectDeployScope = jest.fn();
    const message = buildMessage({
      artifactType: 'FORM',
      targetScope: { kind: 'GLOBAL', label: 'Глобально' },
      changeable: true,
      options: [
        { kind: 'GLOBAL', label: 'Глобально' },
        { kind: 'WORKSPACE', workspaceId: 'ws-7', label: 'В рабочем пространстве X' }
      ]
    });

    render(
      <DeployConfirmation
        message={message}
        markdownComponents={markdownComponents}
        onActionClick={jest.fn()}
        onSelectDeployScope={onSelectDeployScope}
      />
    );

    fireEvent.click(screen.getAllByRole('radio')[1]);

    expect(onSelectDeployScope).toHaveBeenCalledWith('msg-1', 'WORKSPACE:ws-7');
  });

  it('restores the draft scope after the card has been remounted', () => {
    // Same unmount as for the sent scope (minimizing the chat drops the message list), but for a
    // gate that is still live: the draft must come back, or the confirm below it would deploy to
    // the backend default the user had already changed away from.
    const message = buildMessage({
      artifactType: 'FORM',
      targetScope: { kind: 'GLOBAL', label: 'Глобально' },
      changeable: true,
      options: [
        { kind: 'GLOBAL', label: 'Глобально' },
        { kind: 'WORKSPACE', workspaceId: 'ws-7', label: 'В рабочем пространстве X' }
      ]
    });
    message.messageData.draftDeployScopeKey = 'WORKSPACE:ws-7';

    const onActionClick = jest.fn();
    const { container } = render(
      <DeployConfirmation message={message} markdownComponents={markdownComponents} onActionClick={onActionClick} />
    );

    expect(container.querySelector('.ai-assistant-chat__deploy-confirm-scope-label').textContent).toBe('В рабочем пространстве X');
    expect(screen.getAllByRole('radio')[1].checked).toBe(true);

    fireEvent.click(screen.getByText('Развернуть'));

    expect(onActionClick).toHaveBeenCalledWith(
      'deploy_confirm',
      expect.objectContaining({ deployScope: { kind: 'WORKSPACE', workspaceId: 'ws-7' } })
    );
  });

  it('keeps the scope selector usable while the gate is live', () => {
    const message = buildMessage({
      artifactType: 'FORM',
      targetScope: { kind: 'GLOBAL', label: 'Глобально' },
      changeable: true,
      options: [
        { kind: 'GLOBAL', label: 'Глобально' },
        { kind: 'WORKSPACE', workspaceId: 'ws-7', label: 'В рабочем пространстве X' }
      ]
    });

    const { container } = render(
      <DeployConfirmation message={message} markdownComponents={markdownComponents} onActionClick={jest.fn()} />
    );

    screen.getAllByRole('radio').forEach(radio => expect(radio.disabled).toBe(false));
    expect(container.querySelector('.ai-assistant-chat__deploy-confirm-option--stale')).toBeNull();
  });

  it('sends no scope on reject', () => {
    const onActionClick = jest.fn();
    const message = buildMessage({
      artifactType: 'FORM',
      targetScope: { kind: 'WORKSPACE', workspaceId: 'ws-1', label: 'В рабочем пространстве Demo' },
      changeable: true,
      options: [
        { kind: 'WORKSPACE', workspaceId: 'ws-1', label: 'В рабочем пространстве Demo' },
        { kind: 'GLOBAL', label: 'Глобально' }
      ]
    });

    render(<DeployConfirmation message={message} markdownComponents={markdownComponents} onActionClick={onActionClick} />);

    fireEvent.click(screen.getByText('Отмена'));
    expect(onActionClick).toHaveBeenCalledWith('deploy_reject', { messageId: 'msg-1' });
  });
});
