import { buildOnlyLinkedPredicate, getOnlyLinkedConfig } from '../onlyLinked';

const recordRef = 'emodel/request@request-1';

describe('getOnlyLinkedConfig', () => {
  it('per-journal flag wins over the legacy flat one', () => {
    const config = { onlyLinked: false, onlyLinkedJournals: { candidates: true } };

    expect(getOnlyLinkedConfig(config, 'candidates').onlyLinked).toBe(true);
    expect(getOnlyLinkedConfig(config, 'other').onlyLinked).toBe(false);
  });

  it('falls back to the flat flag when the journal has no own value', () => {
    expect(getOnlyLinkedConfig({ onlyLinked: true, onlyLinkedJournals: {} }, 'candidates').onlyLinked).toBe(true);
  });

  it('per-journal attrsToLoad wins, flat list is the fallback', () => {
    const perJournal = { attrsToLoad: { candidates: [{ value: 'request' }] } };
    expect(getOnlyLinkedConfig(perJournal, 'candidates').attrsToLoad).toEqual([{ value: 'request' }]);

    const flat = { attrsToLoad: [{ value: 'author' }] };
    expect(getOnlyLinkedConfig(flat, 'candidates').attrsToLoad).toEqual([{ value: 'author' }]);
  });

  it('a journal missing from the per-journal map falls through to the raw value (not an array)', () => {
    // Kept as-is from the journal widget: consumers filter it out with isArray, so a per-journal
    // map leaking through for a foreign journal means "no attributes", not a broken predicate.
    const perJournal = { attrsToLoad: { candidates: [{ value: 'request' }] } };

    expect(Array.isArray(getOnlyLinkedConfig(perJournal, 'other').attrsToLoad)).toBe(false);
    expect(buildOnlyLinkedPredicate({ onlyLinked: true, recordRef, ...getOnlyLinkedConfig(perJournal, 'other') })).toBeNull();
  });

  it('empty config resolves to nothing', () => {
    expect(getOnlyLinkedConfig(null, undefined)).toEqual({ onlyLinked: undefined, attrsToLoad: undefined });
  });
});

describe('buildOnlyLinkedPredicate', () => {
  it('builds OR[CONTAINS(attr, recordRef)] from the chosen attributes', () => {
    const predicate = buildOnlyLinkedPredicate({
      onlyLinked: true,
      attrsToLoad: [{ value: 'request' }, { value: 'parent' }],
      recordRef
    });

    expect(predicate).toEqual({
      t: 'or',
      val: [
        { t: 'contains', att: 'request', val: recordRef },
        { t: 'contains', att: 'parent', val: recordRef }
      ]
    });
  });

  it('custom journal mode takes every searchable assoc column', () => {
    const columns = [
      { attribute: 'request', type: 'assoc', searchable: true },
      { attribute: 'hidden', type: 'assoc', searchable: false },
      { attribute: 'name', type: 'text', searchable: true }
    ];

    const predicate = buildOnlyLinkedPredicate({
      onlyLinked: true,
      attrsToLoad: [{ value: 'ignored-in-custom-mode' }],
      recordRef,
      columns,
      isCustomJournalMode: true
    });

    expect(predicate).toEqual({ t: 'or', val: [{ t: 'contains', att: 'request', val: recordRef }] });
  });

  it('returns null when the filter is not applicable', () => {
    const attrsToLoad = [{ value: 'request' }];

    expect(buildOnlyLinkedPredicate({ onlyLinked: false, attrsToLoad, recordRef })).toBeNull();
    expect(buildOnlyLinkedPredicate({ onlyLinked: true, attrsToLoad, recordRef: undefined })).toBeNull();
    // no attributes chosen and not in custom mode — nothing to build the predicate from
    expect(buildOnlyLinkedPredicate({ onlyLinked: true, recordRef })).toBeNull();
  });
});
