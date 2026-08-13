import { act, render, screen } from '@testing-library/react';
import React from 'react';

import AIAssistantButton from '../AIAssistantButton';
import aiAssistantService from '../AIAssistantService';

jest.mock('../AIAssistantService', () => ({
  __esModule: true,
  default: {
    isOpen: false,
    isAvailable: jest.fn(),
    checkAvailability: jest.fn(),
    toggleChat: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addAvailabilityListener: jest.fn(),
    removeAvailabilityListener: jest.fn()
  }
}));

jest.mock('@/helpers/export/util', () => ({
  t: key => key
}));

jest.mock('@/components/common/icons/global/AiAssistant', () => ({
  __esModule: true,
  default: () => <svg data-testid="ai-icon" />
}));

describe('AIAssistantButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('has an accessible name on the button', async () => {
    aiAssistantService.isAvailable.mockResolvedValue(true);

    render(<AIAssistantButton />);

    const button = await screen.findByRole('button', { name: 'ai-assistant.button.open' });
    expect(button.getAttribute('title')).toBe('ai-assistant.button.open');
  });

  it('has no icon attribute in the button markup', async () => {
    aiAssistantService.isAvailable.mockResolvedValue(true);

    render(<AIAssistantButton />);

    const button = await screen.findByRole('button', { name: 'ai-assistant.button.open' });
    expect(button.hasAttribute('icon')).toBe(false);
    expect(screen.getByTestId('ai-icon')).toBeTruthy();
  });

  it('renders nothing while the availability check is pending', () => {
    aiAssistantService.isAvailable.mockReturnValue(new Promise(() => {}));

    const { container } = render(<AIAssistantButton />);

    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when the assistant is unavailable', async () => {
    aiAssistantService.isAvailable.mockResolvedValue(false);

    const { container } = render(<AIAssistantButton />);
    // flush the resolved availability promise so the loading state has settled
    await act(async () => {});

    expect(container.firstChild).toBeNull();
  });
});
