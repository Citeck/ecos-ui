/**
 * Platform adapters injected by the consumer (web app, react-native, node).
 * The core never touches `window`, `document`, `localStorage`, `fetch` or i18n
 * directly — everything goes through these interfaces.
 */

/** Minimal response contract — compatible with the WHATWG `fetch` Response. */
export interface HttpResponse {
  ok: boolean;
  status: number;
  statusText: string;
  json(): Promise<any>;
  text?(): Promise<string>;
}

export interface HttpRequestOptions {
  method: string;
  body?: any;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

/**
 * HTTP transport. Web supplies `ecosFetch`; RN supplies a `fetch` wrapper.
 * Implementations are responsible for base URL / auth / JSON serialization
 * conventions used by the host platform.
 */
export type HttpClient = (url: string, options: HttpRequestOptions) => Promise<HttpResponse>;

/** Optional key/value store for feature flags (e.g. records-api debug). */
export interface KeyValueStorage {
  getItem(key: string): string | null;
}

/** Translation function — web supplies `t` from i18n; RN supplies its own. */
export interface I18n {
  t(key: string, params?: Record<string, unknown>): string;
}

/** Host-specific workspace / routing context. */
export interface WorkspaceProvider {
  getWorkspaceId(): string;
  getEnabledWorkspaces(): boolean;
  /** Current record ref derived from host routing (web: URL query). Optional. */
  getCurrentRecordRef?(): string | undefined;
}

export interface RecordsAdapters {
  http: HttpClient;
  i18n: I18n;
  workspace: WorkspaceProvider;
  /** Optional — when absent, the debug feature flag is treated as off. */
  storage?: KeyValueStorage;
}
