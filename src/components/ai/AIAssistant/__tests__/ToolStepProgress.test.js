import React from 'react';
import { render, screen } from '@testing-library/react';

import ToolStepProgress from '../components/messages/ToolStepProgress';

// Mock Icon component
jest.mock('@/components/common', () => ({
  Icon: ({ className }) => <i className={className} data-testid="icon" />
}));

const buildMessage = (toolSteps, domain) => ({
  messageData: { type: 'agent_tool_step', toolSteps, domain }
});

describe('ToolStepProgress', () => {
  it('returns null when messageData is missing', () => {
    const { container } = render(<ToolStepProgress message={{ text: 'x' }} />);
    expect(container.firstChild).toBeNull();
  });

  it('returns null when message is missing entirely', () => {
    const { container } = render(<ToolStepProgress message={undefined} />);
    expect(container.firstChild).toBeNull();
  });

  it('titles the ribbon per engine: config domain -> platform-config header', () => {
    render(<ToolStepProgress message={buildMessage([], 'CONFIGURATION')} />);
    expect(screen.getByText('ai-assistant.agent-progress.tool-loop')).toBeTruthy();
  });

  it('titles the ribbon per engine: operational domain -> data-work header', () => {
    render(<ToolStepProgress message={buildMessage([], 'OPERATIONAL')} />);
    expect(screen.getByText('ai-assistant.agent-progress.operational')).toBeTruthy();
  });

  it('defaults to the operational header when domain is missing', () => {
    render(<ToolStepProgress message={buildMessage([])} />);
    expect(screen.getByText('ai-assistant.agent-progress.operational')).toBeTruthy();
  });

  it('renders one item per tool step using backend labels', () => {
    const message = buildMessage([
      { tool: 'findArtifact', label: 'Поиск артефакта', status: 'DONE', stepIndex: 1 },
      { tool: 'generateForm', label: 'Генерация формы', status: 'RUNNING', stepIndex: 2 }
    ]);

    render(<ToolStepProgress message={message} />);

    expect(screen.getByText('Поиск артефакта')).toBeTruthy();
    expect(screen.getByText('Генерация формы')).toBeTruthy();
  });

  it('shows a spinner for a RUNNING step and a check for a DONE step', () => {
    const message = buildMessage([
      { tool: 'findArtifact', label: 'Поиск артефакта', status: 'DONE', stepIndex: 1 },
      { tool: 'generateForm', label: 'Генерация формы', status: 'RUNNING', stepIndex: 2 }
    ]);

    const { container } = render(<ToolStepProgress message={message} />);

    const doneStep = container.querySelector('.tool-step--done');
    const runningStep = container.querySelector('.tool-step--running');
    expect(doneStep.querySelector('.fa-check-circle')).toBeTruthy();
    expect(runningStep.querySelector('.fa-spinner')).toBeTruthy();
    expect(runningStep.querySelector('.fa-spin')).toBeTruthy();
  });

  it('renders an ERROR step with the failure icon and detail', () => {
    const message = buildMessage([
      { tool: 'deployArtifact', label: 'Публикация артефакта', status: 'ERROR', stepIndex: 1, detail: 'Validation failed' }
    ]);

    const { container } = render(<ToolStepProgress message={message} />);

    const errorStep = container.querySelector('.tool-step--error');
    expect(errorStep.querySelector('.fa-times-circle')).toBeTruthy();
    expect(screen.getByText('Validation failed')).toBeTruthy();
  });

  it('falls back to the raw tool name when label is missing', () => {
    const message = buildMessage([{ tool: 'customTool', status: 'RUNNING', stepIndex: 1 }]);
    render(<ToolStepProgress message={message} />);
    expect(screen.getByText('customTool')).toBeTruthy();
  });

  it('renders a sequence RUNNING -> DONE for the same step transitioning by status', () => {
    const running = buildMessage([{ tool: 'generateForm', label: 'Генерация формы', status: 'RUNNING', stepIndex: 1 }]);
    const { container, rerender } = render(<ToolStepProgress message={running} />);
    expect(container.querySelector('.tool-step--running')).toBeTruthy();

    const done = buildMessage([{ tool: 'generateForm', label: 'Генерация формы', status: 'DONE', stepIndex: 1 }]);
    rerender(<ToolStepProgress message={done} />);
    expect(container.querySelector('.tool-step--running')).toBeNull();
    expect(container.querySelector('.tool-step--done')).toBeTruthy();
  });
});
