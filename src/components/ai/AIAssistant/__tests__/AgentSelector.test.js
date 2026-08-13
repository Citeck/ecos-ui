import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import React from 'react';

import ChatContextTags from '../components/ChatContextTags';

import { NotificationManager } from '@/services/notifications';

// Mock dependencies
jest.mock('@/services/notifications', () => ({
  NotificationManager: { error: jest.fn(), success: jest.fn() }
}));
jest.mock('@/components/common', () => ({
  Icon: ({ className }) => <i className={className} data-testid="icon" />
}));

jest.mock('@/helpers/export/util', () => ({
  t: key => key
}));

jest.mock('@/helpers/util', () => ({
  getTextByLocale: text => text
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
  // `AIAssistantChat.handleClearConversationKeepAgent` reports whether the conversation was
  // actually cleared; the selector switches agents only when it was.
  onClearConversation: jest.fn(() => Promise.resolve(true)),
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
    const { container } = render(<ChatContextTags {...defaultProps} selectedAgent={mockAgents[0]} />);
    expect(screen.getByText('Бизнес-аналитик')).toBeTruthy();
    const agentTag = container.querySelector('.ai-assistant-chat__context-tag--agent');
    expect(agentTag.querySelector('.fa-robot')).toBeTruthy();
  });

  it('adds active class when agent is selected', () => {
    const { container } = render(<ChatContextTags {...defaultProps} selectedAgent={mockAgents[0]} />);
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

    const { container } = render(<ChatContextTags {...defaultProps} selectedAgent={mockAgents[0]} />);

    await act(async () => {
      fireEvent.click(container.querySelector('.ai-assistant-chat__context-tag--agent'));
    });

    const items = container.querySelectorAll('.ai-assistant-chat__agent-dropdown-item');
    // "Citeck AI" should NOT be selected
    expect(items[0].classList.contains('ai-assistant-chat__agent-dropdown-item--selected')).toBe(false);
    // First agent should be selected (items[1] — agents follow "Citeck AI", divider is not an item)
    expect(items[1].classList.contains('ai-assistant-chat__agent-dropdown-item--selected')).toBe(true);
  });

  // A chat with nothing to lose is switched outright: no confirmation is asked (`hasMessages` is
  // what gates it) and no clearing is run. Clearing anyway would DELETE a conversation the backend
  // has never seen — answered 404, which the caller reads as success — and the reset behind that
  // success drops the context staged for the very first question: @-records, uploaded files, the
  // editor chip. The welcome-screen entry point passes `null` here for the same reason.
  it('switches without clearing when there is no conversation to lose', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockAgents
    });

    window.confirm = jest.fn(() => true);
    const onSelectAgent = jest.fn();
    const onClearConversation = jest.fn(() => Promise.resolve(true));
    const { container } = render(
      <ChatContextTags {...defaultProps} onSelectAgent={onSelectAgent} onClearConversation={onClearConversation} hasMessages={false} />
    );

    await act(async () => {
      fireEvent.click(container.querySelector('.ai-assistant-chat__context-tag--agent'));
    });

    const items = container.querySelectorAll('.ai-assistant-chat__agent-dropdown-item');
    // Click second agent (after "Citeck AI" and divider)
    await act(async () => {
      fireEvent.click(items[1]);
    });

    expect(onClearConversation).not.toHaveBeenCalled();
    expect(window.confirm).not.toHaveBeenCalled();
    expect(onSelectAgent).toHaveBeenCalledWith(mockAgents[0]);
  });

  it('shows confirmation dialog when switching agent with messages', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockAgents
    });

    window.confirm = jest.fn(() => true);
    const onSelectAgent = jest.fn();
    const { container } = render(<ChatContextTags {...defaultProps} onSelectAgent={onSelectAgent} hasMessages={true} />);

    await act(async () => {
      fireEvent.click(container.querySelector('.ai-assistant-chat__context-tag--agent'));
    });

    const items = container.querySelectorAll('.ai-assistant-chat__agent-dropdown-item');
    await act(async () => {
      fireEvent.click(items[1]);
    });

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
    const { container } = render(<ChatContextTags {...defaultProps} onSelectAgent={onSelectAgent} hasMessages={true} />);

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
    const onClearConversation = jest.fn(() => Promise.resolve(true));
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
    await act(async () => {
      fireEvent.click(items[0]); // Click "Citeck AI"
    });

    // Going back to the default assistant is a switch like any other, so on a chat with no dialog
    // it clears nothing either — see 'switches without clearing when there is no conversation to
    // lose' above.
    expect(onClearConversation).not.toHaveBeenCalled();
    expect(onSelectAgent).toHaveBeenCalledWith(null);
  });

  it('clears the conversation before deselecting when a dialog is alive', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockAgents
    });

    window.confirm = jest.fn(() => true);
    const onSelectAgent = jest.fn();
    const onClearConversation = jest.fn(() => Promise.resolve(true));
    const { container } = render(
      <ChatContextTags
        {...defaultProps}
        selectedAgent={mockAgents[0]}
        onSelectAgent={onSelectAgent}
        onClearConversation={onClearConversation}
        hasMessages={true}
      />
    );

    await act(async () => {
      fireEvent.click(container.querySelector('.ai-assistant-chat__context-tag--agent'));
    });

    const items = container.querySelectorAll('.ai-assistant-chat__agent-dropdown-item');
    await act(async () => {
      fireEvent.click(items[0]); // Click "Citeck AI"
    });

    expect(onClearConversation).toHaveBeenCalled();
    expect(onSelectAgent).toHaveBeenCalledWith(null);
  });

  // The conversation is cleared before the switch, and on a refusal other than 404 it stays alive
  // server-side with the user already told so (`clearConversation` shows the notification). Changing
  // the chip anyway would claim the opposite, and the next question would continue the old dialog —
  // rebinding it to another agent, since the backend stores the agent on the conversation.
  it('does not switch the agent when the conversation could not be cleared', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockAgents
    });

    window.confirm = jest.fn(() => true);
    const onSelectAgent = jest.fn();
    const onClearConversation = jest.fn(() => Promise.resolve(false));
    const { container } = render(
      <ChatContextTags {...defaultProps} onSelectAgent={onSelectAgent} onClearConversation={onClearConversation} hasMessages={true} />
    );

    await act(async () => {
      fireEvent.click(container.querySelector('.ai-assistant-chat__context-tag--agent'));
    });

    const items = container.querySelectorAll('.ai-assistant-chat__agent-dropdown-item');
    await act(async () => {
      fireEvent.click(items[1]);
    });

    expect(onClearConversation).toHaveBeenCalled();
    expect(onSelectAgent).not.toHaveBeenCalled();
  });

  it('does not return to the default agent when the conversation could not be cleared', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockAgents
    });

    window.confirm = jest.fn(() => true);
    const onSelectAgent = jest.fn();
    const onClearConversation = jest.fn(() => Promise.resolve(false));
    const { container } = render(
      <ChatContextTags
        {...defaultProps}
        selectedAgent={mockAgents[0]}
        onSelectAgent={onSelectAgent}
        onClearConversation={onClearConversation}
        hasMessages={true}
      />
    );

    await act(async () => {
      fireEvent.click(container.querySelector('.ai-assistant-chat__context-tag--agent'));
    });

    const items = container.querySelectorAll('.ai-assistant-chat__agent-dropdown-item');
    await act(async () => {
      fireEvent.click(items[0]); // Click "Citeck AI"
    });

    expect(onClearConversation).toHaveBeenCalled();
    expect(onSelectAgent).not.toHaveBeenCalled();
  });

  // The guard above only makes sense for a dialog that is actually there. A chat with nothing to
  // lose has a conversation id the backend has never seen, so a DELETE refused with a 5xx says
  // nothing about the selection — and blocking on it took away the only way to pick an agent at all
  // while the service was briefly unreachable, over a chat the user had not even used yet.
  it('selects the agent on an unused chat even when the clearing was refused', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockAgents
    });

    const onSelectAgent = jest.fn();
    const onClearConversation = jest.fn(() => Promise.resolve(false));
    const { container } = render(
      <ChatContextTags {...defaultProps} onSelectAgent={onSelectAgent} onClearConversation={onClearConversation} hasMessages={false} />
    );

    await act(async () => {
      fireEvent.click(container.querySelector('.ai-assistant-chat__context-tag--agent'));
    });

    const items = container.querySelectorAll('.ai-assistant-chat__agent-dropdown-item');
    await act(async () => {
      fireEvent.click(items[1]);
    });

    expect(onSelectAgent).toHaveBeenCalledWith(mockAgents[0]);
  });

  it('closes dropdown when clicking same selected agent', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockAgents
    });

    const onSelectAgent = jest.fn();
    const { container } = render(<ChatContextTags {...defaultProps} selectedAgent={mockAgents[0]} onSelectAgent={onSelectAgent} />);

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
    const { container } = render(<ChatContextTags {...defaultProps} onSelectAgent={onSelectAgent} />);

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

  it('retries the fetch on next open after a failed load', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    // First open fails, second open succeeds — a transient error must not cache the empty state.
    global.fetch.mockRejectedValueOnce(new Error('Network error')).mockResolvedValueOnce({
      ok: true,
      json: async () => mockAgents
    });

    const { container } = render(<ChatContextTags {...defaultProps} />);
    const agentButton = container.querySelector('.ai-assistant-chat__context-tag--agent');

    await act(async () => {
      fireEvent.click(agentButton);
    });
    expect(global.fetch).toHaveBeenCalledTimes(1);

    // Close
    fireEvent.click(agentButton);

    // Second open re-fetches because the previous attempt failed
    await act(async () => {
      fireEvent.click(agentButton);
    });
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(screen.getByText('Бизнес-аналитик')).toBeTruthy();
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

  describe('engine-aware rendering', () => {
    const engineAgents = [
      { id: 'op-agent', name: 'Operational agent', description: 'op', engine: 'TOOL_LOOP' },
      { id: 'cfg-agent', name: 'Config agent', description: 'cfg', engine: 'CONFIG' },
      { id: 'legacy-agent', name: 'Legacy agent', description: 'legacy' } // no engine field
    ];

    it('renders config icon (fa-cogs) for CONFIG agent and robot for operational/legacy', async () => {
      global.fetch.mockResolvedValueOnce({ ok: true, json: async () => engineAgents });

      const { container } = render(<ChatContextTags {...defaultProps} />);
      await act(async () => {
        fireEvent.click(container.querySelector('.ai-assistant-chat__context-tag--agent'));
      });

      // items[0] = Citeck AI, items[1..3] = the three agents
      const items = container.querySelectorAll('.ai-assistant-chat__agent-dropdown-item');
      expect(items[1].querySelector('.fa-robot')).toBeTruthy(); // operational
      expect(items[2].querySelector('.fa-cogs')).toBeTruthy(); // config
      expect(items[3].querySelector('.fa-robot')).toBeTruthy(); // legacy fallback
    });

    it('renders engine badge per agent (config vs operational) with fallback for missing engine', async () => {
      global.fetch.mockResolvedValueOnce({ ok: true, json: async () => engineAgents });

      const { container } = render(<ChatContextTags {...defaultProps} />);
      await act(async () => {
        fireEvent.click(container.querySelector('.ai-assistant-chat__context-tag--agent'));
      });

      // exactly one config badge for the single CONFIG agent
      expect(container.querySelectorAll('.ai-assistant-chat__agent-engine-badge--config').length).toBe(1);
      // operational badge for default "Citeck AI", operational agent and legacy fallback
      expect(container.querySelectorAll('.ai-assistant-chat__agent-engine-badge--tool_loop').length).toBe(3);
      expect(screen.getAllByText('ai-agent.engine.config').length).toBe(1);
    });

    it('shows config icon in the button when a CONFIG agent is selected', () => {
      const { container } = render(<ChatContextTags {...defaultProps} selectedAgent={engineAgents[1]} />);
      const agentTag = container.querySelector('.ai-assistant-chat__context-tag--agent');
      expect(agentTag.querySelector('.fa-cogs')).toBeTruthy();
    });

    it('shows robot icon in the button when an agent without engine is selected (fallback)', () => {
      const { container } = render(<ChatContextTags {...defaultProps} selectedAgent={engineAgents[2]} />);
      const agentTag = container.querySelector('.ai-assistant-chat__context-tag--agent');
      expect(agentTag.querySelector('.fa-robot')).toBeTruthy();
    });
  });

  // `sanitizeAgent` stores `name` only when it is a plain non-empty string, so an agent restored
  // after a reload may come back as `{id, engine}` alone. The chip then rendered nothing at all —
  // an icon and a caret with no label — while the dropdown row had always fallen back to the id.
  describe('naming an agent that has no usable name', () => {
    it('falls back to the id on the chip', () => {
      const { container } = render(<ChatContextTags {...defaultProps} selectedAgent={{ id: 'agent-7', engine: 'TOOL_LOOP' }} />);
      const agentTag = container.querySelector('.ai-assistant-chat__context-tag--agent');

      expect(agentTag.querySelector('span').textContent).toBe('agent-7');
    });

    it('falls back to the id on the dropdown row too, so the two agree', async () => {
      global.fetch.mockResolvedValueOnce({ ok: true, json: async () => [{ id: 'agent-7' }] });

      const { container } = render(<ChatContextTags {...defaultProps} />);
      await act(async () => {
        fireEvent.click(container.querySelector('.ai-assistant-chat__context-tag--agent'));
      });

      expect(screen.getAllByText('agent-7').length).toBeGreaterThan(0);
    });
  });

  // The clearing behind an agent switch is asynchronous and does more than the DELETE. A rejection
  // used to be dropped on the floor: the dropdown was already closed, the agent was not switched,
  // and the only trace was an unhandled promise rejection in the console.
  describe('when the clearing throws', () => {
    it('reports the failure instead of failing silently', async () => {
      global.fetch.mockResolvedValueOnce({ ok: true, json: async () => mockAgents });

      window.confirm = jest.fn(() => true);
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      const onSelectAgent = jest.fn();
      const onClearConversation = jest.fn(() => Promise.reject(new Error('clear blew up')));

      const { container } = render(
        <ChatContextTags {...defaultProps} onSelectAgent={onSelectAgent} onClearConversation={onClearConversation} hasMessages={true} />
      );

      await act(async () => {
        fireEvent.click(container.querySelector('.ai-assistant-chat__context-tag--agent'));
      });

      const items = container.querySelectorAll('.ai-assistant-chat__agent-dropdown-item');
      await act(async () => {
        fireEvent.click(items[1]);
      });

      expect(NotificationManager.error).toHaveBeenCalledWith('ai-agent.switch-failed', 'ai-agent.switch-error-title');
      expect(onSelectAgent).not.toHaveBeenCalled();

      consoleError.mockRestore();
    });
  });
});
