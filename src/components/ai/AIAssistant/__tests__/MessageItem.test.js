import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

import MessageItem from '../components/messages/MessageItem';

// Mock child components to verify routing
jest.mock('../components/messages/EmailMessage', () => {
  return function MockEmailMessage() {
    return <div data-testid="email-message">EmailMessage</div>;
  };
});

jest.mock('../components/messages/TextDiffMessage', () => {
  return function MockTextDiffMessage() {
    return <div data-testid="text-diff-message">TextDiffMessage</div>;
  };
});

jest.mock('../components/messages/ScriptDiffMessage', () => {
  return function MockScriptDiffMessage() {
    return <div data-testid="script-diff-message">ScriptDiffMessage</div>;
  };
});

// The liveness flags are surfaced as data attributes: forwarding them to every branch that can
// render action buttons is what keeps a superseded gate from staying clickable, and a mock that
// swallowed the props would let a dropped `actionsDisabled` pass unnoticed.
jest.mock('../components/messages/BusinessAppMessage', () => {
  return function MockBusinessAppMessage({ onActionClick, actionsDisabled, actionsFrozen, actionsStale }) {
    return (
      <div
        data-testid="business-app-message"
        data-actions-disabled={String(actionsDisabled)}
        data-actions-frozen={String(actionsFrozen)}
        data-actions-stale={String(actionsStale)}
      >
        BusinessAppMessage
        <button data-testid="ba-skip" onClick={() => onActionClick?.('SKIP', { messageId: 'ba' })}>
          skip
        </button>
      </div>
    );
  };
});

jest.mock('../components/messages/AgentPlanMessage', () => {
  return function MockAgentPlanMessage({ actionsDisabled, actionsFrozen, actionsStale }) {
    return (
      <div
        data-testid="agent-plan-message"
        data-actions-disabled={String(actionsDisabled)}
        data-actions-frozen={String(actionsFrozen)}
        data-actions-stale={String(actionsStale)}
      >
        AgentPlanMessage
      </div>
    );
  };
});

jest.mock('../components/messages/AgentProgressMessage', () => {
  return function MockAgentProgressMessage() {
    return <div data-testid="agent-progress-message">AgentProgressMessage</div>;
  };
});

jest.mock('../components/messages/ContextArtifactsList', () => {
  return function MockContextArtifactsList({ contextArtifacts }) {
    if (!contextArtifacts || contextArtifacts.length === 0) return null;
    return <div data-testid="context-artifacts-list">ContextArtifactsList</div>;
  };
});

jest.mock('../components/messages/ArtifactsList', () => {
  return function MockArtifactsList({ artifacts }) {
    if (!artifacts || artifacts.length === 0) return null;
    return <div data-testid="artifacts-list">ArtifactsList</div>;
  };
});

jest.mock('../components/messages/DeployConfirmation', () => {
  return function MockDeployConfirmation({ actionsDisabled, actionsFrozen, actionsStale }) {
    return (
      <div
        data-testid="deploy-confirmation"
        data-actions-disabled={String(actionsDisabled)}
        data-actions-frozen={String(actionsFrozen)}
        data-actions-stale={String(actionsStale)}
      >
        DeployConfirmation
      </div>
    );
  };
});

jest.mock('@/components/common', () => ({
  Icon: ({ className }) => <i className={className} data-testid="icon" />
}));

jest.mock('../utils', () => ({
  ...jest.requireActual('../utils'),
  formatMessageTime: () => '12:00'
}));

describe('MessageItem', () => {
  const defaultProps = {
    message: { sender: 'ai', text: 'Hello', timestamp: Date.now() },
    markdownComponents: {}
  };

  it('renders default markdown message for plain text', () => {
    render(<MessageItem {...defaultProps} />);
    expect(screen.getByText('Hello')).toBeTruthy();
    expect(screen.queryByTestId('agent-plan-message')).toBeNull();
    expect(screen.queryByTestId('agent-progress-message')).toBeNull();
  });

  it('routes to AgentPlanMessage when isAgentPlanContent is true', () => {
    const message = {
      ...defaultProps.message,
      isAgentPlanContent: true,
      messageData: { agentStatus: 'WAITING_PLAN_APPROVAL', message: 'Plan' }
    };

    render(<MessageItem {...defaultProps} message={message} />);
    expect(screen.getByTestId('agent-plan-message')).toBeTruthy();
  });

  it('routes to AgentProgressMessage when isAgentProgressContent is true', () => {
    const message = {
      ...defaultProps.message,
      isAgentProgressContent: true,
      messageData: { type: 'agent_execution', completedSteps: 1, totalSteps: 3 }
    };

    render(<MessageItem {...defaultProps} message={message} />);
    expect(screen.getByTestId('agent-progress-message')).toBeTruthy();
  });

  // D-B-7: the plan/tool-step card renders only from messageData, so a failed turn showed no reason
  // at all — the steps just stopped. Keep the trace visible and state why it stopped.
  it('shows the failure reason under the agent progress card, keeping the step trace', () => {
    const message = {
      ...defaultProps.message,
      isAgentProgressContent: true,
      isError: true,
      text: 'Запрос потерян',
      messageData: { type: 'agent_execution', completedSteps: 1, totalSteps: 3 }
    };

    render(<MessageItem {...defaultProps} message={message} />);

    expect(screen.getByTestId('agent-progress-message')).toBeTruthy();
    expect(screen.getByText('Запрос потерян')).toBeTruthy();
  });

  it('shows no failure note while the agent card is still progressing', () => {
    const message = {
      ...defaultProps.message,
      isAgentProgressContent: true,
      text: 'Запрос обрабатывается',
      messageData: { type: 'agent_execution', completedSteps: 1, totalSteps: 3 }
    };

    render(<MessageItem {...defaultProps} message={message} />);

    expect(screen.queryByText('Запрос обрабатывается')).toBeNull();
  });

  it('routes to EmailMessage when isEmailContent is true', () => {
    const message = {
      ...defaultProps.message,
      isEmailContent: true,
      messageData: { subject: 'Test' }
    };

    render(<MessageItem {...defaultProps} message={message} />);
    expect(screen.getByTestId('email-message')).toBeTruthy();
  });

  it('routes to BusinessAppMessage when isBusinessAppContent is true', () => {
    const message = {
      ...defaultProps.message,
      isBusinessAppContent: true,
      messageData: { stage: 'generating' }
    };

    render(<MessageItem {...defaultProps} message={message} />);
    expect(screen.getByTestId('business-app-message')).toBeTruthy();
  });

  it('threads onActionClick into BusinessAppMessage (clarifying-questions SKIP/CANCEL)', () => {
    const onActionClick = jest.fn();
    const message = {
      ...defaultProps.message,
      isBusinessAppContent: true,
      messageData: {
        stage: 'CLARIFYING_QUESTIONS',
        actions: [{ id: 'SKIP', label: 'Пропустить', style: 'default' }]
      }
    };

    render(<MessageItem {...defaultProps} message={message} onActionClick={onActionClick} />);
    fireEvent.click(screen.getByTestId('ba-skip'));
    expect(onActionClick).toHaveBeenCalledWith('SKIP', { messageId: 'ba' });
  });

  describe('forwards the gate liveness flags to every branch that renders action buttons', () => {
    const branches = [
      ['agent-plan-message', { isAgentPlanContent: true, messageData: { agentStatus: 'WAITING_PLAN_APPROVAL', message: 'Plan' } }],
      ['business-app-message', { isBusinessAppContent: true, messageData: { stage: 'CLARIFYING_QUESTIONS' } }],
      ['deploy-confirmation', { messageData: { pendingDeploy: { artifactType: 'FORM' } } }]
    ];

    it.each(branches)('%s receives both flags', (testId, messageExtra) => {
      const message = { ...defaultProps.message, ...messageExtra };

      render(<MessageItem {...defaultProps} message={message} actionsDisabled actionsFrozen />);

      const node = screen.getByTestId(testId);
      expect(node.getAttribute('data-actions-disabled')).toBe('true');
      expect(node.getAttribute('data-actions-frozen')).toBe('true');
    });

    it.each(branches)('%s receives a live gate as not disabled', (testId, messageExtra) => {
      const message = { ...defaultProps.message, ...messageExtra };

      render(<MessageItem {...defaultProps} message={message} />);

      const node = screen.getByTestId(testId);
      expect(node.getAttribute('data-actions-disabled')).toBe('false');
      expect(node.getAttribute('data-actions-frozen')).toBe('false');
    });

    // Every branch reads this flag, because what a card *displays* follows gate liveness alone: the
    // deploy card decides between the draft selection and the scope it sent, the plan card between
    // showing and hiding its hint, and all of them mute their buttons by it. It is forwarded
    // separately from `actionsDisabled` so an in-flight request — which locks the buttons of every
    // gate, including ones it has nothing to do with — cannot make a card report a decision that
    // has not been taken.
    it.each(branches)('%s receives staleness apart from the in-flight freeze', (testId, messageExtra) => {
      const message = { ...defaultProps.message, ...messageExtra };

      const { rerender } = render(<MessageItem {...defaultProps} message={message} actionsDisabled actionsFrozen />);
      expect(screen.getByTestId(testId).getAttribute('data-actions-stale')).toBe('false');

      rerender(<MessageItem {...defaultProps} message={message} actionsDisabled actionsStale />);
      expect(screen.getByTestId(testId).getAttribute('data-actions-stale')).toBe('true');
    });

    it('disables the action buttons of the default markdown branch', () => {
      const message = {
        ...defaultProps.message,
        messageData: { actions: [{ id: 'gate_confirm', label: 'Подтвердить', style: 'primary' }] }
      };

      const { rerender } = render(<MessageItem {...defaultProps} message={message} actionsDisabled />);
      expect(screen.getByText('Подтвердить').closest('button').disabled).toBe(true);

      rerender(<MessageItem {...defaultProps} message={message} />);
      expect(screen.getByText('Подтвердить').closest('button').disabled).toBe(false);
    });

    it('mutes the default markdown branch by staleness, not by the in-flight freeze', () => {
      const message = {
        ...defaultProps.message,
        messageData: { actions: [{ id: 'gate_confirm', label: 'Подтвердить', style: 'primary' }] }
      };

      const { rerender } = render(<MessageItem {...defaultProps} message={message} actionsDisabled actionsFrozen />);
      const frozen = screen.getByText('Подтвердить').closest('button');
      expect(frozen.disabled).toBe(true);
      expect(frozen.className).not.toContain('ai-assistant-chat__action-button--stale');

      rerender(<MessageItem {...defaultProps} message={message} actionsDisabled actionsStale />);
      const stale = screen.getByText('Подтвердить').closest('button');
      expect(stale.disabled).toBe(true);
      expect(stale.className).toContain('ai-assistant-chat__action-button--stale');
    });
  });

  it('applies agent-plan CSS class when isAgentPlanContent is true', () => {
    const message = {
      ...defaultProps.message,
      isAgentPlanContent: true,
      messageData: { agentStatus: 'COMPLETED', message: 'Done' }
    };

    const { container } = render(<MessageItem {...defaultProps} message={message} />);
    expect(container.firstChild.classList.contains('ai-assistant-chat__message--agent-plan')).toBe(true);
  });

  it('applies agent-progress CSS class when isAgentProgressContent is true', () => {
    const message = {
      ...defaultProps.message,
      isAgentProgressContent: true,
      messageData: { type: 'agent_planning' }
    };

    const { container } = render(<MessageItem {...defaultProps} message={message} />);
    expect(container.firstChild.classList.contains('ai-assistant-chat__message--agent-progress')).toBe(true);
  });

  it('does not apply agent CSS classes for regular messages', () => {
    const { container } = render(<MessageItem {...defaultProps} />);
    expect(container.firstChild.classList.contains('ai-assistant-chat__message--agent-plan')).toBe(false);
    expect(container.firstChild.classList.contains('ai-assistant-chat__message--agent-progress')).toBe(false);
  });

  it('agent plan takes priority over agent progress when both flags are set', () => {
    const message = {
      ...defaultProps.message,
      isAgentPlanContent: true,
      isAgentProgressContent: true,
      messageData: { agentStatus: 'COMPLETED', message: 'Done' }
    };

    render(<MessageItem {...defaultProps} message={message} />);
    expect(screen.getByTestId('agent-plan-message')).toBeTruthy();
    expect(screen.queryByTestId('agent-progress-message')).toBeNull();
  });

  // Backward compatibility: existing message types still work
  it('routes to TextDiffMessage when isTextDiffContent is true', () => {
    const message = {
      ...defaultProps.message,
      isTextDiffContent: true,
      messageData: { original: 'a', modified: 'b' }
    };

    render(<MessageItem {...defaultProps} message={message} />);
    expect(screen.getByTestId('text-diff-message')).toBeTruthy();
  });

  it('renders ContextArtifactsList for regular message with contextArtifacts', () => {
    const message = {
      ...defaultProps.message,
      messageData: {
        contextArtifacts: [{ ref: 'emodel/type@employee', displayName: 'Сотрудник', type: 'DATA_TYPE' }]
      }
    };

    render(<MessageItem {...defaultProps} message={message} />);
    expect(screen.getByText('Hello')).toBeTruthy();
    expect(screen.getByTestId('context-artifacts-list')).toBeTruthy();
  });

  it('does not render ContextArtifactsList for regular message without contextArtifacts', () => {
    render(<MessageItem {...defaultProps} />);
    expect(screen.getByText('Hello')).toBeTruthy();
    expect(screen.queryByTestId('context-artifacts-list')).toBeNull();
  });

  it('renders ArtifactsList for a deploy-success message with artifacts', () => {
    const message = {
      ...defaultProps.message,
      messageData: {
        artifacts: [{ name: 'Regress Test Type', url: 'http://localhost/v2/dashboard?recordRef=uiserv/form@x', type: { name: 'FORM' } }]
      }
    };

    render(<MessageItem {...defaultProps} message={message} />);
    expect(screen.getByText('Hello')).toBeTruthy();
    expect(screen.getByTestId('artifacts-list')).toBeTruthy();
  });

  it('does not render ArtifactsList for a regular message without artifacts', () => {
    render(<MessageItem {...defaultProps} />);
    expect(screen.queryByTestId('artifacts-list')).toBeNull();
  });

  it('routes to DeployConfirmation when messageData has pendingDeploy', () => {
    const message = {
      ...defaultProps.message,
      messageData: {
        pendingDeploy: {
          artifactType: 'FORM',
          targetScope: { kind: 'GLOBAL', label: 'Будет создано глобально' },
          changeable: false
        }
      }
    };

    render(<MessageItem {...defaultProps} message={message} />);
    expect(screen.getByTestId('deploy-confirmation')).toBeTruthy();
  });

  it('applies deploy-confirm CSS class when pendingDeploy is present', () => {
    const message = {
      ...defaultProps.message,
      messageData: {
        pendingDeploy: { artifactType: 'FORM', targetScope: { kind: 'GLOBAL', label: 'x' }, changeable: false }
      }
    };

    const { container } = render(<MessageItem {...defaultProps} message={message} />);
    expect(container.firstChild.classList.contains('ai-assistant-chat__message--deploy-confirm')).toBe(true);
  });

  it('routes to ScriptDiffMessage when isScriptDiffContent is true', () => {
    const message = {
      ...defaultProps.message,
      isScriptDiffContent: true,
      messageData: { original: 'a', modified: 'b' }
    };

    render(<MessageItem {...defaultProps} message={message} />);
    expect(screen.getByTestId('script-diff-message')).toBeTruthy();
  });
});
