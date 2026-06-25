/**
 * Canonical list of standard Citeck `ecos-event:*` types that can be used as a Camel `from:`
 * trigger and offered as `eventName` suggestions.
 *
 * Single source of truth: both the new-route trigger catalog (`triggerCatalog.js`) and the
 * `eventName` suggestion provider (`CiteckSuggestionsBootstrap.jsx`) derive their lists from
 * this array. Add or rename an event type here and both stay in sync.
 *
 * NOTE: the `eventName` field help text in `public/camel-catalog-overrides/components.json`
 * also enumerates these names as prose — keep it in sync manually when this list changes.
 */
export const STANDARD_EVENT_NAMES = [
  'record-created',
  'record-changed',
  'record-status-changed',
  'record-deleted',
  'record-content-changed'
];
