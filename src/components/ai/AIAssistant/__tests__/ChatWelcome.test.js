import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import ChatWelcome from '../components/ChatWelcome';

jest.mock('@/helpers/export/util', () => ({
  t: key => key
}));

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = jest.fn();
});

describe('ChatWelcome', () => {
  it('renders the two-mode explanation in the universal tab', () => {
    render(<ChatWelcome activeTab="universal" />);
    expect(screen.getByText('ai-assistant.welcome.operational.title')).toBeTruthy();
    expect(screen.getByText('ai-assistant.welcome.config.title')).toBeTruthy();
    expect(screen.getByText('ai-assistant.welcome.modes.switch-hint')).toBeTruthy();
  });

  it('does not render the modes block in the contextual tab', () => {
    render(<ChatWelcome activeTab="contextual" contextHint="hint" />);
    expect(screen.queryByText('ai-assistant.welcome.operational.title')).toBeNull();
    expect(screen.getByText('hint')).toBeTruthy();
  });

  it('does not render the configure button when onSelectAgent is not provided', () => {
    render(<ChatWelcome activeTab="universal" />);
    expect(screen.queryByText('ai-assistant.welcome.config.action')).toBeNull();
  });

  it('selects the CONFIG agent from the list when "configure platform" is clicked', async () => {
    const agents = [
      { id: 'op', name: 'Op', engine: 'TOOL_LOOP' },
      { id: 'platform-config-agent', name: 'Platform config', engine: 'CONFIG' }
    ];
    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => agents });

    const onSelectAgent = jest.fn();
    render(<ChatWelcome activeTab="universal" onSelectAgent={onSelectAgent} />);

    await act(async () => {
      fireEvent.click(screen.getByText('ai-assistant.welcome.config.action'));
    });

    expect(global.fetch).toHaveBeenCalled();
    expect(onSelectAgent).toHaveBeenCalledWith(agents[1]);
  });

  it('prefers the agent matching PLATFORM_CONFIG_AGENT_ID over other CONFIG-engine agents', async () => {
    const agents = [
      { id: 'other-config', name: 'Other config', engine: 'CONFIG' },
      { id: 'platform-config-agent', name: 'Platform config', engine: 'CONFIG' }
    ];
    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => agents });

    const onSelectAgent = jest.fn();
    render(<ChatWelcome activeTab="universal" onSelectAgent={onSelectAgent} />);

    await act(async () => {
      fireEvent.click(screen.getByText('ai-assistant.welcome.config.action'));
    });

    expect(onSelectAgent).toHaveBeenCalledWith(agents[1]);
  });

  it('falls back to a minimal CONFIG descriptor and logs when the fetch throws', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    global.fetch.mockRejectedValueOnce(new Error('network'));

    const onSelectAgent = jest.fn();
    render(<ChatWelcome activeTab="universal" onSelectAgent={onSelectAgent} />);

    await act(async () => {
      fireEvent.click(screen.getByText('ai-assistant.welcome.config.action'));
    });

    // Asserting console.error fired pins the catch (network throw) path,
    // distinguishing it from the non-ok response path below.
    expect(consoleSpy).toHaveBeenCalled();
    expect(onSelectAgent).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'platform-config-agent', engine: 'CONFIG' })
    );
    consoleSpy.mockRestore();
  });

  it('falls back to a minimal CONFIG descriptor when the agent list responds non-ok', async () => {
    global.fetch.mockResolvedValueOnce({ ok: false, json: async () => ({}) });

    const onSelectAgent = jest.fn();
    render(<ChatWelcome activeTab="universal" onSelectAgent={onSelectAgent} />);

    await act(async () => {
      fireEvent.click(screen.getByText('ai-assistant.welcome.config.action'));
    });

    expect(onSelectAgent).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'platform-config-agent', engine: 'CONFIG' })
    );
  });
});
