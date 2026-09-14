import { render, screen } from '@testing-library/react';
import React from 'react';

import AgentProgressMessage from '../components/messages/AgentProgressMessage';

// Mock Icon component
jest.mock('@/components/common', () => ({
  Icon: ({ className }) => <i className={className} data-testid="icon" />
}));

// Echo the key and, when given, its params (`key{"count":4}`) so assertions can see both.
jest.mock('@/helpers/export/util', () => ({
  t: (key, params) => (params ? `${key}${JSON.stringify(params)}` : key)
}));

describe('AgentProgressMessage', () => {
  it('returns null when messageData is missing', () => {
    const { container } = render(<AgentProgressMessage message={{ text: 'test' }} />);
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

      expect(screen.getByText('ai-assistant.agent-progress.planning')).toBeTruthy();
      const icons = screen.getAllByTestId('icon');
      const spinnerIcon = icons.find(icon => icon.className.includes('fa-spinner'));
      expect(spinnerIcon).toBeTruthy();
      expect(spinnerIcon.className).toContain('fa-spin');
    });

    // COREDEV-484: facts and attempt lines under the header, drawn only from what the backend sent
    const factsOf = container => container.querySelector('.ai-assistant-chat__agent-planning-facts');
    const attemptOf = container => container.querySelector('.ai-assistant-chat__agent-planning-attempt');

    it('renders only the header when the backend sent no planning facts (old backend)', () => {
      const { container } = render(<AgentProgressMessage message={{ messageData: { type: 'agent_planning' } }} />);

      expect(screen.getByText('ai-assistant.agent-progress.planning')).toBeTruthy();
      expect(factsOf(container)).toBeNull();
      expect(attemptOf(container)).toBeNull();
      expect(container.textContent).not.toContain('undefined');
    });

    it('renders spec-read, requirement count and requested kinds as one facts line', () => {
      const message = {
        messageData: {
          type: 'agent_planning',
          planning: { specRead: true, requirementCount: 4, requestedKinds: ['тип данных', 'форма', 'процесс'] }
        }
      };

      const { container } = render(<AgentProgressMessage message={message} />);

      const facts = factsOf(container).textContent;
      expect(facts).toBe(
        'ai-assistant.agent-progress.planning-spec-read' +
          ' \u00b7 ai-assistant.agent-progress.planning-requirements{"count":4}' +
          ' \u00b7 ai-assistant.agent-progress.planning-kinds{"kinds":"тип данных, форма, процесс"}'
      );
    });

    it('omits the spec-read fragment when specRead is false', () => {
      const message = {
        messageData: {
          type: 'agent_planning',
          planning: { specRead: false, requirementCount: 2, requestedKinds: ['форма'] }
        }
      };

      const { container } = render(<AgentProgressMessage message={message} />);

      const facts = factsOf(container).textContent;
      expect(facts).not.toContain('planning-spec-read');
      expect(facts).toContain('planning-requirements{"count":2}');
      expect(facts).toContain('planning-kinds{"kinds":"форма"}');
    });

    it('omits the kinds fragment when requestedKinds is empty', () => {
      const message = {
        messageData: {
          type: 'agent_planning',
          planning: { specRead: true, requirementCount: 3, requestedKinds: [] }
        }
      };

      const { container } = render(<AgentProgressMessage message={message} />);

      const facts = factsOf(container).textContent;
      expect(facts).toContain('planning-spec-read');
      expect(facts).toContain('planning-requirements{"count":3}');
      expect(facts).not.toContain('planning-kinds');
    });

    it('renders a zero requirement count as a fact (spec read, nothing extracted)', () => {
      const message = {
        messageData: { type: 'agent_planning', planning: { specRead: true, requirementCount: 0, requestedKinds: [] } }
      };

      const { container } = render(<AgentProgressMessage message={message} />);

      expect(factsOf(container).textContent).toBe(
        'ai-assistant.agent-progress.planning-spec-read \u00b7 ai-assistant.agent-progress.planning-requirements{"count":0}'
      );
    });

    it('renders no facts line for an empty planning object', () => {
      const { container } = render(<AgentProgressMessage message={{ messageData: { type: 'agent_planning', planning: {} } }} />);

      expect(factsOf(container)).toBeNull();
    });

    it('renders the attempt line on the last attempt (currentAttempt === maxAttempts)', () => {
      const message = {
        messageData: { type: 'agent_planning', currentAttempt: 3, maxAttempts: 3 }
      };

      const { container } = render(<AgentProgressMessage message={message} />);

      expect(attemptOf(container).textContent).toBe('ai-assistant.agent-progress.planning-attempt{"current":3,"total":3}');
    });

    it('does not render the attempt line without maxAttempts, even with a retry reason', () => {
      const message = {
        messageData: { type: 'agent_planning', currentAttempt: 2, retryReason: 'причина' }
      };

      const { container } = render(<AgentProgressMessage message={message} />);

      expect(attemptOf(container)).toBeNull();
      expect(container.textContent).not.toContain('причина');
    });

    it('renders "Attempt N of M: reason" from the second planner attempt on', () => {
      const message = {
        messageData: {
          type: 'agent_planning',
          currentAttempt: 2,
          maxAttempts: 3,
          retryReason: 'план не покрыл требование «уведомления»'
        }
      };

      const { container } = render(<AgentProgressMessage message={message} />);

      expect(attemptOf(container).textContent).toBe(
        'ai-assistant.agent-progress.planning-attempt{"current":2,"total":3}: план не покрыл требование «уведомления»'
      );
    });

    it('does not render the attempt line on the first attempt', () => {
      const message = {
        messageData: { type: 'agent_planning', currentAttempt: 1, maxAttempts: 3 }
      };

      const { container } = render(<AgentProgressMessage message={message} />);

      expect(attemptOf(container)).toBeNull();
    });

    it('renders the attempt line without a colon when there is no retry reason', () => {
      const message = {
        messageData: { type: 'agent_planning', currentAttempt: 2, maxAttempts: 3 }
      };

      const { container } = render(<AgentProgressMessage message={message} />);

      expect(attemptOf(container).textContent).toBe('ai-assistant.agent-progress.planning-attempt{"current":2,"total":3}');
    });

    it('hides facts and attempt lines when the turn failed (D-B-7)', () => {
      const message = {
        messageData: {
          type: 'agent_planning',
          error: true,
          currentAttempt: 2,
          maxAttempts: 3,
          retryReason: 'причина',
          planning: { specRead: true, requirementCount: 4, requestedKinds: ['форма'] }
        }
      };

      const { container } = render(<AgentProgressMessage message={message} />);

      expect(screen.getByText('ai-assistant.chat.request-failed')).toBeTruthy();
      expect(factsOf(container)).toBeNull();
      expect(attemptOf(container)).toBeNull();
    });
  });

  describe('agent_execution', () => {
    it('ignores planning fields copied onto an execution card', () => {
      const message = {
        messageData: {
          type: 'agent_execution',
          completedSteps: 1,
          totalSteps: 2,
          currentAttempt: 2,
          maxAttempts: 3,
          retryReason: 'причина',
          planning: { specRead: true, requirementCount: 4, requestedKinds: ['форма'] }
        }
      };

      const { container } = render(<AgentProgressMessage message={message} />);

      expect(container.querySelector('.ai-assistant-chat__agent-planning-facts')).toBeNull();
      expect(container.querySelector('.ai-assistant-chat__agent-planning-attempt')).toBeNull();
      expect(container.textContent).not.toContain('причина');
    });

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

      expect(screen.getByText('ai-assistant.agent-progress.executing')).toBeTruthy();
      expect(screen.getByText(/ai-assistant\.agent-progress\.step-counter/)).toBeTruthy();
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
      const stepIcons = icons.filter(
        icon =>
          icon.className.includes('fa-check-circle') || icon.className.includes('fa-spinner') || icon.className.includes('fa-circle-o')
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

      expect(screen.getByText(/ai-assistant\.agent-progress\.step-counter/)).toBeTruthy();
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
          steps: [{ id: 'step-1', description: 'Generate form', status: 'IN_PROGRESS', executionTime: '1.5s' }]
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
          steps: [{ id: 'step-1', description: 'Create data type', status: 'COMPLETED', error: 'some leftover error' }]
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
          steps: [{ id: 'step-1', description: 'Deploy artifacts', status: 'COMPLETED' }]
        }
      };

      render(<AgentProgressMessage message={message} />);

      const icons = screen.getAllByTestId('icon');
      const toggleIcon = icons.find(icon => icon.className.includes('fa-chevron-down') || icon.className.includes('fa-chevron-up'));
      expect(toggleIcon).toBeFalsy();
    });
  });

  // D-B-7: a dead turn stamps `messageData.error` in `handlePollingError`. The card renders only
  // from `messageData`, so before this it kept spinning and showing a filled bar for a request that
  // had already failed — the original "вечно висит на 5 %" symptom, on the agent path.
  describe('when the turn failed', () => {
    it('stops the planning spinner and announces the failure', () => {
      const message = {
        messageData: { type: 'agent_planning', error: true }
      };

      render(<AgentProgressMessage message={message} />);

      expect(screen.queryByText('ai-assistant.agent-progress.planning')).toBeNull();
      expect(screen.getByText('ai-assistant.chat.request-failed')).toBeTruthy();

      const icons = screen.getAllByTestId('icon');
      expect(icons.every(icon => !icon.className.split(' ').includes('fa-spin'))).toBe(true);
      expect(icons.find(icon => icon.className.includes('fa-exclamation-triangle'))).toBeTruthy();
    });

    it('stops the execution cog, marks the bar and freezes an in-progress step', () => {
      const message = {
        messageData: {
          type: 'agent_execution',
          error: true,
          completedSteps: 1,
          totalSteps: 3,
          overallProgress: 60,
          steps: [
            { id: 'step-1', description: 'Собрать контекст', status: 'COMPLETED' },
            { id: 'step-2', description: 'Развернуть артефакты', status: 'IN_PROGRESS' }
          ]
        }
      };

      const { container } = render(<AgentProgressMessage message={message} />);

      expect(screen.queryByText('ai-assistant.agent-progress.executing')).toBeNull();
      expect(screen.getByText('ai-assistant.chat.request-failed')).toBeTruthy();
      expect(container.querySelector('.ai-assistant-chat__agent-progress--failed')).toBeTruthy();
      expect(container.querySelector('.ai-assistant-chat__agent-progress-fill--failed')).toBeTruthy();

      // Nothing on a dead card may keep animating, the step spinner included
      const icons = screen.getAllByTestId('icon');
      expect(icons.every(icon => !icon.className.split(' ').includes('fa-spin'))).toBe(true);
    });

    // COREDEV-484 (A6): «Отменить» flags the MESSAGE (`isCancelled`), not `messageData`, and the
    // planning card used to ignore it — spinner, facts and attempt line stayed up for a stopped request.
    it('stops the planning spinner and hides facts and attempt lines when the turn was cancelled', () => {
      const message = {
        isCancelled: true,
        messageData: {
          type: 'agent_planning',
          currentAttempt: 2,
          maxAttempts: 3,
          retryReason: 'причина',
          planning: { specRead: true, requirementCount: 4, requestedKinds: ['форма'] }
        }
      };

      const { container } = render(<AgentProgressMessage message={message} />);

      expect(screen.queryByText('ai-assistant.agent-progress.planning')).toBeNull();
      expect(screen.queryByText('ai-assistant.chat.request-failed')).toBeNull();
      expect(screen.getByText('ai-assistant.chat.cancelled-title')).toBeTruthy();
      expect(container.querySelector('.ai-assistant-chat__agent-progress--cancelled')).toBeTruthy();
      expect(container.querySelector('.ai-assistant-chat__agent-progress--failed')).toBeNull();
      expect(container.querySelector('.ai-assistant-chat__agent-planning-facts')).toBeNull();
      expect(container.querySelector('.ai-assistant-chat__agent-planning-attempt')).toBeNull();

      const icons = screen.getAllByTestId('icon');
      expect(icons.every(icon => !icon.className.split(' ').includes('fa-spin'))).toBe(true);
      expect(icons.find(icon => icon.className.includes('fa-ban'))).toBeTruthy();
    });

    it('stops the execution cog and freezes an in-progress step when the turn was cancelled', () => {
      const message = {
        isCancelled: true,
        messageData: {
          type: 'agent_execution',
          completedSteps: 1,
          totalSteps: 3,
          overallProgress: 60,
          steps: [{ id: 'step-2', description: 'Развернуть артефакты', status: 'IN_PROGRESS' }]
        }
      };

      const { container } = render(<AgentProgressMessage message={message} />);

      expect(screen.queryByText('ai-assistant.agent-progress.executing')).toBeNull();
      expect(screen.getByText('ai-assistant.chat.cancelled-title')).toBeTruthy();
      expect(container.querySelector('.ai-assistant-chat__agent-progress--cancelled')).toBeTruthy();
      // The bar is muted with the rest of the card: a cancelled turn left in the live colour would be
      // the one element still reporting progress next to a muted header and frozen steps. It takes
      // the muted modifier, not the danger one — a red bar under a grey «Запрос отменён» read as a
      // failure the user never hit.
      expect(container.querySelector('.ai-assistant-chat__agent-progress-fill--cancelled')).toBeTruthy();
      expect(container.querySelector('.ai-assistant-chat__agent-progress-fill--failed')).toBeNull();

      const icons = screen.getAllByTestId('icon');
      expect(icons.every(icon => !icon.className.split(' ').includes('fa-spin'))).toBe(true);
    });

    // The narration line of the last poll is the counterpart of the planner facts above: left in
    // place it kept saying «Создаю форму заявки…» under a «Запрос отменён» header (COREDEV-484, A6).
    it.each([
      ['cancelled', { isCancelled: true }, {}],
      ['failed', {}, { error: true }]
    ])('hides the current step description on a %s execution card', (_label, messageFields, dataFields) => {
      const message = {
        ...messageFields,
        messageData: {
          type: 'agent_execution',
          completedSteps: 1,
          totalSteps: 3,
          overallProgress: 60,
          currentStepDescription: 'Создаю форму заявки...',
          ...dataFields
        }
      };

      const { container } = render(<AgentProgressMessage message={message} />);

      expect(screen.queryByText('Создаю форму заявки...')).toBeNull();
      expect(container.querySelector('.ai-assistant-chat__agent-current-step')).toBeNull();
    });

    it('reports a failure, not a cancellation, when a cancelled message also carries the error stamp', () => {
      const message = { isCancelled: true, messageData: { type: 'agent_planning', error: true } };

      render(<AgentProgressMessage message={message} />);

      expect(screen.getByText('ai-assistant.chat.request-failed')).toBeTruthy();
      expect(screen.queryByText('ai-assistant.chat.cancelled-title')).toBeNull();
    });

    it('keeps spinning while the turn is alive', () => {
      const message = {
        messageData: {
          type: 'agent_execution',
          completedSteps: 1,
          totalSteps: 3,
          overallProgress: 60,
          steps: [{ id: 'step-2', description: 'Развернуть артефакты', status: 'IN_PROGRESS' }]
        }
      };

      const { container } = render(<AgentProgressMessage message={message} />);

      expect(screen.getByText('ai-assistant.agent-progress.executing')).toBeTruthy();
      expect(container.querySelector('.ai-assistant-chat__agent-progress--failed')).toBeNull();

      const icons = screen.getAllByTestId('icon');
      expect(icons.filter(icon => icon.className.split(' ').includes('fa-spin')).length).toBe(2);
    });
  });
});
