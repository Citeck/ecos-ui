import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

import MessageList from '../components/MessageList';

jest.mock('@/components/common', () => ({
  Icon: ({ className }) => <i className={className} data-testid="icon" />
}));

jest.mock('@/helpers/export/util', () => ({
  t: key => key
}));

const buildMessage = (id, actions) => ({
  id,
  sender: 'ai',
  text: `text of ${id}`,
  timestamp: new Date('2026-07-30T10:00:00Z'),
  messageData: actions ? { actions } : undefined
});

// Ids outside ACTION_LABEL_KEYS keep the backend labels verbatim, so assertions can address a
// button by its text (the known ids CONFIRM/REJECT/file_cancel would render an i18n key instead).
const GATE_ACTIONS = [
  { id: 'gate_confirm', label: 'Подтвердить', style: 'primary' },
  { id: 'gate_reject', label: 'Отклонить', style: 'danger' }
];

const fileSaveActions = tempRef => [
  { id: `main_content|${tempRef}`, label: `Сохранить ${tempRef}`, style: 'primary' },
  { id: `attr:content|${tempRef}`, label: `В поле ${tempRef}`, style: 'default' }
];

// Client-side notice appended when an action POST fails; it reports a failure instead of
// advancing the dialog, so it must not supersede the gate in front of it.
const buildErrorNotice = id => ({
  id,
  sender: 'ai',
  text: 'ai-assistant.chat.action-error',
  timestamp: new Date('2026-07-30T10:00:00Z'),
  isError: true
});

// What `cancelRequest` / `handlePollingCancelled` write over the processing message when the user
// aborts a request: the turn was called off rather than completed, so it advances nothing.
const buildCancelledNotice = id => ({
  id,
  sender: 'ai',
  text: 'ai-assistant.chat.cancelled',
  timestamp: new Date('2026-07-30T10:00:00Z'),
  isCancelled: true
});

// Answer to a file save/cancel click: the backend resolves the file without routing the request to
// the agent, so the message reports the file and leaves the dialog exactly where it was.
const buildFileActionNotice = id => ({
  id,
  sender: 'ai',
  text: 'Файл сохранён.',
  timestamp: new Date('2026-07-30T10:00:00Z'),
  isFileActionNotice: true
});

const buildPlanGate = (id, agentStatus, actions) => ({
  id,
  sender: 'ai',
  text: '',
  timestamp: new Date('2026-07-30T10:00:00Z'),
  isAgentPlanContent: true,
  messageData: { agentStatus, message: `plan of ${id}`, ...(actions ? { actions } : {}) }
});

const renderList = (messages, extra = {}) =>
  render(
    <MessageList
      messages={messages}
      activeTab="universal"
      contextHint={null}
      markdownComponents={{}}
      isLoading={false}
      activeRequestId={null}
      messagesEndRef={React.createRef()}
      onActionClick={jest.fn()}
      {...extra}
    />
  );

const buttonByText = text => screen.getByText(text).closest('button');

describe('MessageList — liveness of action buttons', () => {
  it('keeps the buttons of the last message live and disables the ones of an earlier gate', () => {
    renderList([buildMessage('m1', GATE_ACTIONS), buildMessage('m2', GATE_ACTIONS)]);

    // Both gates use the same stable action ids, so we address them through their own message.
    const buttons = screen.getAllByText('Подтвердить').map(node => node.closest('button'));
    expect(buttons).toHaveLength(2);

    // Rendered in list order: the first message is superseded, the last one is still live.
    expect(buttons[0].disabled).toBe(true);
    expect(buttons[0].className).toContain('ai-assistant-chat__action-button--stale');
    expect(buttons[1].disabled).toBe(false);
    expect(buttons[1].className).not.toContain('ai-assistant-chat__action-button--stale');
  });

  it('keeps a pending file-save decision in the middle of the history live', () => {
    renderList([
      buildMessage('m1', fileSaveActions('temp-1')),
      buildMessage('m2', fileSaveActions('temp-2')),
      buildMessage('m3', GATE_ACTIONS)
    ]);

    // File-save actions are resource-scoped: several files may await a decision at once.
    expect(buttonByText('Сохранить temp-1').disabled).toBe(false);
    expect(buttonByText('В поле temp-1').disabled).toBe(false);
    expect(buttonByText('Сохранить temp-2').disabled).toBe(false);
    expect(buttonByText('Подтвердить').disabled).toBe(false);
  });

  it('disables every button, the last message included, while a request is in flight', () => {
    renderList([buildMessage('m1', fileSaveActions('temp-1')), buildMessage('m2', GATE_ACTIONS)], { isLoading: true });

    expect(buttonByText('Сохранить temp-1').disabled).toBe(true);
    expect(buttonByText('Подтвердить').disabled).toBe(true);
    expect(buttonByText('Отклонить').disabled).toBe(true);
  });

  it('keeps the file-save half of a superseded mixed set live while its gate half goes stale', () => {
    // The backend merges the Save/Cancel pair of a file proposed in a turn onto whatever gate that
    // turn produced, and never re-emits the pair on a later free-text turn — disabling the whole
    // set would leave the still-pending file with no way to be saved or cancelled.
    renderList([buildMessage('m1', [...GATE_ACTIONS, ...fileSaveActions('temp-1')]), buildMessage('m2')]);

    expect(buttonByText('Подтвердить').disabled).toBe(true);
    expect(buttonByText('Отклонить').disabled).toBe(true);
    expect(buttonByText('Сохранить temp-1').disabled).toBe(false);
    expect(buttonByText('В поле temp-1').disabled).toBe(false);
  });

  it('keeps the gate half of a mixed set live after the file half has been answered', () => {
    // The answer to a file click is a notice about that file — the backend short-circuits it before
    // the request reaches the agent. Counting it as a step of the dialog would disable the gate the
    // agent is still waiting on, leaving free text as the only way to answer it.
    const mixed = buildMessage('m1', [...GATE_ACTIONS, ...fileSaveActions('temp-1')]);
    mixed.messageData.resolvedFileTempRefs = ['temp-1'];

    renderList([mixed, buildFileActionNotice('m2')]);

    expect(buttonByText('Подтвердить').disabled).toBe(false);
    expect(buttonByText('Отклонить').disabled).toBe(false);
    // The file itself is decided, so its own pair is retired.
    expect(buttonByText('Сохранить temp-1').disabled).toBe(true);
    expect(buttonByText('В поле temp-1').disabled).toBe(true);
  });

  it('retires the pair of an answered file while the other pending file stays live', () => {
    // Full render path for the regression the per-button exemption used to open: once the save is
    // done the request is no longer in flight, so nothing but the recorded tempRef can stop the
    // resolved pair from becoming clickable again — against a temp file the backend already deleted.
    const withResolved = {
      ...buildMessage('m1', [...fileSaveActions('temp-1'), ...fileSaveActions('temp-2')]),
      messageData: {
        actions: [...fileSaveActions('temp-1'), ...fileSaveActions('temp-2')],
        resolvedFileTempRefs: ['temp-1']
      }
    };
    renderList([withResolved, buildMessage('m2')]);

    expect(buttonByText('Сохранить temp-1').disabled).toBe(true);
    expect(buttonByText('В поле temp-1').disabled).toBe(true);
    expect(buttonByText('Сохранить temp-2').disabled).toBe(false);
    expect(buttonByText('В поле temp-2').disabled).toBe(false);
  });

  it('retires the answered file half of a mixed set together with its stale gate half', () => {
    const mixed = [...GATE_ACTIONS, ...fileSaveActions('temp-1')];
    const withResolved = {
      ...buildMessage('m1', mixed),
      messageData: { actions: mixed, resolvedFileTempRefs: ['temp-1'] }
    };
    renderList([withResolved, buildMessage('m2')]);

    expect(buttonByText('Подтвердить').disabled).toBe(true);
    expect(buttonByText('Сохранить temp-1').disabled).toBe(true);
    expect(buttonByText('В поле temp-1').disabled).toBe(true);
  });

  it('freezes the file-save half of a mixed set too while a request is in flight', () => {
    renderList([buildMessage('m1', [...GATE_ACTIONS, ...fileSaveActions('temp-1')]), buildMessage('m2')], { isLoading: true });

    expect(buttonByText('Сохранить temp-1').disabled).toBe(true);
  });

  it('keeps a gate live when the only newer message is a failed-request notice', () => {
    // A failed action POST appends nothing but an error notice, so the same button must stay
    // pressable for a retry.
    renderList([buildMessage('m1', GATE_ACTIONS), buildErrorNotice('err-1')]);

    expect(buttonByText('Подтвердить').disabled).toBe(false);
    expect(buttonByText('Отклонить').disabled).toBe(false);
  });

  it('disables the gate again once a real message follows the failed-request notice', () => {
    renderList([buildMessage('m1', GATE_ACTIONS), buildErrorNotice('err-1'), buildMessage('m2')]);

    expect(buttonByText('Подтвердить').disabled).toBe(true);
  });

  it('keeps the gate half of a mixed set live after the user cancelled the file-save request', () => {
    // Clicking a file-save button is the one way to start a request without a user message in
    // front of it, so the processing message it appends is all that stands between the gate and
    // the end of the history. Cancelling that request turns it into a cancelled notice — the turn
    // was called off, the gate was never answered, and the agent is still waiting for it. Counting
    // it as progress left CONFIRM/REJECT dead with nothing but free text to recover.
    renderList([buildMessage('m1', [...GATE_ACTIONS, ...fileSaveActions('temp-1')]), buildCancelledNotice('cancel-1')]);

    expect(buttonByText('Подтвердить').disabled).toBe(false);
    expect(buttonByText('Отклонить').disabled).toBe(false);
  });

  it('disables the gate again once a real message follows the cancelled notice', () => {
    renderList([buildMessage('m1', GATE_ACTIONS), buildCancelledNotice('cancel-1'), buildMessage('m2')]);

    expect(buttonByText('Подтвердить').disabled).toBe(true);
  });
});

describe('MessageList — deploy scope draft', () => {
  const buildDeployGate = id => ({
    id,
    sender: 'ai',
    text: 'Готово к развёртыванию',
    timestamp: new Date('2026-07-30T10:00:00Z'),
    messageData: {
      actions: [{ id: 'gate_confirm', label: 'Подтвердить', style: 'primary' }],
      pendingDeploy: {
        artifactType: 'FORM',
        changeable: true,
        targetScope: { kind: 'GLOBAL', label: 'Глобально' },
        options: [
          { kind: 'GLOBAL', label: 'Глобально' },
          { kind: 'WORKSPACE', workspaceId: 'ws-7', label: 'В рабочем пространстве X' }
        ]
      }
    }
  });

  it('forwards the picked scope with the id of the message that owns the card', () => {
    const onSelectDeployScope = jest.fn();
    renderList([buildMessage('m1'), buildDeployGate('deploy-1')], { onSelectDeployScope });

    fireEvent.click(screen.getAllByRole('radio')[1]);

    expect(onSelectDeployScope).toHaveBeenCalledWith('deploy-1', 'WORKSPACE:ws-7');
  });

  it('renders the draft recorded on the message rather than the backend default', () => {
    // This is what the list looks like right after the chat window is restored: the card is built
    // from scratch, so the scope has to come off the message.
    const message = buildDeployGate('deploy-1');
    message.messageData.draftDeployScopeKey = 'WORKSPACE:ws-7';

    const { container } = renderList([message]);

    expect(container.querySelector('.ai-assistant-chat__deploy-confirm-scope-label').textContent).toBe('В рабочем пространстве X');
    expect(screen.getAllByRole('radio')[1].checked).toBe(true);
  });
});

describe('MessageList — hint of a gate that carries no buttons', () => {
  it('keeps the hint under a live plan gate', () => {
    renderList([buildPlanGate('p1', 'WAITING_PLAN_APPROVAL')]);

    expect(screen.getByText('ai-assistant.agent-plan.hint-waiting-plan')).toBeTruthy();
  });

  it('hides the hint once the dialog has moved past the gate', () => {
    // Regression: a WAITING_PLAN_APPROVAL card that arrived without buttons kept telling the user
    // «Подтвердите план...» long after the server had answered that the plan was cancelled.
    renderList([buildPlanGate('p1', 'WAITING_PLAN_APPROVAL'), buildMessage('m2')]);

    expect(screen.queryByText('ai-assistant.agent-plan.hint-waiting-plan')).toBeNull();
  });

  it('hides the hint of a superseded terminal FAILED card', () => {
    renderList([buildPlanGate('p1', 'FAILED'), buildMessage('m2')]);

    expect(screen.queryByText('ai-assistant.agent-plan.hint-failed')).toBeNull();
  });

  it('keeps the hint when the only newer message is a failed-request notice', () => {
    renderList([buildPlanGate('p1', 'WAITING_PLAN_APPROVAL'), buildErrorNotice('err-1')]);

    expect(screen.getByText('ai-assistant.agent-plan.hint-waiting-plan')).toBeTruthy();
  });

  it('keeps the hint of a still-waiting gate while a request is in flight', () => {
    // The freeze locks every gate for the length of the round trip, this one included. It says
    // nothing about whether the gate has been answered, so hiding the hint on it would blink the
    // only instruction the user has off the screen and then back on.
    renderList([buildPlanGate('p1', 'WAITING_PLAN_APPROVAL')], { isLoading: true });

    expect(screen.getByText('ai-assistant.agent-plan.hint-waiting-plan')).toBeTruthy();
  });
});
