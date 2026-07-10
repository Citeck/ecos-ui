import { useCallback, useState } from 'react';

import { DISPLAY_MODES, DisplayMode, LS_DISPLAY_MODE_KEY } from '../constants';

function loadInitialMode(isMobile: boolean): DisplayMode {
  try {
    const saved = localStorage.getItem(LS_DISPLAY_MODE_KEY);

    if (saved === DISPLAY_MODES.LIST || saved === DISPLAY_MODES.GRID) {
      return saved;
    }
  } catch {
    // localStorage is unavailable — fall through to defaults
  }

  return isMobile ? DISPLAY_MODES.GRID : DISPLAY_MODES.LIST;
}

export function useDisplayMode(isMobile: boolean) {
  const [displayMode, setMode] = useState<DisplayMode>(() => loadInitialMode(isMobile));

  const setDisplayMode = useCallback((mode: DisplayMode) => {
    setMode(mode);

    try {
      localStorage.setItem(LS_DISPLAY_MODE_KEY, mode);
    } catch {
      // ignore persistence errors
    }
  }, []);

  return { displayMode, setDisplayMode };
}
