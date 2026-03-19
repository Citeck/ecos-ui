import React from 'react';
import { render, screen } from '@testing-library/react';
import AgentProgressMessage from '../components/messages/AgentProgressMessage';

// Mock Icon component
jest.mock('../../common', () => ({
  Icon: ({ className }) => <i className={className} data-testid="icon" />
}));


describe('AgentProgressMessage', () => {
  it('returns null when messageData is missing', () => {
    const { container } = render(
      <AgentProgressMessage message={{ text: 'test' }} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('returns null for unknown progress type', () => {
    const message = {
      messageData: { type: 'unknown_type' }
    };
    const { container } = render(<AgentProgressMessage message={message} />);
    expect(container.firstChild).toBeNull();
  });

  describe('agent_planning', () => {
    it('renders spinner with planning text', () => {
      const message = {
        messageData: { type: 'agent_planning' }
      };

      render(<AgentProgressMessage message={message} />);

      expect(screen.getByText('Составляю план...')).toBeTruthy();
      const icons = screen.getAllByTestId('icon');
      const spinnerIcon = icons.find(icon => icon.className.includes('fa-spinner'));
      expect(spinnerIcon).toBeTruthy();
      expect(spinnerIcon.className).toContain('fa-spin');
    });
  });

  describe('agent_execution', () => {
    it('renders step counter and progress bar', () => {
      const message = {
        messageData: {
          type: 'agent_execution',
          completedSteps: 2,
          totalSteps: 5,
          overallProgress: 40
        }
      };

      render(<AgentProgressMessage message={message} />);

      expect(screen.getByText('Выполнение плана')).toBeTruthy();
      expect(screen.getByText('Шаг 2 из 5')).toBeTruthy();
    });

    it('renders progress bar with correct width', () => {
      const message = {
        messageData: {
          type: 'agent_execution',
          completedSteps: 3,
          totalSteps: 6,
          overallProgress: 50
        }
      };

      const { container } = render(<AgentProgressMessage message={message} />);

      const fill = container.querySelector('.ai-assistant-chat__agent-progress-fill');
      expect(fill).toBeTruthy();
      expect(fill.style.width).toBe('50%');
    });

    it('renders current step description', () => {
      const message = {
        messageData: {
          type: 'agent_execution',
          completedSteps: 1,
          totalSteps: 3,
          overallProgress: 33,
          currentStepDescription: 'Generating data type...'
        }
      };

      render(<AgentProgressMessage message={message} />);

      expect(screen.getByText('Generating data type...')).toBeTruthy();
    });

    it('does not render current step description when absent', () => {
      const message = {
        messageData: {
          type: 'agent_execution',
          completedSteps: 0,
          totalSteps: 3,
          overallProgress: 0
        }
      };

      const { container } = render(<AgentProgressMessage message={message} />);

      expect(container.querySelector('.ai-assistant-chat__agent-current-step')).toBeNull();
    });

    it('renders step checklist with correct status icons', () => {
      const message = {
        messageData: {
          type: 'agent_execution',
          completedSteps: 1,
          totalSteps: 3,
          overallProgress: 33,
          steps: [
            { id: 'step-1', description: 'Create data type', status: 'COMPLETED' },
            { id: 'step-2', description: 'Generate form', status: 'IN_PROGRESS' },
            { id: 'step-3', description: 'Deploy artifacts', status: 'PENDING' }
          ]
        }
      };

      render(<AgentProgressMessage message={message} />);

      expect(screen.getByText('Create data type')).toBeTruthy();
      expect(screen.getByText('Generate form')).toBeTruthy();
      expect(screen.getByText('Deploy artifacts')).toBeTruthy();

      const icons = screen.getAllByTestId('icon');
      // Header icon (fa-cog) + 3 step icons
      const stepIcons = icons.filter(icon =>
        icon.className.includes('fa-check-circle') ||
        icon.className.includes('fa-spinner') ||
        icon.className.includes('fa-circle-o')
      );
      expect(stepIcons.length).toBe(3);
    });

    it('renders FAILED step with correct icon', () => {
      const message = {
        messageData: {
          type: 'agent_execution',
          completedSteps: 1,
          totalSteps: 2,
          overallProgress: 50,
          steps: [
            { id: 'step-1', description: 'Create data type', status: 'COMPLETED' },
            { id: 'step-2', description: 'Generate form', status: 'FAILED' }
          ]
        }
      };

      render(<AgentProgressMessage message={message} />);

      const icons = screen.getAllByTestId('icon');
      const failedIcon = icons.find(icon => icon.className.includes('fa-times-circle'));
      expect(failedIcon).toBeTruthy();
    });

    it('renders SKIPPED step with correct icon', () => {
      const message = {
        messageData: {
          type: 'agent_execution',
          completedSteps: 1,
          totalSteps: 2,
          overallProgress: 100,
          steps: [
            { id: 'step-1', description: 'Create data type', status: 'COMPLETED' },
            { id: 'step-2', description: 'Optional step', status: 'SKIPPED' }
          ]
        }
      };

      render(<AgentProgressMessage message={message} />);

      const icons = screen.getAllByTestId('icon');
      const skippedIcon = icons.find(icon => icon.className.includes('fa-arrow-circle-right'));
      expect(skippedIcon).toBeTruthy();
    });

    it('does not render steps list when steps array is empty', () => {
      const message = {
        messageData: {
          type: 'agent_execution',
          completedSteps: 0,
          totalSteps: 0,
          overallProgress: 0,
          steps: []
        }
      };

      const { container } = render(<AgentProgressMessage message={message} />);

      expect(container.querySelector('.ai-assistant-chat__agent-steps-list')).toBeNull();
    });

    it('defaults to zero values when fields are missing', () => {
      const message = {
        messageData: {
          type: 'agent_execution'
        }
      };

      render(<AgentProgressMessage message={message} />);

      expect(screen.getByText('Шаг 0 из 0')).toBeTruthy();
    });

    // Enhanced step details tests (Task 10)

    it('shows execution time for completed steps', () => {
      const message = {
        messageData: {
          type: 'agent_execution',
          completedSteps: 1,
          totalSteps: 2,
          overallProgress: 50,
          steps: [
            { id: 'step-1', description: 'Create data type', status: 'COMPLETED', executionTime: '2.3s' },
            { id: 'step-2', description: 'Generate form', status: 'PENDING' }
          ]
        }
      };

      render(<AgentProgressMessage message={message} />);

      expect(screen.getByText('2.3s')).toBeTruthy();
    });

    it('does not show execution time for non-completed steps', () => {
      const message = {
        messageData: {
          type: 'agent_execution',
          completedSteps: 0,
          totalSteps: 1,
          overallProgress: 0,
          steps: [
            { id: 'step-1', description: 'Generate form', status: 'IN_PROGRESS', executionTime: '1.5s' }
          ]
        }
      };

      render(<AgentProgressMessage message={message} />);

      expect(screen.queryByText('1.5s')).toBeNull();
    });

    it('shows error message for failed steps', () => {
      const message = {
        messageData: {
          type: 'agent_execution',
          completedSteps: 1,
          totalSteps: 2,
          overallProgress: 50,
          steps: [
            { id: 'step-1', description: 'Create data type', status: 'COMPLETED' },
            { id: 'step-2', description: 'Generate form', status: 'FAILED', error: 'Validation failed: missing required fields' }
          ]
        }
      };

      render(<AgentProgressMessage message={message} />);

      expect(screen.getByText('Validation failed: missing required fields')).toBeTruthy();
    });

    it('does not show error for non-failed steps', () => {
      const message = {
        messageData: {
          type: 'agent_execution',
          completedSteps: 1,
          totalSteps: 1,
          overallProgress: 100,
          steps: [
            { id: 'step-1', description: 'Create data type', status: 'COMPLETED', error: 'some leftover error' }
          ]
        }
      };

      const { container } = render(<AgentProgressMessage message={message} />);

      expect(container.querySelector('.ai-assistant-chat__agent-step-error')).toBeNull();
    });

    it('does not show toggle icon for step without expandable content', () => {
      const message = {
        messageData: {
          type: 'agent_execution',
          completedSteps: 1,
          totalSteps: 1,
          overallProgress: 100,
          steps: [
            { id: 'step-1', description: 'Deploy artifacts', status: 'COMPLETED' }
          ]
        }
      };

      render(<AgentProgressMessage message={message} />);

      const icons = screen.getAllByTestId('icon');
      const toggleIcon = icons.find(icon =>
        icon.className.includes('fa-chevron-down') || icon.className.includes('fa-chevron-up')
      );
      expect(toggleIcon).toBeFalsy();
    });
  });
});
