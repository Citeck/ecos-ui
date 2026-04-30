import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import ChatContextTags from '../components/ChatContextTags';

// Mock dependencies
jest.mock('../../common', () => ({
  Icon: ({ className }) => <i className={className} data-testid="icon" />
}));

jest.mock('@/helpers/export/util', () => ({
  t: (key) => key
}));

jest.mock('../../../helpers/util', () => ({
  getTextByLocale: (text) => text
}));

const mockAgents = [
  { id: 'agent-1', name: 'Бизнес-аналитик', description: 'Анализ бизнес-процессов' },
  { id: 'agent-2', name: 'Тестировщик', description: 'Написание тест-кейсов' }
];

const defaultProps = {
  selectedAdditionalContext: [],
  additionalContext: { records: [], documents: [], attributes: [] },
  onToggleContext: jest.fn(),
  onRemoveSelectedText: jest.fn(),
  onRemoveScriptContext: jest.fn(),
  onRemoveUploadedFile: jest.fn(),
  selectedAgent: null,
  onSelectAgent: jest.fn(),
  onClearConversation: jest.fn(),
  hasMessages: false
};

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = jest.fn();
});

describe('AgentSelector', () => {
  it('renders agent selector with default "Citeck AI" label', () => {
    const { container } = render(<ChatContextTags {...defaultProps} />);
    const agentTag = container.querySelector('.ai-assistant-chat__context-tag--agent');
    expect(agentTag).toBeTruthy();
    expect(screen.getByText('Citeck AI')).toBeTruthy();
  });

  it('renders magic icon when no agent selected', () => {
    const { container } = render(<ChatContextTags {...defaultProps} />);
    const agentTag = container.querySelector('.ai-assistant-chat__context-tag--agent');
    expect(agentTag.querySelector('.fa-magic')).toBeTruthy();
  });

  it('renders agent name and robot icon when agent is selected', () => {
    const { container } = render(
      <ChatContextTags {...defaultProps} selectedAgent={mockAgents[0]} />
    );
    expect(screen.getByText('Бизнес-аналитик')).toBeTruthy();
    const agentTag = container.querySelector('.ai-assistant-chat__context-tag--agent');
    expect(agentTag.querySelector('.fa-robot')).toBeTruthy();
  });

  it('adds active class when agent is selected', () => {
    const { container } = render(
      <ChatContextTags {...defaultProps} selectedAgent={mockAgents[0]} />
    );
    expect(container.querySelector('.ai-assistant-chat__context-tag--agent-active')).toBeTruthy();
  });

  it('does not add active class when no agent selected', () => {
    const { container } = render(<ChatContextTags {...defaultProps} />);
    expect(container.querySelector('.ai-assistant-chat__context-tag--agent-active')).toBeNull();
  });

  it('shows dropdown on button click and fetches agents', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockAgents
    });

    const { container } = render(<ChatContextTags {...defaultProps} />);
    const agentButton = container.querySelector('.ai-assistant-chat__context-tag--agent');

    await act(async () => {
      fireEvent.click(agentButton);
    });

    expect(global.fetch).toHaveBeenCalled();
    expect(container.querySelector('.ai-assistant-chat__agent-dropdown')).toBeTruthy();
  });

  it('renders default "Citeck AI" option in dropdown', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockAgents
    });

    const { container } = render(<ChatContextTags {...defaultProps} />);

    await act(async () => {
      fireEvent.click(container.querySelector('.ai-assistant-chat__context-tag--agent'));
    });

    const items = container.querySelectorAll('.ai-assistant-chat__agent-dropdown-item');
    expect(items.length).toBeGreaterThanOrEqual(1);
    // First item is "Citeck AI"
    expect(items[0].querySelector('.ai-assistant-chat__agent-dropdown-item-name').textContent).toBe('Citeck AI');
  });

  it('renders fetched agents in dropdown', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockAgents
    });

    const { container } = render(<ChatContextTags {...defaultProps} />);

    await act(async () => {
      fireEvent.click(container.querySelector('.ai-assistant-chat__context-tag--agent'));
    });

    expect(screen.getByText('Бизнес-аналитик')).toBeTruthy();
    expect(screen.getByText('Тестировщик')).toBeTruthy();
    expect(screen.getByText('Анализ бизнес-процессов')).toBeTruthy();
  });

  it('marks "Citeck AI" as selected when no agent selected', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockAgents
    });

    const { container } = render(<ChatContextTags {...defaultProps} />);

    await act(async () => {
      fireEvent.click(container.querySelector('.ai-assistant-chat__context-tag--agent'));
    });

    const items = container.querySelectorAll('.ai-assistant-chat__agent-dropdown-item');
    expect(items[0].classList.contains('ai-assistant-chat__agent-dropdown-item--selected')).toBe(true);
    expect(items[1].classList.contains('ai-assistant-chat__agent-dropdown-item--selected')).toBe(false);
  });

  it('marks selected agent as selected in dropdown', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockAgents
    });

    const { container } = render(
      <ChatContextTags {...defaultProps} selectedAgent={mockAgents[0]} />
    );

    await act(async () => {
      fireEvent.click(container.querySelector('.ai-assistant-chat__context-tag--agent'));
    });

    const items = container.querySelectorAll('.ai-assistant-chat__agent-dropdown-item');
    // "Citeck AI" should NOT be selected
    expect(items[0].classList.contains('ai-assistant-chat__agent-dropdown-item--selected')).toBe(false);
    // First agent should be selected (items[1] — agents follow "Citeck AI", divider is not an item)
    expect(items[1].classList.contains('ai-assistant-chat__agent-dropdown-item--selected')).toBe(true);
  });

  it('calls onSelectAgent when selecting an agent without messages', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockAgents
    });

    const onSelectAgent = jest.fn();
    const onClearConversation = jest.fn();
    const { container } = render(
      <ChatContextTags
        {...defaultProps}
        onSelectAgent={onSelectAgent}
        onClearConversation={onClearConversation}
        hasMessages={false}
      />
    );

    await act(async () => {
      fireEvent.click(container.querySelector('.ai-assistant-chat__context-tag--agent'));
    });

    const items = container.querySelectorAll('.ai-assistant-chat__agent-dropdown-item');
    // Click second agent (after "Citeck AI" and divider)
    fireEvent.click(items[1]);

    expect(onClearConversation).toHaveBeenCalled();
    expect(onSelectAgent).toHaveBeenCalledWith(mockAgents[0]);
  });

  it('shows confirmation dialog when switching agent with messages', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockAgents
    });

    window.confirm = jest.fn(() => true);
    const onSelectAgent = jest.fn();
    const { container } = render(
      <ChatContextTags
        {...defaultProps}
        onSelectAgent={onSelectAgent}
        hasMessages={true}
      />
    );

    await act(async () => {
      fireEvent.click(container.querySelector('.ai-assistant-chat__context-tag--agent'));
    });

    const items = container.querySelectorAll('.ai-assistant-chat__agent-dropdown-item');
    fireEvent.click(items[1]);

    expect(window.confirm).toHaveBeenCalledWith('ai-agent.confirm-switch');
    expect(onSelectAgent).toHaveBeenCalled();
  });

  it('does not select agent when confirmation is cancelled', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockAgents
    });

    window.confirm = jest.fn(() => false);
    const onSelectAgent = jest.fn();
    const { container } = render(
      <ChatContextTags
        {...defaultProps}
        onSelectAgent={onSelectAgent}
        hasMessages={true}
      />
    );

    await act(async () => {
      fireEvent.click(container.querySelector('.ai-assistant-chat__context-tag--agent'));
    });

    const items = container.querySelectorAll('.ai-assistant-chat__agent-dropdown-item');
    fireEvent.click(items[1]);

    expect(window.confirm).toHaveBeenCalled();
    expect(onSelectAgent).not.toHaveBeenCalled();
  });

  it('deselects agent when clicking "Citeck AI" with agent selected', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockAgents
    });

    const onSelectAgent = jest.fn();
    const onClearConversation = jest.fn();
    const { container } = render(
      <ChatContextTags
        {...defaultProps}
        selectedAgent={mockAgents[0]}
        onSelectAgent={onSelectAgent}
        onClearConversation={onClearConversation}
        hasMessages={false}
      />
    );

    await act(async () => {
      fireEvent.click(container.querySelector('.ai-assistant-chat__context-tag--agent'));
    });

    const items = container.querySelectorAll('.ai-assistant-chat__agent-dropdown-item');
    fireEvent.click(items[0]); // Click "Citeck AI"

    expect(onClearConversation).toHaveBeenCalled();
    expect(onSelectAgent).toHaveBeenCalledWith(null);
  });

  it('closes dropdown when clicking same selected agent', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockAgents
    });

    const onSelectAgent = jest.fn();
    const { container } = render(
      <ChatContextTags
        {...defaultProps}
        selectedAgent={mockAgents[0]}
        onSelectAgent={onSelectAgent}
      />
    );

    await act(async () => {
      fireEvent.click(container.querySelector('.ai-assistant-chat__context-tag--agent'));
    });

    const items = container.querySelectorAll('.ai-assistant-chat__agent-dropdown-item');
    // Click the already-selected agent (items[1] is agent-1)
    fireEvent.click(items[1]);

    expect(onSelectAgent).not.toHaveBeenCalled();
    expect(container.querySelector('.ai-assistant-chat__agent-dropdown')).toBeNull();
  });

  it('closes dropdown when "Citeck AI" clicked and no agent selected', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockAgents
    });

    const onSelectAgent = jest.fn();
    const { container } = render(
      <ChatContextTags {...defaultProps} onSelectAgent={onSelectAgent} />
    );

    await act(async () => {
      fireEvent.click(container.querySelector('.ai-assistant-chat__context-tag--agent'));
    });

    const items = container.querySelectorAll('.ai-assistant-chat__agent-dropdown-item');
    fireEvent.click(items[0]); // "Citeck AI" already selected

    expect(onSelectAgent).not.toHaveBeenCalled();
    expect(container.querySelector('.ai-assistant-chat__agent-dropdown')).toBeNull();
  });

  it('shows empty state when no agents available', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => []
    });

    const { container } = render(<ChatContextTags {...defaultProps} />);

    await act(async () => {
      fireEvent.click(container.querySelector('.ai-assistant-chat__context-tag--agent'));
    });

    expect(container.querySelector('.ai-assistant-chat__agent-dropdown-empty')).toBeTruthy();
    expect(screen.getByText('ai-agent.no-agents')).toBeTruthy();
  });

  it('shows divider between "Citeck AI" and agents list', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockAgents
    });

    const { container } = render(<ChatContextTags {...defaultProps} />);

    await act(async () => {
      fireEvent.click(container.querySelector('.ai-assistant-chat__context-tag--agent'));
    });

    expect(container.querySelector('.ai-assistant-chat__agent-dropdown-divider')).toBeTruthy();
  });

  it('does not show divider when agents list is empty', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => []
    });

    const { container } = render(<ChatContextTags {...defaultProps} />);

    await act(async () => {
      fireEvent.click(container.querySelector('.ai-assistant-chat__context-tag--agent'));
    });

    expect(container.querySelector('.ai-assistant-chat__agent-dropdown-divider')).toBeNull();
  });

  it('handles fetch error gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    global.fetch.mockRejectedValueOnce(new Error('Network error'));

    const { container } = render(<ChatContextTags {...defaultProps} />);

    await act(async () => {
      fireEvent.click(container.querySelector('.ai-assistant-chat__context-tag--agent'));
    });

    expect(consoleSpy).toHaveBeenCalled();
    // Dropdown should still show with empty state
    expect(container.querySelector('.ai-assistant-chat__agent-dropdown')).toBeTruthy();
    consoleSpy.mockRestore();
  });

  it('caches agents and does not re-fetch on second toggle', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockAgents
    });

    const { container } = render(<ChatContextTags {...defaultProps} />);
    const agentButton = container.querySelector('.ai-assistant-chat__context-tag--agent');

    // First open
    await act(async () => {
      fireEvent.click(agentButton);
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);

    // Close
    fireEvent.click(agentButton);

    // Second open
    await act(async () => {
      fireEvent.click(agentButton);
    });

    expect(global.fetch).toHaveBeenCalledTimes(1); // Not called again
  });

  it('closes dropdown on click outside', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockAgents
    });

    const { container } = render(
      <div>
        <ChatContextTags {...defaultProps} />
        <div data-testid="outside">Outside</div>
      </div>
    );

    const agentButton = container.querySelector('.ai-assistant-chat__context-tag--agent');

    await act(async () => {
      fireEvent.click(agentButton);
    });

    expect(container.querySelector('.ai-assistant-chat__agent-dropdown')).toBeTruthy();

    // Click outside
    fireEvent.mouseDown(screen.getByTestId('outside'));

    expect(container.querySelector('.ai-assistant-chat__agent-dropdown')).toBeNull();
  });

  it('renders agent fallback to id when name is missing', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [{ id: 'agent-no-name', description: 'No name agent' }]
    });

    const { container } = render(<ChatContextTags {...defaultProps} />);

    await act(async () => {
      fireEvent.click(container.querySelector('.ai-assistant-chat__context-tag--agent'));
    });

    expect(screen.getByText('agent-no-name')).toBeTruthy();
  });
});
