import { act, renderHook } from '@testing-library/react';

import aiAssistantService from '../AIAssistantService';
import useWindowManagement from '../hooks/useWindowManagement';

jest.mock('../AIAssistantService', () => ({
  __esModule: true,
  default: {
    isOpen: false,
    isMinimized: false,
    listeners: [],
    addListener(listener) {
      this.listeners.push(listener);
    },
    removeListener(listener) {
      this.listeners = this.listeners.filter(item => item !== listener);
    },
    notify() {
      this.listeners.forEach(listener => listener(this.isOpen, this.isMinimized));
    },
    // The real `toggleChat`: an open panel is minimized, never closed
    toggleChat() {
      if (!this.isOpen) {
        this.isOpen = true;
        this.isMinimized = false;
      } else {
        this.isMinimized = !this.isMinimized;
      }
      this.notify();
    },
    closeChat() {
      this.isOpen = false;
      this.isMinimized = false;
      this.notify();
    },
    toggleMinimize() {
      this.isMinimized = !this.isMinimized;
      this.notify();
      return this.isMinimized;
    }
  }
}));

describe('useWindowManagement', () => {
  beforeEach(() => {
    aiAssistantService.isOpen = false;
    aiAssistantService.isMinimized = false;
    aiAssistantService.listeners = [];
  });

  it('follows the service state', () => {
    const { result } = renderHook(() => useWindowManagement());

    expect(result.current.isOpen).toBe(false);
    expect(result.current.isVisible).toBe(false);

    act(() => aiAssistantService.toggleChat());

    expect(result.current.isOpen).toBe(true);
    expect(result.current.isVisible).toBe(true);
  });

  // What the D-B-14 request restoration is keyed on. `isOpen` stays true through a minimize, so the
  // toolbar button and the `Alt+I` shortcut — which minimize rather than close — produced no
  // false→true transition at all, and the hint «закройте и снова откройте панель» was answered by
  // nothing but the `×` in the chat header.
  it('reports the minimized panel as not visible, and un-minimizing as visible again', () => {
    const { result } = renderHook(() => useWindowManagement());

    act(() => aiAssistantService.toggleChat());
    act(() => aiAssistantService.toggleChat());

    expect(result.current.isOpen).toBe(true);
    expect(result.current.isMinimized).toBe(true);
    expect(result.current.isVisible).toBe(false);

    act(() => aiAssistantService.toggleChat());

    expect(result.current.isVisible).toBe(true);
  });

  it('reports the panel minimized from its own button as not visible', () => {
    const { result } = renderHook(() => useWindowManagement());

    act(() => aiAssistantService.toggleChat());
    act(() => {
      result.current.handleMinimize();
    });

    expect(result.current.isVisible).toBe(false);

    act(() => {
      result.current.handleMinimize();
    });

    expect(result.current.isVisible).toBe(true);
  });

  it('reports a closed panel as not visible', () => {
    const { result } = renderHook(() => useWindowManagement());

    act(() => aiAssistantService.toggleChat());
    act(() => {
      result.current.handleClose();
    });

    expect(result.current.isOpen).toBe(false);
    expect(result.current.isVisible).toBe(false);
  });
});
