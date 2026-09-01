import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

import ChatHeader, { ACTIVE_AGENT_STATUSES, AGENT_STATUS_LABELS } from '../components/ChatHeader';
import { AGENT_STATUSES } from '../types';

// Mock Icon component
jest.mock('@/components/common', () => ({
  Icon: ({ className }) => <i className={className} data-testid="icon" />
}));

jest.mock('@/helpers/export/util', () => ({
  t: key => key
}));

describe('ChatHeader', () => {
  const defaultProps = {
    isMinimized: false,
    onMinimize: jest.fn(),
    onClose: jest.fn()
  };

  it('renders title without agent badge when agentStatus is null', () => {
    render(<ChatHeader {...defaultProps} />);
    expect(screen.getByText('Citeck AI')).toBeTruthy();
    expect(screen.queryByText('Agent')).toBeNull();
  });

  it('renders title without agent badge when agentStatus is COMPLETED', () => {
    render(<ChatHeader {...defaultProps} agentStatus={AGENT_STATUSES.COMPLETED} />);
    expect(screen.getByText('Citeck AI')).toBeTruthy();
    expect(screen.queryByText('Agent')).toBeNull();
  });

  it('renders title without agent badge when agentStatus is FAILED', () => {
    render(<ChatHeader {...defaultProps} agentStatus={AGENT_STATUSES.FAILED} />);
    expect(screen.queryByText('Agent')).toBeNull();
  });

  it('shows agent badge when agentStatus is PLANNING', () => {
    render(<ChatHeader {...defaultProps} agentStatus={AGENT_STATUSES.PLANNING} />);
    expect(screen.getByText('Agent')).toBeTruthy();
  });

  it('shows agent badge when agentStatus is EXECUTING', () => {
    render(<ChatHeader {...defaultProps} agentStatus={AGENT_STATUSES.EXECUTING} />);
    expect(screen.getByText('Agent')).toBeTruthy();
  });

  it('shows agent badge when agentStatus is WAITING_PLAN_APPROVAL', () => {
    render(<ChatHeader {...defaultProps} agentStatus={AGENT_STATUSES.WAITING_PLAN_APPROVAL} />);
    expect(screen.getByText('Agent')).toBeTruthy();
  });

  it('shows agent badge when agentStatus is WAITING_STEP_APPROVAL', () => {
    render(<ChatHeader {...defaultProps} agentStatus={AGENT_STATUSES.WAITING_STEP_APPROVAL} />);
    expect(screen.getByText('Agent')).toBeTruthy();
  });

  it('badge has correct title attribute for PLANNING', () => {
    render(<ChatHeader {...defaultProps} agentStatus={AGENT_STATUSES.PLANNING} />);
    const badge = screen.getByText('Agent').closest('.ai-assistant-chat__agent-badge');
    expect(badge.getAttribute('title')).toBe('ai-assistant.agent-status.planning');
  });

  it('badge has correct title attribute for EXECUTING', () => {
    render(<ChatHeader {...defaultProps} agentStatus={AGENT_STATUSES.EXECUTING} />);
    const badge = screen.getByText('Agent').closest('.ai-assistant-chat__agent-badge');
    expect(badge.getAttribute('title')).toBe('ai-assistant.agent-status.executing');
  });

  it('renders custom title', () => {
    render(<ChatHeader {...defaultProps} title="Custom Title" />);
    expect(screen.getByText('Custom Title')).toBeTruthy();
  });

  it('renders selectedAgent name instead of default title', () => {
    render(<ChatHeader {...defaultProps} selectedAgent={{ id: 'agent-1', name: 'Бизнес-аналитик' }} />);
    expect(screen.getByText('Бизнес-аналитик')).toBeTruthy();
    expect(screen.queryByText('Citeck AI')).toBeNull();
  });

  it('renders default title when selectedAgent is null', () => {
    render(<ChatHeader {...defaultProps} selectedAgent={null} />);
    expect(screen.getByText('Citeck AI')).toBeTruthy();
  });
});

describe('ACTIVE_AGENT_STATUSES', () => {
  it('includes PLANNING, WAITING_PLAN_APPROVAL, EXECUTING, WAITING_STEP_APPROVAL', () => {
    expect(ACTIVE_AGENT_STATUSES).toContain(AGENT_STATUSES.PLANNING);
    expect(ACTIVE_AGENT_STATUSES).toContain(AGENT_STATUSES.WAITING_PLAN_APPROVAL);
    expect(ACTIVE_AGENT_STATUSES).toContain(AGENT_STATUSES.EXECUTING);
    expect(ACTIVE_AGENT_STATUSES).toContain(AGENT_STATUSES.WAITING_STEP_APPROVAL);
  });

  it('does not include COMPLETED or FAILED', () => {
    expect(ACTIVE_AGENT_STATUSES).not.toContain(AGENT_STATUSES.COMPLETED);
    expect(ACTIVE_AGENT_STATUSES).not.toContain(AGENT_STATUSES.FAILED);
  });
});

describe('AGENT_STATUS_LABELS', () => {
  it('has labels for all active statuses', () => {
    ACTIVE_AGENT_STATUSES.forEach(status => {
      expect(AGENT_STATUS_LABELS[status]).toBeTruthy();
    });
  });
});

// D-405-3: header buttons are named via aria-label + data-tooltip (the module's styled tooltip)
// instead of title, which would draw a second, native tooltip on top of the styled one.
// The mocked t() returns keys as-is, so accessible names are compared against locale keys.
describe('Header button tooltips and accessible names (D-405-3)', () => {
  const defaultProps = {
    isMinimized: false,
    onMinimize: jest.fn(),
    onClose: jest.fn()
  };

  it('close button has accessible name and styled tooltip', () => {
    render(<ChatHeader {...defaultProps} />);
    const button = screen.getByRole('button', { name: 'ai-assistant.header.close' });
    expect(button.getAttribute('aria-label')).toBe('ai-assistant.header.close');
    expect(button.getAttribute('data-tooltip')).toBe('ai-assistant.header.close');
  });

  it('minimize button has accessible name and styled tooltip', () => {
    render(<ChatHeader {...defaultProps} />);
    const button = screen.getByRole('button', { name: 'ai-assistant.header.minimize' });
    expect(button.getAttribute('aria-label')).toBe('ai-assistant.header.minimize');
    expect(button.getAttribute('data-tooltip')).toBe('ai-assistant.header.minimize');
  });

  it('minimize button label switches to expand when minimized', () => {
    render(<ChatHeader {...defaultProps} isMinimized={true} />);
    const button = screen.getByRole('button', { name: 'ai-assistant.header.expand' });
    expect(button.getAttribute('aria-label')).toBe('ai-assistant.header.expand');
    expect(button.getAttribute('data-tooltip')).toBe('ai-assistant.header.expand');
    expect(screen.queryByRole('button', { name: 'ai-assistant.header.minimize' })).toBeNull();
  });

  it('export button has accessible name and styled tooltip', () => {
    render(<ChatHeader {...defaultProps} hasMessages={true} />);
    const button = screen.getByRole('button', { name: 'ai-assistant.export.button-title' });
    expect(button.getAttribute('aria-label')).toBe('ai-assistant.export.button-title');
    expect(button.getAttribute('data-tooltip')).toBe('ai-assistant.export.button-title');
  });

  it('header buttons have no title attribute', () => {
    render(<ChatHeader {...defaultProps} hasMessages={true} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(3);
    buttons.forEach(button => {
      expect(button.hasAttribute('title')).toBe(false);
    });
  });
});

describe('Export button', () => {
  const defaultProps = {
    isMinimized: false,
    onMinimize: jest.fn(),
    onClose: jest.fn(),
    onExportMarkdown: jest.fn(),
    onExportHtml: jest.fn()
  };

  const getExportButton = container => {
    const downloadIcon = container.querySelector('.fa-download');
    return downloadIcon ? downloadIcon.closest('button') : null;
  };

  it('does not render export button when hasMessages is false', () => {
    const { container } = render(<ChatHeader {...defaultProps} hasMessages={false} />);
    expect(getExportButton(container)).toBeNull();
  });

  it('renders export button when hasMessages is true', () => {
    const { container } = render(<ChatHeader {...defaultProps} hasMessages={true} />);
    expect(getExportButton(container)).not.toBeNull();
  });

  it('shows dropdown on export button click', () => {
    const { container } = render(<ChatHeader {...defaultProps} hasMessages={true} />);
    fireEvent.click(getExportButton(container));
    expect(container.querySelector('.ai-assistant-chat__export-dropdown')).not.toBeNull();
  });

  it('calls onExportMarkdown when Markdown option clicked', () => {
    const { container } = render(<ChatHeader {...defaultProps} hasMessages={true} />);
    fireEvent.click(getExportButton(container));
    const items = container.querySelectorAll('.ai-assistant-chat__export-dropdown-item');
    fireEvent.click(items[0]);
    expect(defaultProps.onExportMarkdown).toHaveBeenCalled();
  });

  it('calls onExportHtml when HTML option clicked', () => {
    const { container } = render(<ChatHeader {...defaultProps} hasMessages={true} />);
    fireEvent.click(getExportButton(container));
    const items = container.querySelectorAll('.ai-assistant-chat__export-dropdown-item');
    fireEvent.click(items[1]);
    expect(defaultProps.onExportHtml).toHaveBeenCalled();
  });

  it('closes dropdown after selection', () => {
    const { container } = render(<ChatHeader {...defaultProps} hasMessages={true} />);
    fireEvent.click(getExportButton(container));
    expect(container.querySelector('.ai-assistant-chat__export-dropdown')).not.toBeNull();
    const items = container.querySelectorAll('.ai-assistant-chat__export-dropdown-item');
    fireEvent.click(items[0]);
    expect(container.querySelector('.ai-assistant-chat__export-dropdown')).toBeNull();
  });
});
