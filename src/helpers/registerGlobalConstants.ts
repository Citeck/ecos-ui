import { SourcesId, URL } from '@citeck/constants';
import { MICRO_URI, PROXY_URI } from '@citeck/constants/alfresco';

/**
 * Exposes core constants on `window.Citeck.constants` for legacy consumers
 * (sagas, EcosForm, journal formatters, etc.). Previously this side effect lived
 * in `src/constants/index.js` / `alfresco/index.js`; it now runs explicitly at
 * app startup (and in test setup) instead of on constants-module import.
 */
export function registerGlobalConstants(): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.Citeck = window.Citeck || {};
  window.Citeck.constants = { PROXY_URI, MICRO_URI, ...window.Citeck.constants, URL, SourcesId };
}
