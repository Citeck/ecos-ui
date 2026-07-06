import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
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
    const { container } = render(
      <DeployConfirmation message={{ id: 'x', messageData: {} }} markdownComponents={markdownComponents} />
    );
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
    expect(onActionClick).toHaveBeenCalledWith('deploy_confirm', { messageId: 'msg-1', deployScope: { kind: 'GLOBAL' } });
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
      deployScope: { kind: 'WORKSPACE', workspaceId: 'ws-7' }
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
