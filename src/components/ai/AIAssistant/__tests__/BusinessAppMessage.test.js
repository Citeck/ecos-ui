import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

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
