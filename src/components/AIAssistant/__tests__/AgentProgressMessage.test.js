import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AgentProgressMessage from '../components/messages/AgentProgressMessage';

// Mock Icon component
jest.mock('../../common', () => ({
  Icon: ({ className }) => <i className={className} data-testid="icon" />
}));

// Mock react-markdown
jest.mock('react-markdown', () => {
  return ({ children }) => <div data-testid="markdown-content">{children}</div>;
});

// Mock remark-gfm
jest.mock('remark-gfm', () => {
  return () => {};
});

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

    it('shows toggle icon for completed step with output', () => {
      const message = {
        messageData: {
          type: 'agent_execution',
          completedSteps: 1,
          totalSteps: 1,
          overallProgress: 100,
          steps: [
            { id: 'step-1', description: 'Create data type', status: 'COMPLETED', output: 'Generated YAML content' }
          ]
        }
      };

      render(<AgentProgressMessage message={message} />);

      const icons = screen.getAllByTestId('icon');
      const toggleIcon = icons.find(icon => icon.className.includes('fa-chevron-down'));
      expect(toggleIcon).toBeTruthy();
    });

    it('does not show toggle icon for pending step', () => {
      const message = {
        messageData: {
          type: 'agent_execution',
          completedSteps: 0,
          totalSteps: 1,
          overallProgress: 0,
          steps: [
            { id: 'step-1', description: 'Create data type', status: 'PENDING', output: 'some output' }
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

    it('expands step details on click and shows output via Markdown', () => {
      const message = {
        messageData: {
          type: 'agent_execution',
          completedSteps: 1,
          totalSteps: 1,
          overallProgress: 100,
          steps: [
            { id: 'step-1', description: 'Create data type', status: 'COMPLETED', output: 'id: my-type\nname: My Type' }
          ]
        }
      };

      const { container } = render(<AgentProgressMessage message={message} />);

      // Output should not be visible initially
      expect(container.querySelector('.ai-assistant-chat__agent-step-details')).toBeNull();

      // Click the step header to expand
      const stepHeader = container.querySelector('.ai-assistant-chat__agent-step-header--expandable');
      fireEvent.click(stepHeader);

      // Output should now be visible rendered through Markdown
      expect(container.querySelector('.ai-assistant-chat__agent-step-details')).toBeTruthy();
      const preview = container.querySelector('.ai-assistant-chat__agent-step-preview');
      expect(preview).toBeTruthy();
      const markdownEl = screen.getByTestId('markdown-content');
      expect(markdownEl.textContent).toBe('id: my-type\nname: My Type');

      // Toggle icon should change to chevron-up
      const icons = screen.getAllByTestId('icon');
      const upIcon = icons.find(icon => icon.className.includes('fa-chevron-up'));
      expect(upIcon).toBeTruthy();
    });

    it('collapses step details on second click', () => {
      const message = {
        messageData: {
          type: 'agent_execution',
          completedSteps: 1,
          totalSteps: 1,
          overallProgress: 100,
          steps: [
            { id: 'step-1', description: 'Create data type', status: 'COMPLETED', output: 'Generated content' }
          ]
        }
      };

      const { container } = render(<AgentProgressMessage message={message} />);

      const stepHeader = container.querySelector('.ai-assistant-chat__agent-step-header--expandable');

      // Click to expand
      fireEvent.click(stepHeader);
      expect(container.querySelector('.ai-assistant-chat__agent-step-details')).toBeTruthy();

      // Click again to collapse
      fireEvent.click(stepHeader);
      expect(container.querySelector('.ai-assistant-chat__agent-step-details')).toBeNull();
    });

    it('shows "Показать" button for completed step with output', () => {
      const message = {
        messageData: {
          type: 'agent_execution',
          completedSteps: 1,
          totalSteps: 1,
          overallProgress: 100,
          steps: [
            { id: 'step-1', description: 'Create data type', status: 'COMPLETED', output: 'Generated YAML' }
          ]
        }
      };

      const { container } = render(<AgentProgressMessage message={message} />);

      const toggleBtn = container.querySelector('.ai-assistant-chat__agent-step-preview-toggle');
      expect(toggleBtn).toBeTruthy();
      expect(toggleBtn.textContent).toContain('Показать');
    });

    it('changes button text to "Скрыть" when expanded', () => {
      const message = {
        messageData: {
          type: 'agent_execution',
          completedSteps: 1,
          totalSteps: 1,
          overallProgress: 100,
          steps: [
            { id: 'step-1', description: 'Create data type', status: 'COMPLETED', output: 'Generated YAML' }
          ]
        }
      };

      const { container } = render(<AgentProgressMessage message={message} />);

      const toggleBtn = container.querySelector('.ai-assistant-chat__agent-step-preview-toggle');

      // Click to expand
      fireEvent.click(toggleBtn);
      expect(toggleBtn.textContent).toContain('Скрыть');

      // Click to collapse
      fireEvent.click(toggleBtn);
      expect(toggleBtn.textContent).toContain('Показать');
    });

    it('does not show preview toggle for steps without output', () => {
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

      const { container } = render(<AgentProgressMessage message={message} />);

      expect(container.querySelector('.ai-assistant-chat__agent-step-preview-toggle')).toBeNull();
    });

    it('renders output through Markdown component', () => {
      const yamlOutput = '```yaml\nid: my-type\nname: My Type\n```';
      const message = {
        messageData: {
          type: 'agent_execution',
          completedSteps: 1,
          totalSteps: 1,
          overallProgress: 100,
          steps: [
            { id: 'step-1', description: 'Create data type', status: 'COMPLETED', output: yamlOutput }
          ]
        }
      };

      const { container } = render(<AgentProgressMessage message={message} />);

      // Expand the step
      const toggleBtn = container.querySelector('.ai-assistant-chat__agent-step-preview-toggle');
      fireEvent.click(toggleBtn);

      // Verify Markdown component is used
      const markdownEl = screen.getByTestId('markdown-content');
      expect(markdownEl).toBeTruthy();
      expect(markdownEl.textContent).toBe(yamlOutput);
    });

    it('preview has max-height container', () => {
      const message = {
        messageData: {
          type: 'agent_execution',
          completedSteps: 1,
          totalSteps: 1,
          overallProgress: 100,
          steps: [
            { id: 'step-1', description: 'Create data type', status: 'COMPLETED', output: 'Some output content' }
          ]
        }
      };

      const { container } = render(<AgentProgressMessage message={message} />);

      // Expand
      const toggleBtn = container.querySelector('.ai-assistant-chat__agent-step-preview-toggle');
      fireEvent.click(toggleBtn);

      const preview = container.querySelector('.ai-assistant-chat__agent-step-preview');
      expect(preview).toBeTruthy();
    });

    it('shows toggle and error for failed step with error and output', () => {
      const message = {
        messageData: {
          type: 'agent_execution',
          completedSteps: 0,
          totalSteps: 1,
          overallProgress: 0,
          steps: [
            {
              id: 'step-1',
              description: 'Generate form',
              status: 'FAILED',
              error: 'Schema validation error',
              output: 'Partial output before failure'
            }
          ]
        }
      };

      const { container } = render(<AgentProgressMessage message={message} />);

      // Error should be visible immediately
      expect(screen.getByText('Schema validation error')).toBeTruthy();

      // Toggle should be present (failed step with output is expandable)
      const stepHeader = container.querySelector('.ai-assistant-chat__agent-step-header--expandable');
      expect(stepHeader).toBeTruthy();

      // Click toggle button to expand and see output via Markdown
      const toggleBtn = container.querySelector('.ai-assistant-chat__agent-step-preview-toggle');
      fireEvent.click(toggleBtn);
      const markdownEl = screen.getByTestId('markdown-content');
      expect(markdownEl.textContent).toBe('Partial output before failure');
    });

    it('does not render step header as expandable when no output or error', () => {
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

      const { container } = render(<AgentProgressMessage message={message} />);

      expect(container.querySelector('.ai-assistant-chat__agent-step-header--expandable')).toBeNull();
    });
  });
});
