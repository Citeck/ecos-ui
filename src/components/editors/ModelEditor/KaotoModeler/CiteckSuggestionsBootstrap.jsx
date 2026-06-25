import { useSuggestionRegistry } from '@kaoto/forms';
import React, { useEffect } from 'react';

import Records from '@citeck/records-core';

import { STANDARD_EVENT_NAMES } from './ecosEvents';

// Bootstrap component for registering Citeck SuggestionRegistryProviders in Kaoto.
// Mounted in KaotoModeler inside `<SuggestionRegistryProvider>` (see Task 15).

export const TTL_MS = 30_000;

// Map<string, { ts: number, value: unknown }>. The value is whatever the loader returned,
// including a Promise (Suggestion[] in the final version); a single object is cached so that
// concurrent calls reuse one in-flight request.
const cache = new Map();

export function cached(key, loader) {
  const now = Date.now();
  const entry = cache.get(key);
  if (entry && now - entry.ts < TTL_MS) {
    return entry.value;
  }
  const value = loader();
  cache.set(key, { ts: now, value });
  // If the loader returned a rejected Promise, drop the cache entry so the next call re-fetches
  // (otherwise a transient backend error would be cached for TTL_MS with no chance to retry).
  if (value && typeof value.then === 'function') {
    value.then(undefined, () => {
      const cur = cache.get(key);
      if (cur && cur.value === value) cache.delete(key);
    });
  }
  return value;
}

export function isCiteckSchema(schema) {
  return typeof schema?.$comment === 'string' && schema.$comment.includes('citeck');
}

// Kaoto passes the FULL dotted-path into `provider.appliesTo(propertyName, schema)`
// (`#.eventName`, `parameters.recordType`), not the leaf name. Source of truth:
// `@kaoto/forms/dist/fields/ObjectField/ObjectFieldInner.js` builds `${propName}.${propertyName}`,
// and the root `propName` is `ROOT_PATH = '#'` (`@kaoto/forms/dist/utils/get-value.js`).
// To match by field name we compare the last segment of the path.
export function leafName(propertyName) {
  return typeof propertyName === 'string' ? propertyName.split('.').pop() : '';
}

export const RECORD_TYPE_PROPERTY_NAMES = ['recordType', 'typeRef'];
export const SOURCE_ID_PROPERTY_NAME = 'sourceId';
export const EVENT_NAME_PROPERTY_NAME = 'eventName';

// Re-export the canonical event-name list (single source of truth — see ecosEvents.js).
// Kept under the existing name so the eventName suggestion provider and tests stay unchanged.
export const STANDARD_EVENT_TRIGGERS = STANDARD_EVENT_NAMES;

export const PROVIDER_IDS = {
  recordType: 'citeck-record-type',
  eventTrigger: 'citeck-event-trigger',
  sourceId: 'citeck-source-id'
};

export const SUGGESTIONS_PAGE_SIZE = 200;

// Without `word` — the general top-N list (`page.maxItems = 200`). With `word` — we add a server-side
// `_disp like *word*` OR `localId like *word*` predicate so that records beyond the top-N
// also become visible as the user types. We cache by (sourceId, normalized word) so that
// concurrent re-fetches on every keystroke (Kaoto calls getSuggestions when value changes)
// do not hit the backend.
function queryEmodelSuggestions(sourceId, group, word) {
  const trimmed = typeof word === 'string' ? word.trim() : '';
  const cacheKey = trimmed ? `emodel:${sourceId}:${trimmed.toLowerCase()}` : `emodel:${sourceId}`;
  const promise = cached(cacheKey, () => {
    const queryBody = {
      sourceId,
      page: { maxItems: SUGGESTIONS_PAGE_SIZE }
    };
    if (trimmed) {
      // `contains` is the platform's standard substring search: the backend wraps the value in
      // `%…%` itself and runs `LOWER(col) LIKE LOWER(?)` (DbEntityRepoPg). We pass the raw `trimmed`
      // without building a template manually: the previous `*${trimmed}*` via `like` searched for
      // LITERAL asterisks (there is no `*`→`%` conversion in the predicate layer), so it produced
      // no matches against normal data.
      queryBody.language = 'predicate';
      queryBody.query = {
        t: 'or',
        val: [
          { att: '_disp', t: 'contains', val: trimmed },
          { att: 'localId', t: 'contains', val: trimmed }
        ]
      };
    } else {
      queryBody.query = {};
    }
    return Records.query(queryBody, {
      localId: '?localId',
      disp: '?disp'
    }).then(res => {
      const records = (res && res.records) || [];
      return records
        .filter(rec => rec && typeof rec.localId === 'string' && rec.localId.length > 0)
        .map(rec => ({
          value: rec.localId,
          description: typeof rec.disp === 'string' && rec.disp.length > 0 ? rec.disp : rec.localId,
          group
        }));
    });
  });
  return promise.catch(() => []);
}

export function buildRecordTypeProvider() {
  return {
    id: PROVIDER_IDS.recordType,
    appliesTo: (propertyName, schema) =>
      RECORD_TYPE_PROPERTY_NAMES.includes(leafName(propertyName)) && isCiteckSchema(schema),
    getSuggestions: word => queryEmodelSuggestions('emodel/type', 'Citeck record types', word)
  };
}

export function buildEventTriggerProvider() {
  return {
    id: PROVIDER_IDS.eventTrigger,
    appliesTo: (propertyName, schema) =>
      leafName(propertyName) === EVENT_NAME_PROPERTY_NAME && isCiteckSchema(schema),
    getSuggestions: () =>
      STANDARD_EVENT_TRIGGERS.map(value => ({
        value,
        description: value,
        group: 'Citeck event triggers'
      }))
  };
}

export function buildSourceIdProvider() {
  return {
    id: PROVIDER_IDS.sourceId,
    appliesTo: (propertyName, schema) =>
      leafName(propertyName) === SOURCE_ID_PROPERTY_NAME && isCiteckSchema(schema),
    getSuggestions: word => queryEmodelSuggestions('emodel/src', 'Citeck source ids', word)
  };
}

// Test-only helpers — exported for direct access from unit tests.
// Not for use in production code.
export const __testing__ = {
  cache,
  clearCache: () => cache.clear()
};

const CiteckSuggestionsBootstrap = () => {
  const registry = useSuggestionRegistry();

  useEffect(() => {
    if (!registry) {
      return undefined;
    }
    const providers = [buildRecordTypeProvider(), buildEventTriggerProvider(), buildSourceIdProvider()];
    providers.forEach(provider => registry.registerProvider(provider));
    return () => {
      providers.forEach(provider => registry.unregisterProvider(provider.id));
    };
  }, [registry]);

  return null;
};

export default CiteckSuggestionsBootstrap;
