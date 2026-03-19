import React from 'react';
import { render, screen } from '@testing-library/react';
import AgentPlanMessage from '../components/messages/AgentPlanMessage';
import { AGENT_STATUSES } from '../types';

// Mock Icon component
jest.mock('../../common', () => ({
  Icon: ({ className }) => <i className={className} data-testid="icon" />
}));

describe('AgentPlanMessage', () => {
  const markdownComponents = {};

  it('returns null when messageData is missing', () => {
    const { container } = render(
      <AgentPlanMessage message={{ text: 'test' }} markdownComponents={markdownComponents} />
    );
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
    expect(screen.getByText('Подтвердите план, предложите изменения или задайте вопросы')).toBeTruthy();
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

    expect(screen.getByText('Подтвердите или пропустите шаг')).toBeTruthy();
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
    expect(screen.getByText('Артефакты:')).toBeTruthy();
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
        artifacts: [
          { name: 'ShouldNotShow', url: '/x', type: { displayName: 'X', icon: 'fa-x' } }
        ]
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
    expect(screen.getByText('Повторить / Пропустить / Отменить')).toBeTruthy();
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

    expect(screen.queryByText('Подтвердите план')).toBeNull();
    expect(screen.queryByText('Повторить')).toBeNull();
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

    expect(screen.getByText('Связанные артефакты:')).toBeTruthy();
    expect(screen.getByText('Сотрудник')).toBeTruthy();
    expect(screen.getByText('Форма сотрудника')).toBeTruthy();
  });

  it('renders ContextArtifactsList for COMPLETED with contextArtifacts', () => {
    const message = {
      messageData: {
        agentStatus: AGENT_STATUSES.COMPLETED,
        message: 'Done',
        contextArtifacts: [
          { ref: 'emodel/type@employee', displayName: 'Сотрудник', type: 'DATA_TYPE' }
        ]
      },
      text: ''
    };

    render(<AgentPlanMessage message={message} markdownComponents={markdownComponents} />);

    expect(screen.getByText('Связанные артефакты:')).toBeTruthy();
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
    expect(screen.queryByText('Связанные артефакты:')).toBeNull();
  });

  it('does not render ContextArtifactsList for FAILED status even with contextArtifacts', () => {
    const message = {
      messageData: {
        agentStatus: AGENT_STATUSES.FAILED,
        message: 'Failed',
        error: 'Something broke',
        contextArtifacts: [
          { ref: 'emodel/type@employee', displayName: 'Сотрудник', type: 'DATA_TYPE' }
        ]
      },
      text: ''
    };

    render(<AgentPlanMessage message={message} markdownComponents={markdownComponents} />);

    expect(screen.queryByText('Связанные артефакты:')).toBeNull();
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
