import React from 'react';
import { render, screen } from '@testing-library/react';
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

jest.mock('../components/messages/BusinessAppMessage', () => {
  return function MockBusinessAppMessage() {
    return <div data-testid="business-app-message">BusinessAppMessage</div>;
  };
});

jest.mock('../components/messages/AgentPlanMessage', () => {
  return function MockAgentPlanMessage() {
    return <div data-testid="agent-plan-message">AgentPlanMessage</div>;
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

jest.mock('../../common', () => ({
  Icon: ({ className }) => <i className={className} data-testid="icon" />
}));

jest.mock('../utils', () => ({
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
        contextArtifacts: [
          { ref: 'emodel/type@employee', displayName: 'Сотрудник', type: 'DATA_TYPE' }
        ]
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
