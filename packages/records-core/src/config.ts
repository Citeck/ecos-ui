import { RecordsAdapters } from './adapters/types';

let adapters: RecordsAdapters | null = null;

/**
 * Inject platform adapters. Must be called once at app startup, before any
 * Records API usage.
 *
 * @example web
 * configure({
 *   http: ecosFetch,
 *   i18n: { t },
 *   workspace: { getWorkspaceId, getEnabledWorkspaces, getCurrentRecordRef },
 *   storage: window.localStorage
 * });
 *
 * @example react-native
 * configure({
 *   http: rnFetch,
 *   i18n: { t: (k) => k },
 *   workspace: { getWorkspaceId: () => 'default', getEnabledWorkspaces: () => false }
 * });
 */
export function configure(next: RecordsAdapters): void {
  adapters = next;
}

export function isConfigured(): boolean {
  return adapters !== null;
}

export function getConfig(): RecordsAdapters {
  if (!adapters) {
    throw new Error(
      '@citeck/records-core is not configured. Call configure({ http, i18n, workspace }) at app startup before using the Records API.'
    );
  }
  return adapters;
}
