import React from 'react';
import { act, render } from '@testing-library/react';

jest.mock('@kaoto/forms', () => ({
  useSuggestionRegistry: jest.fn()
}));

jest.mock('@citeck/records-core', () => ({
  __esModule: true,
  default: {
    query: jest.fn()
  }
}));

const Records = require('@citeck/records-core').default;
const { useSuggestionRegistry } = require('@kaoto/forms');

import CiteckSuggestionsBootstrap, {
  TTL_MS,
  cached,
  isCiteckSchema,
  leafName,
  buildRecordTypeProvider,
  buildEventTriggerProvider,
  buildSourceIdProvider,
  PROVIDER_IDS,
  RECORD_TYPE_PROPERTY_NAMES,
  SOURCE_ID_PROPERTY_NAME,
  EVENT_NAME_PROPERTY_NAME,
  STANDARD_EVENT_TRIGGERS,
  SUGGESTIONS_PAGE_SIZE,
  __testing__
} from '../CiteckSuggestionsBootstrap';

const CITECK_SCHEMA = { $comment: 'group:common|citeck' };
const NON_CITECK_SCHEMA = { $comment: 'group:common' };

describe('CiteckSuggestionsBootstrap', () => {
  beforeEach(() => {
    __testing__.clearCache();
    Records.query.mockReset();
    useSuggestionRegistry.mockReset();
  });

  describe('module exports', () => {
    test('default export is a React component', () => {
      expect(typeof CiteckSuggestionsBootstrap).toBe('function');
    });

    test('TTL_MS is 30_000 (30 seconds)', () => {
      expect(TTL_MS).toBe(30_000);
    });

    test('exports the expected provider ids and constants', () => {
      expect(PROVIDER_IDS).toEqual({
        recordType: 'citeck-record-type',
        eventTrigger: 'citeck-event-trigger',
        sourceId: 'citeck-source-id'
      });
      expect(RECORD_TYPE_PROPERTY_NAMES).toEqual(['recordType', 'typeRef']);
      expect(SOURCE_ID_PROPERTY_NAME).toBe('sourceId');
      expect(EVENT_NAME_PROPERTY_NAME).toBe('eventName');
      expect(STANDARD_EVENT_TRIGGERS).toEqual([
        'record-created',
        'record-changed',
        'record-status-changed',
        'record-deleted',
        'record-content-changed'
      ]);
    });
  });

  describe('cached(key, loader)', () => {
    test('miss: invokes loader and returns its value on first call', () => {
      const loader = jest.fn(() => 'value-A');
      const result = cached('key-1', loader);
      expect(result).toBe('value-A');
      expect(loader).toHaveBeenCalledTimes(1);
    });

    test('hit: does NOT invoke loader on second call within TTL', () => {
      const loader = jest.fn(() => 'value-B');
      const first = cached('key-2', loader);
      const second = cached('key-2', loader);
      expect(first).toBe('value-B');
      expect(second).toBe('value-B');
      expect(loader).toHaveBeenCalledTimes(1);
    });

    test('different keys are cached independently', () => {
      const loaderA = jest.fn(() => 'A');
      const loaderB = jest.fn(() => 'B');
      expect(cached('a', loaderA)).toBe('A');
      expect(cached('b', loaderB)).toBe('B');
      expect(cached('a', loaderA)).toBe('A');
      expect(cached('b', loaderB)).toBe('B');
      expect(loaderA).toHaveBeenCalledTimes(1);
      expect(loaderB).toHaveBeenCalledTimes(1);
    });

    test('expiration: invokes loader again after TTL elapsed', () => {
      const realNow = Date.now;
      let now = 1_000_000;
      Date.now = () => now;
      try {
        const loader = jest.fn().mockReturnValueOnce('first').mockReturnValueOnce('second');
        const first = cached('expiring', loader);
        now += TTL_MS - 1;
        const stillFresh = cached('expiring', loader);
        now += 2;
        const refreshed = cached('expiring', loader);
        expect(first).toBe('first');
        expect(stillFresh).toBe('first');
        expect(refreshed).toBe('second');
        expect(loader).toHaveBeenCalledTimes(2);
      } finally {
        Date.now = realNow;
      }
    });

    test('caches Promise values (loader returning a Promise is stored as-is)', async () => {
      const promise = Promise.resolve(['suggestion-1', 'suggestion-2']);
      const loader = jest.fn(() => promise);
      const a = cached('async-key', loader);
      const b = cached('async-key', loader);
      expect(a).toBe(promise);
      expect(b).toBe(promise);
      expect(loader).toHaveBeenCalledTimes(1);
      await expect(a).resolves.toEqual(['suggestion-1', 'suggestion-2']);
    });

    test('clearCache empties the cache (test-only helper)', () => {
      const loader = jest.fn(() => 'X');
      cached('clear-me', loader);
      __testing__.clearCache();
      cached('clear-me', loader);
      expect(loader).toHaveBeenCalledTimes(2);
    });

    test('rejected Promise: cache entry is evicted so next call retries within TTL', async () => {
      const loader = jest
        .fn()
        .mockImplementationOnce(() => Promise.reject(new Error('boom')))
        .mockImplementationOnce(() => Promise.resolve('recovered'));
      const first = cached('flaky', loader);
      await expect(first).rejects.toThrow('boom');
      // Loader retries on next call (cache evicted) — transient back-end error must not stick for TTL_MS.
      const second = cached('flaky', loader);
      await expect(second).resolves.toBe('recovered');
      expect(loader).toHaveBeenCalledTimes(2);
    });
  });

  describe('leafName(propertyName)', () => {
    test('returns the last segment of a dotted path', () => {
      expect(leafName('#.eventName')).toBe('eventName');
      expect(leafName('parameters.recordType')).toBe('recordType');
      expect(leafName('#.foo.bar.baz')).toBe('baz');
    });

    test('returns the input unchanged when no dot is present', () => {
      expect(leafName('eventName')).toBe('eventName');
    });

    test('returns empty string for non-string input (null/undefined/number)', () => {
      expect(leafName(null)).toBe('');
      expect(leafName(undefined)).toBe('');
      expect(leafName(42)).toBe('');
    });
  });

  describe('isCiteckSchema(schema)', () => {
    test('true when $comment includes "citeck" (Citeck discriminator)', () => {
      expect(isCiteckSchema({ $comment: 'group:common|citeck' })).toBe(true);
      expect(isCiteckSchema({ $comment: 'group:producer|citeck' })).toBe(true);
      expect(isCiteckSchema({ $comment: 'group:consumer|citeck' })).toBe(true);
    });

    test('true when $comment is a string containing "citeck" anywhere', () => {
      expect(isCiteckSchema({ $comment: 'foo citeck bar' })).toBe(true);
    });

    test('false when $comment is missing', () => {
      expect(isCiteckSchema({})).toBe(false);
    });

    test('false when $comment does not contain "citeck"', () => {
      expect(isCiteckSchema({ $comment: 'group:common' })).toBe(false);
      expect(isCiteckSchema({ $comment: 'group:producer' })).toBe(false);
    });

    test('false when schema is null/undefined (optional-chaining safe)', () => {
      expect(isCiteckSchema(null)).toBe(false);
      expect(isCiteckSchema(undefined)).toBe(false);
    });

    test('false when $comment is not a string (number/boolean/object)', () => {
      expect(isCiteckSchema({ $comment: 123 })).toBe(false);
      expect(isCiteckSchema({ $comment: true })).toBe(false);
      expect(isCiteckSchema({ $comment: { citeck: true } })).toBe(false);
    });
  });

  describe('buildRecordTypeProvider()', () => {
    test('id is "citeck-record-type"', () => {
      expect(buildRecordTypeProvider().id).toBe('citeck-record-type');
    });

    test('appliesTo: true for "recordType" with Citeck schema', () => {
      expect(buildRecordTypeProvider().appliesTo('recordType', CITECK_SCHEMA)).toBe(true);
    });

    test('appliesTo: true for "typeRef" with Citeck schema', () => {
      expect(buildRecordTypeProvider().appliesTo('typeRef', CITECK_SCHEMA)).toBe(true);
    });

    test('appliesTo: false for non-Citeck schema even if name matches', () => {
      expect(buildRecordTypeProvider().appliesTo('recordType', NON_CITECK_SCHEMA)).toBe(false);
      expect(buildRecordTypeProvider().appliesTo('typeRef', {})).toBe(false);
    });

    test('appliesTo: false for unrelated property name', () => {
      expect(buildRecordTypeProvider().appliesTo('something', CITECK_SCHEMA)).toBe(false);
      expect(buildRecordTypeProvider().appliesTo('eventName', CITECK_SCHEMA)).toBe(false);
    });

    test('appliesTo: matches Kaoto dotted-path form (#.recordType, parameters.typeRef)', () => {
      // Kaoto useSuggestions передаёт `propName` как `${parent}.${child}` начиная с ROOT_PATH '#'
      // (см. @kaoto/forms/dist/fields/ObjectField/ObjectFieldInner.js + KaotoForm.js).
      const provider = buildRecordTypeProvider();
      expect(provider.appliesTo('#.recordType', CITECK_SCHEMA)).toBe(true);
      expect(provider.appliesTo('#.typeRef', CITECK_SCHEMA)).toBe(true);
      expect(provider.appliesTo('parameters.recordType', CITECK_SCHEMA)).toBe(true);
      expect(provider.appliesTo('#.foo.recordType', CITECK_SCHEMA)).toBe(true);
      expect(provider.appliesTo('#.recordType', NON_CITECK_SCHEMA)).toBe(false);
      expect(provider.appliesTo('#.somethingElse', CITECK_SCHEMA)).toBe(false);
    });

    test('getSuggestions: queries emodel/type and maps records to {value=localId, description=disp, group}', async () => {
      Records.query.mockResolvedValueOnce({
        records: [
          { localId: 'news', disp: 'News' },
          { localId: 'task', disp: 'Task' }
        ]
      });
      const suggestions = await buildRecordTypeProvider().getSuggestions('', { propertyName: 'recordType', inputValue: '' });
      expect(Records.query).toHaveBeenCalledTimes(1);
      const [queryArg, attsArg] = Records.query.mock.calls[0];
      expect(queryArg.sourceId).toBe('emodel/type');
      expect(queryArg.page).toEqual({ maxItems: SUGGESTIONS_PAGE_SIZE });
      // Empty `word` → no language/predicate, full top-N page.
      expect(queryArg.query).toEqual({});
      expect(queryArg.language).toBeUndefined();
      expect(attsArg).toEqual({ localId: '?localId', disp: '?disp' });
      expect(suggestions).toEqual([
        { value: 'news', description: 'News', group: 'Citeck record types' },
        { value: 'task', description: 'Task', group: 'Citeck record types' }
      ]);
    });

    // Regression: previously getSuggestions ignored the `word` arg entirely and always pulled the
    // first SUGGESTIONS_PAGE_SIZE rows. On larger installations this hid valid types beyond the
    // first page since Kaoto only client-filters what the provider returns.
    test('getSuggestions: uses `word` to add server-side `_disp/localId contains` predicate', async () => {
      Records.query.mockResolvedValueOnce({ records: [{ localId: 'archived-task', disp: 'Archived Task' }] });
      const suggestions = await buildRecordTypeProvider().getSuggestions('arch', {
        propertyName: 'recordType',
        inputValue: 'arch'
      });
      const [queryArg] = Records.query.mock.calls[0];
      expect(queryArg.language).toBe('predicate');
      // `contains` — раздаёт штатный подстрочный поиск (бэкенд сам оборачивает в %…%), сырое слово без
      // ручного шаблона: прежний `like *arch*` искал литеральные звёздочки и не находил обычные данные.
      expect(queryArg.query).toEqual({
        t: 'or',
        val: [
          { att: '_disp', t: 'contains', val: 'arch' },
          { att: 'localId', t: 'contains', val: 'arch' }
        ]
      });
      expect(suggestions).toEqual([
        { value: 'archived-task', description: 'Archived Task', group: 'Citeck record types' }
      ]);
    });

    test('getSuggestions: cache key partitions by word so different inputs query independently', async () => {
      Records.query
        .mockResolvedValueOnce({ records: [{ localId: 'news', disp: 'News' }] })
        .mockResolvedValueOnce({ records: [{ localId: 'task', disp: 'Task' }] })
        .mockResolvedValueOnce({ records: [{ localId: 'task', disp: 'Task' }] });
      const provider = buildRecordTypeProvider();
      await provider.getSuggestions('', {});
      await provider.getSuggestions('tas', {});
      // Same `word` re-fetch — should hit cache, no new Records.query call.
      await provider.getSuggestions('tas', {});
      expect(Records.query).toHaveBeenCalledTimes(2);
    });

    test('getSuggestions: trims and lowercases word for cache normalization', async () => {
      Records.query.mockResolvedValueOnce({ records: [] });
      const provider = buildRecordTypeProvider();
      await provider.getSuggestions('  TaSk  ', {});
      // Whitespace+casing folded → second call hits cache.
      await provider.getSuggestions('task', {});
      expect(Records.query).toHaveBeenCalledTimes(1);
      const [queryArg] = Records.query.mock.calls[0];
      // Predicate value is the trimmed (original-case) word; backend `contains` is case-insensitive
      // (LOWER(col) LIKE LOWER('%TaSk%')), so matching works regardless of case.
      expect(queryArg.query.val[0].val).toBe('TaSk');
    });

    test('getSuggestions: falls back to localId when disp is missing/empty', async () => {
      Records.query.mockResolvedValueOnce({
        records: [
          { localId: 'no-disp' },
          { localId: 'empty-disp', disp: '' }
        ]
      });
      const suggestions = await buildRecordTypeProvider().getSuggestions('', {});
      expect(suggestions).toEqual([
        { value: 'no-disp', description: 'no-disp', group: 'Citeck record types' },
        { value: 'empty-disp', description: 'empty-disp', group: 'Citeck record types' }
      ]);
    });

    test('getSuggestions: filters out records without a localId', async () => {
      Records.query.mockResolvedValueOnce({
        records: [
          { disp: 'orphan' },
          { localId: 'ok', disp: 'Ok' },
          null
        ]
      });
      const suggestions = await buildRecordTypeProvider().getSuggestions('', {});
      expect(suggestions).toEqual([{ value: 'ok', description: 'Ok', group: 'Citeck record types' }]);
    });

    test('getSuggestions: returns [] on Records.query error (graceful failure)', async () => {
      Records.query.mockRejectedValueOnce(new Error('network'));
      const suggestions = await buildRecordTypeProvider().getSuggestions('', {});
      expect(suggestions).toEqual([]);
    });

    test('getSuggestions: deduplicates concurrent calls via TTL cache (single Records.query)', async () => {
      Records.query.mockResolvedValueOnce({ records: [{ localId: 'x', disp: 'X' }] });
      const provider = buildRecordTypeProvider();
      const [a, b] = await Promise.all([provider.getSuggestions('', {}), provider.getSuggestions('', {})]);
      expect(Records.query).toHaveBeenCalledTimes(1);
      expect(a).toEqual(b);
    });
  });

  describe('buildEventTriggerProvider()', () => {
    test('id is "citeck-event-trigger"', () => {
      expect(buildEventTriggerProvider().id).toBe('citeck-event-trigger');
    });

    test('appliesTo: true only for "eventName" with Citeck schema', () => {
      const provider = buildEventTriggerProvider();
      expect(provider.appliesTo('eventName', CITECK_SCHEMA)).toBe(true);
      expect(provider.appliesTo('eventName', NON_CITECK_SCHEMA)).toBe(false);
      expect(provider.appliesTo('recordType', CITECK_SCHEMA)).toBe(false);
    });

    test('appliesTo: matches Kaoto dotted-path form (#.eventName, parameters.eventName)', () => {
      const provider = buildEventTriggerProvider();
      expect(provider.appliesTo('#.eventName', CITECK_SCHEMA)).toBe(true);
      expect(provider.appliesTo('parameters.eventName', CITECK_SCHEMA)).toBe(true);
      expect(provider.appliesTo('#.eventName', NON_CITECK_SCHEMA)).toBe(false);
      expect(provider.appliesTo('#.recordType', CITECK_SCHEMA)).toBe(false);
    });

    test('getSuggestions: returns 5 hardcoded standard triggers (no network)', () => {
      const suggestions = buildEventTriggerProvider().getSuggestions('', { propertyName: 'eventName', inputValue: '' });
      expect(Records.query).not.toHaveBeenCalled();
      expect(suggestions).toEqual([
        { value: 'record-created', description: 'record-created', group: 'Citeck event triggers' },
        { value: 'record-changed', description: 'record-changed', group: 'Citeck event triggers' },
        { value: 'record-status-changed', description: 'record-status-changed', group: 'Citeck event triggers' },
        { value: 'record-deleted', description: 'record-deleted', group: 'Citeck event triggers' },
        { value: 'record-content-changed', description: 'record-content-changed', group: 'Citeck event triggers' }
      ]);
    });
  });

  describe('buildSourceIdProvider()', () => {
    test('id is "citeck-source-id"', () => {
      expect(buildSourceIdProvider().id).toBe('citeck-source-id');
    });

    test('appliesTo: true only for "sourceId" with Citeck schema', () => {
      const provider = buildSourceIdProvider();
      expect(provider.appliesTo('sourceId', CITECK_SCHEMA)).toBe(true);
      expect(provider.appliesTo('sourceId', NON_CITECK_SCHEMA)).toBe(false);
      expect(provider.appliesTo('recordType', CITECK_SCHEMA)).toBe(false);
    });

    test('appliesTo: matches Kaoto dotted-path form (#.sourceId, parameters.sourceId)', () => {
      const provider = buildSourceIdProvider();
      expect(provider.appliesTo('#.sourceId', CITECK_SCHEMA)).toBe(true);
      expect(provider.appliesTo('parameters.sourceId', CITECK_SCHEMA)).toBe(true);
      expect(provider.appliesTo('#.sourceId', NON_CITECK_SCHEMA)).toBe(false);
      expect(provider.appliesTo('#.recordType', CITECK_SCHEMA)).toBe(false);
    });

    test('getSuggestions: queries emodel/src with localId+disp atts', async () => {
      Records.query.mockResolvedValueOnce({ records: [{ localId: 'emodel/src/foo', disp: 'Foo' }] });
      const suggestions = await buildSourceIdProvider().getSuggestions('', {});
      const [queryArg] = Records.query.mock.calls[0];
      expect(queryArg.sourceId).toBe('emodel/src');
      expect(suggestions).toEqual([{ value: 'emodel/src/foo', description: 'Foo', group: 'Citeck source ids' }]);
    });

    test('getSuggestions: word-based predicate is applied to emodel/src queries too', async () => {
      Records.query.mockResolvedValueOnce({ records: [{ localId: 'emodel/src/persons', disp: 'Persons' }] });
      await buildSourceIdProvider().getSuggestions('pers', {});
      const [queryArg] = Records.query.mock.calls[0];
      expect(queryArg.language).toBe('predicate');
      expect(queryArg.query.t).toBe('or');
      expect(queryArg.query.val).toEqual([
        { att: '_disp', t: 'contains', val: 'pers' },
        { att: 'localId', t: 'contains', val: 'pers' }
      ]);
    });
  });

  describe('<CiteckSuggestionsBootstrap /> registration lifecycle', () => {
    test('registers all 3 providers on mount, unregisters all 3 on unmount', () => {
      const registry = {
        registerProvider: jest.fn(),
        unregisterProvider: jest.fn()
      };
      useSuggestionRegistry.mockReturnValue(registry);

      const { unmount } = render(React.createElement(CiteckSuggestionsBootstrap));

      expect(registry.registerProvider).toHaveBeenCalledTimes(3);
      const registeredIds = registry.registerProvider.mock.calls.map(call => call[0].id);
      expect(registeredIds).toEqual(['citeck-record-type', 'citeck-event-trigger', 'citeck-source-id']);

      act(() => {
        unmount();
      });

      expect(registry.unregisterProvider).toHaveBeenCalledTimes(3);
      const unregisteredIds = registry.unregisterProvider.mock.calls.map(call => call[0]);
      expect(unregisteredIds).toEqual(['citeck-record-type', 'citeck-event-trigger', 'citeck-source-id']);
    });

    test('renders null without throwing', () => {
      useSuggestionRegistry.mockReturnValue(null);
      const { container } = render(React.createElement(CiteckSuggestionsBootstrap));
      expect(container.firstChild).toBeNull();
    });

    test('handles missing registry gracefully (no register/unregister calls)', () => {
      useSuggestionRegistry.mockReturnValue(null);
      const { unmount } = render(React.createElement(CiteckSuggestionsBootstrap));
      expect(() => unmount()).not.toThrow();
    });
  });
});
