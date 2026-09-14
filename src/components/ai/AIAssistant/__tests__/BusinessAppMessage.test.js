import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

import BusinessAppMessage from '../components/messages/BusinessAppMessage';

// Echo i18n keys verbatim so assertions read stable text.
jest.mock('@/helpers/export/util', () => ({
  t: key => key
}));

jest.mock('@/components/common', () => ({
  Icon: ({ className }) => <i className={className} data-testid="icon" />
}));

// Mock ArtifactsList to a simple marker so we can assert it renders with artifacts.
jest.mock('../components/messages/ArtifactsList', () => {
  return function MockArtifactsList({ artifacts }) {
    if (!artifacts || artifacts.length === 0) return null;
    return <div data-testid="artifacts-list">ArtifactsList</div>;
  };
});

const markdownComponents = {};

describe('BusinessAppMessage', () => {
  it('returns null when messageData is missing', () => {
    const { container } = render(<BusinessAppMessage message={{ text: 'x' }} markdownComponents={markdownComponents} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders stage percentage and progress bar for an in-progress stage', () => {
    const message = {
      id: 'm1',
      messageData: { type: 'business_app_generation', stage: 'CLARIFYING_QUESTIONS', progress: 10 },
      text: ''
    };

    const { container } = render(<BusinessAppMessage message={message} markdownComponents={markdownComponents} />);

    expect(screen.getByText('10%')).toBeTruthy();
    expect(container.querySelector('.ai-assistant-chat__progress-bar-thin')).toBeTruthy();
    expect(container.querySelector('.ai-assistant-chat__progress-fill').style.width).toBe('10%');
  });

  // COREDEV-484 (A6): «Отменить» flags the MESSAGE (`isCancelled`), never `messageData`, and this
  // card renders from `messageData` alone — it used to keep the stage label, the percentage, the
  // filled bar and the spinning cog of a generation the user had already stopped.
  it('reports a cancelled turn instead of progress when the message carries the cancel flag', () => {
    const message = {
      id: 'm-cancelled',
      isCancelled: true,
      messageData: {
        type: 'business_app_generation',
        stage: 'GENERATING_FORMS',
        progress: 45,
        currentAttempt: 2,
        maxAttempts: 3,
        stageMetadata: { label: 'Генерация форм', icon: 'fa-cog', animated: true, description: 'Осталось три формы' },
        detailedStatus: 'Создаю формы'
      },
      text: 'ai-assistant.chat.cancelled'
    };

    const { container } = render(<BusinessAppMessage message={message} markdownComponents={markdownComponents} />);

    expect(screen.getByText('ai-assistant.chat.cancelled-title')).toBeTruthy();
    expect(screen.queryByText('Генерация форм')).toBeNull();
    expect(screen.queryByText('45%')).toBeNull();
    expect(container.querySelector('.ai-assistant-chat__progress-bar-thin')).toBeNull();
    expect(container.querySelector('.ai-assistant-chat__progress-attempts')).toBeNull();
    // Both narration fields of the last poll are gone, and so is the body altogether: the only
    // thing left for it to show is the generic cancellation notice the header already carries.
    expect(screen.queryByText('Осталось три формы')).toBeNull();
    expect(screen.queryByText('Создаю формы')).toBeNull();
    expect(screen.queryByText('ai-assistant.chat.cancelled')).toBeNull();
    expect(container.querySelector('.ai-assistant-chat__progress-content')).toBeNull();

    const icons = screen.getAllByTestId('icon');
    expect(icons.every(icon => !icon.className.split(' ').includes('fa-spin'))).toBe(true);
    expect(icons.some(icon => icon.className.includes('fa-ban'))).toBe(true);
  });

  // A failed card is just as dead as a cancelled one: it must not go on announcing which planner
  // attempt is running under a header that already says the request did not go through.
  it('drops the attempt line on a failed card', () => {
    const message = {
      id: 'm-error',
      messageData: {
        type: 'business_app_generation',
        stage: 'GENERATING_FORMS',
        progress: 45,
        error: true,
        currentAttempt: 2,
        maxAttempts: 3
      },
      text: 'ai-assistant.chat.result-error'
    };

    const { container } = render(<BusinessAppMessage message={message} markdownComponents={markdownComponents} />);

    expect(container.querySelector('.ai-assistant-chat__progress-attempts')).toBeNull();
  });

  it('shows the attempt line while the generation is still running', () => {
    const message = {
      id: 'm-live',
      messageData: {
        type: 'business_app_generation',
        stage: 'GENERATING_FORMS',
        progress: 45,
        currentAttempt: 2,
        maxAttempts: 3
      },
      text: ''
    };

    const { container } = render(<BusinessAppMessage message={message} markdownComponents={markdownComponents} />);

    expect(container.querySelector('.ai-assistant-chat__progress-attempts')).toBeTruthy();
  });

  // A failed turn stamps `messageData.error` and is already reported as such; the stamp keeps
  // precedence, exactly as on the agent cards.
  it('reports a failure, not a cancellation, when a cancelled message also carries the error stamp', () => {
    const message = {
      id: 'm-failed',
      isCancelled: true,
      messageData: {
        type: 'business_app_generation',
        stage: 'GENERATING_FORMS',
        progress: 45,
        error: 'boom',
        stageMetadata: { label: 'Генерация форм', severity: 'ERROR', icon: 'fa-exclamation-triangle' }
      },
      text: ''
    };

    const { container } = render(<BusinessAppMessage message={message} markdownComponents={markdownComponents} />);

    expect(screen.queryByText('ai-assistant.chat.cancelled-title')).toBeNull();
    expect(screen.getByText('Генерация форм')).toBeTruthy();
    expect(container.querySelector('.ai-assistant-chat__progress-bar-thin')).toBeNull();
  });

  it('renders detailedStatus markdown (clarifying questions body)', () => {
    const message = {
      id: 'm2',
      messageData: {
        type: 'business_app_generation',
        stage: 'CLARIFYING_QUESTIONS',
        progress: 10,
        detailedStatus: 'Уточните поля заявки'
      },
      text: ''
    };

    render(<BusinessAppMessage message={message} markdownComponents={markdownComponents} />);
    expect(screen.getByText('Уточните поля заявки')).toBeTruthy();
  });

  it('renders MessageActions when messageData.actions is present and fires onActionClick', () => {
    const onActionClick = jest.fn();
    const message = {
      id: 'm3',
      messageData: {
        type: 'business_app_generation',
        stage: 'CLARIFYING_QUESTIONS',
        progress: 10,
        detailedStatus: 'вопросы',
        actions: [
          { id: 'SKIP', label: 'Пропустить', style: 'default' },
          { id: 'CANCEL', label: 'Отмена', style: 'default' }
        ]
      },
      text: ''
    };

    render(<BusinessAppMessage message={message} markdownComponents={markdownComponents} onActionClick={onActionClick} />);

    // SKIP id resolves via ACTION_LABEL_KEYS → echoed key; CANCEL falls back to its label.
    fireEvent.click(screen.getByText('ai-assistant.action.skip'));
    expect(onActionClick).toHaveBeenCalledWith('SKIP', { messageId: 'm3' });

    fireEvent.click(screen.getByText('Отмена'));
    expect(onActionClick).toHaveBeenCalledWith('CANCEL', { messageId: 'm3' });
  });

  it('disables the clarifying-questions buttons once the gate is no longer live', () => {
    const onActionClick = jest.fn();
    const message = {
      id: 'm3-stale',
      messageData: {
        type: 'business_app_generation',
        stage: 'CLARIFYING_QUESTIONS',
        progress: 10,
        detailedStatus: 'вопросы',
        actions: [
          { id: 'SKIP', label: 'Пропустить', style: 'default' },
          { id: 'CANCEL', label: 'Отмена', style: 'default' }
        ]
      },
      text: ''
    };

    const { rerender } = render(
      <BusinessAppMessage
        message={message}
        markdownComponents={markdownComponents}
        onActionClick={onActionClick}
        actionsDisabled
        actionsStale
      />
    );

    screen.getAllByRole('button').forEach(button => {
      expect(button.disabled).toBe(true);
      expect(button.className).toContain('ai-assistant-chat__action-button--stale');
    });

    fireEvent.click(screen.getByText('ai-assistant.action.skip'));
    expect(onActionClick).not.toHaveBeenCalled();

    // An in-flight request locks the same buttons without retiring them: the gate is still waiting,
    // and painting it decided for the length of a round trip is the very signal this class carries.
    rerender(
      <BusinessAppMessage
        message={message}
        markdownComponents={markdownComponents}
        onActionClick={onActionClick}
        actionsDisabled
        actionsFrozen
      />
    );

    screen.getAllByRole('button').forEach(button => {
      expect(button.disabled).toBe(true);
      expect(button.className).not.toContain('ai-assistant-chat__action-button--stale');
    });
  });

  it('does not render action buttons when there are no actions', () => {
    const message = {
      id: 'm4',
      messageData: { type: 'business_app_generation', stage: 'GENERATING_DATA_TYPES', progress: 40 },
      text: ''
    };

    const { container } = render(<BusinessAppMessage message={message} markdownComponents={markdownComponents} />);
    expect(container.querySelector('.ai-assistant-chat__message-actions')).toBeNull();
  });

  it('renders final markdown and artifacts for the COMPLETED stage', () => {
    const message = {
      id: 'm5',
      messageData: {
        type: 'business_app_generation',
        stage: 'COMPLETED',
        progress: 100,
        artifacts: [{ name: 'Заявка на закупку', url: '/type/x', type: { displayName: 'Тип данных', icon: 'fa-database' } }]
      },
      text: 'Приложение создано'
    };

    render(<BusinessAppMessage message={message} markdownComponents={markdownComponents} />);
    expect(screen.getByText('Приложение создано')).toBeTruthy();
    expect(screen.getByTestId('artifacts-list')).toBeTruthy();
  });
});
