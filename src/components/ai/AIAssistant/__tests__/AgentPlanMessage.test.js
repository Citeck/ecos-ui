import { render, screen } from '@testing-library/react';
import React from 'react';

import AgentPlanMessage from '../components/messages/AgentPlanMessage';
import { AGENT_STATUSES } from '../types';

// Mock Icon component
jest.mock('@/components/common', () => ({
  Icon: ({ className }) => <i className={className} data-testid="icon" />
}));

describe('AgentPlanMessage', () => {
  const markdownComponents = {};

  it('returns null when messageData is missing', () => {
    const { container } = render(<AgentPlanMessage message={{ text: 'test' }} markdownComponents={markdownComponents} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders markdown content for WAITING_PLAN_APPROVAL', () => {
    const message = {
      messageData: {
        agentStatus: AGENT_STATUSES.WAITING_PLAN_APPROVAL,
        message: 'Plan content here'
      },
      text: 'fallback'
    };

    render(<AgentPlanMessage message={message} markdownComponents={markdownComponents} />);

    expect(screen.getByText('Plan content here')).toBeTruthy();
    expect(screen.getByText('ai-assistant.agent-plan.hint-waiting-plan')).toBeTruthy();
  });

  it('renders hint for WAITING_STEP_APPROVAL', () => {
    const message = {
      messageData: {
        agentStatus: AGENT_STATUSES.WAITING_STEP_APPROVAL,
        message: 'Step approval'
      },
      text: ''
    };

    render(<AgentPlanMessage message={message} markdownComponents={markdownComponents} />);

    expect(screen.getByText('ai-assistant.agent-plan.hint-waiting-step')).toBeTruthy();
  });

  it('renders artifacts for COMPLETED status', () => {
    const message = {
      messageData: {
        agentStatus: AGENT_STATUSES.COMPLETED,
        message: 'All done',
        artifacts: [
          { name: 'MyForm', url: '/form/1', type: { displayName: 'Form', icon: 'fa-wpforms' } },
          { name: 'MyType', url: '/type/1', type: { displayName: 'Data Type', icon: 'fa-database' } }
        ]
      },
      text: ''
    };

    render(<AgentPlanMessage message={message} markdownComponents={markdownComponents} />);

    expect(screen.getByText('All done')).toBeTruthy();
    expect(screen.getByText('ai-assistant.artifacts.title')).toBeTruthy();
    expect(screen.getByText('MyForm')).toBeTruthy();
    expect(screen.getByText('MyType')).toBeTruthy();
    expect(screen.getByText('Form')).toBeTruthy();
    expect(screen.getByText('Data Type')).toBeTruthy();
  });

  it('does not render artifacts for non-COMPLETED status', () => {
    const message = {
      messageData: {
        agentStatus: AGENT_STATUSES.WAITING_PLAN_APPROVAL,
        message: 'Plan',
        artifacts: [{ name: 'ShouldNotShow', url: '/x', type: { displayName: 'X', icon: 'fa-x' } }]
      },
      text: ''
    };

    render(<AgentPlanMessage message={message} markdownComponents={markdownComponents} />);

    expect(screen.queryByText('Созданные артефакты:')).toBeNull();
    expect(screen.queryByText('ShouldNotShow')).toBeNull();
  });

  it('renders error message for FAILED status', () => {
    const message = {
      messageData: {
        agentStatus: AGENT_STATUSES.FAILED,
        message: 'Something went wrong',
        error: 'Timeout exceeded'
      },
      text: ''
    };

    render(<AgentPlanMessage message={message} markdownComponents={markdownComponents} />);

    expect(screen.getByText('Something went wrong')).toBeTruthy();
    expect(screen.getByText('Timeout exceeded')).toBeTruthy();
    expect(screen.getByText('ai-assistant.agent-plan.hint-failed')).toBeTruthy();
  });

  it('does not render hint for COMPLETED status', () => {
    const message = {
      messageData: {
        agentStatus: AGENT_STATUSES.COMPLETED,
        message: 'Done'
      },
      text: ''
    };

    render(<AgentPlanMessage message={message} markdownComponents={markdownComponents} />);

    expect(screen.queryByText('ai-assistant.agent-plan.hint-waiting-plan')).toBeNull();
    expect(screen.queryByText('ai-assistant.agent-plan.hint-failed')).toBeNull();
  });

  it('renders ContextArtifactsList for WAITING_PLAN_APPROVAL with contextArtifacts', () => {
    const message = {
      messageData: {
        agentStatus: AGENT_STATUSES.WAITING_PLAN_APPROVAL,
        message: 'Here is the plan',
        contextArtifacts: [
          { ref: 'emodel/type@employee', displayName: 'Сотрудник', type: 'DATA_TYPE' },
          { ref: 'uiserv/form@employee', displayName: 'Форма сотрудника', type: 'FORM' }
        ]
      },
      text: ''
    };

    render(<AgentPlanMessage message={message} markdownComponents={markdownComponents} />);

    expect(screen.getByText('ai-assistant.context-artifacts.title')).toBeTruthy();
    expect(screen.getByText('Сотрудник')).toBeTruthy();
    expect(screen.getByText('Форма сотрудника')).toBeTruthy();
  });

  it('renders ContextArtifactsList for COMPLETED with contextArtifacts', () => {
    const message = {
      messageData: {
        agentStatus: AGENT_STATUSES.COMPLETED,
        message: 'Done',
        contextArtifacts: [{ ref: 'emodel/type@employee', displayName: 'Сотрудник', type: 'DATA_TYPE' }]
      },
      text: ''
    };

    render(<AgentPlanMessage message={message} markdownComponents={markdownComponents} />);

    expect(screen.getByText('ai-assistant.context-artifacts.title')).toBeTruthy();
    expect(screen.getByText('Сотрудник')).toBeTruthy();
  });

  it('does not render ContextArtifactsList without contextArtifacts', () => {
    const message = {
      messageData: {
        agentStatus: AGENT_STATUSES.WAITING_PLAN_APPROVAL,
        message: 'Plan without artifacts'
      },
      text: ''
    };

    render(<AgentPlanMessage message={message} markdownComponents={markdownComponents} />);

    expect(screen.getByText('Plan without artifacts')).toBeTruthy();
    expect(screen.queryByText('ai-assistant.context-artifacts.title')).toBeNull();
  });

  it('does not render ContextArtifactsList for FAILED status even with contextArtifacts', () => {
    const message = {
      messageData: {
        agentStatus: AGENT_STATUSES.FAILED,
        message: 'Failed',
        error: 'Something broke',
        contextArtifacts: [{ ref: 'emodel/type@employee', displayName: 'Сотрудник', type: 'DATA_TYPE' }]
      },
      text: ''
    };

    render(<AgentPlanMessage message={message} markdownComponents={markdownComponents} />);

    expect(screen.queryByText('ai-assistant.context-artifacts.title')).toBeNull();
  });

  describe('hint visibility depends on whether the gate is still live', () => {
    const planGate = (messageData = {}) => ({
      id: 'msg-plan',
      messageData: {
        agentStatus: AGENT_STATUSES.WAITING_PLAN_APPROVAL,
        message: 'Plan content here',
        ...messageData
      },
      text: ''
    });

    // 18 — live gate without buttons: the hint is the only instruction the user gets
    it('renders the hint for a live gate without actions', () => {
      render(<AgentPlanMessage message={planGate()} markdownComponents={markdownComponents} />);

      expect(screen.getByText('ai-assistant.agent-plan.hint-waiting-plan')).toBeTruthy();
    });

    // 19 — the decision on this very gate has been taken
    it('does not render the hint when the gate is marked actionsResolved', () => {
      render(<AgentPlanMessage message={planGate({ actionsResolved: true })} markdownComponents={markdownComponents} />);

      expect(screen.queryByText('ai-assistant.agent-plan.hint-waiting-plan')).toBeNull();
    });

    it('does not render the hint for a resolved gate that still keeps its actions', () => {
      const message = planGate({
        actionsResolved: true,
        actions: [{ id: 'REJECT', label: 'Отклонить' }]
      });

      render(<AgentPlanMessage message={message} markdownComponents={markdownComponents} actionsDisabled={true} />);

      expect(screen.queryByText('ai-assistant.agent-plan.hint-waiting-plan')).toBeNull();
    });

    // 20 — the dialog has moved past this gate (message is not the last one)
    it('does not render the hint when actions are disabled as stale', () => {
      render(<AgentPlanMessage message={planGate()} markdownComponents={markdownComponents} actionsDisabled={true} actionsStale={true} />);

      expect(screen.queryByText('ai-assistant.agent-plan.hint-waiting-plan')).toBeNull();
    });

    it('keeps the hint while a request freezes a gate that is still waiting', () => {
      // The freeze is raised for every gate as soon as any request starts, including one that has
      // nothing to do with this card (a file-save click on a merged set). The gate is still waiting
      // for its answer, so blinking the hint away for the length of that round trip would lie.
      render(
        <AgentPlanMessage
          message={planGate()}
          markdownComponents={markdownComponents}
          actionsDisabled={true}
          actionsFrozen={true}
          actionsStale={false}
        />
      );

      expect(screen.getByText('ai-assistant.agent-plan.hint-waiting-plan')).toBeTruthy();
    });

    // 21 — terminal message the server sends after a plan rejection: no hint in any state
    it.each([
      ['live', { actionsDisabled: false }],
      ['stale', { actionsDisabled: true }]
    ])('does not render any hint for a terminal COMPLETED message with an error (%s)', (_name, props) => {
      const message = {
        id: 'msg-terminal',
        messageData: {
          agentStatus: AGENT_STATUSES.COMPLETED,
          message: 'Выполнение плана отменено',
          error: true
        },
        text: ''
      };

      render(<AgentPlanMessage message={message} markdownComponents={markdownComponents} {...props} />);

      expect(screen.getByText('Выполнение плана отменено')).toBeTruthy();
      expect(screen.queryByText('ai-assistant.agent-plan.hint-waiting-plan')).toBeNull();
      expect(screen.queryByText('ai-assistant.agent-plan.hint-waiting-step')).toBeNull();
      expect(screen.queryByText('ai-assistant.agent-plan.hint-failed')).toBeNull();
    });

    it('does not render the hint for a resolved WAITING_STEP_APPROVAL gate', () => {
      const message = {
        id: 'msg-step',
        messageData: {
          agentStatus: AGENT_STATUSES.WAITING_STEP_APPROVAL,
          message: 'Step approval',
          actionsResolved: true
        },
        text: ''
      };

      render(<AgentPlanMessage message={message} markdownComponents={markdownComponents} />);

      expect(screen.queryByText('ai-assistant.agent-plan.hint-waiting-step')).toBeNull();
    });
  });

  it('falls back to text when messageData.message is empty', () => {
    const message = {
      messageData: {
        agentStatus: AGENT_STATUSES.WAITING_PLAN_APPROVAL
      },
      text: 'Fallback text'
    };

    render(<AgentPlanMessage message={message} markdownComponents={markdownComponents} />);

    expect(screen.getByText('Fallback text')).toBeTruthy();
  });
});
