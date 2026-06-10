import KanbanConverter, { buildBoardCardsFilter, getAfterCardRef } from '../kanban';

describe('buildBoardCardsFilter', () => {
  it('returns null when no parts', () => {
    expect(buildBoardCardsFilter([null, undefined, []])).toBeNull();
  });
  it('returns the single predicate unwrapped', () => {
    expect(buildBoardCardsFilter([{ t: 'eq', att: 'a', val: 1 }])).toEqual({ t: 'eq', att: 'a', val: 1 });
  });
  it('flattens arrays and ANDs multiple', () => {
    expect(buildBoardCardsFilter([[{ t: 'eq', att: 'a', val: 1 }], { t: 'eq', att: 'b', val: 2 }])).toEqual({
      t: 'and',
      v: [
        { t: 'eq', att: 'a', val: 1 },
        { t: 'eq', att: 'b', val: 2 }
      ]
    });
  });
});

describe('getAdditionalFilter', () => {
  const get = KanbanConverter.getAdditionalFilter;

  it('returns undefined for a column with no filter config', () => {
    expect(get(undefined)).toBeUndefined();
    expect(get({ id: 'OPEN' })).toBeUndefined();
  });

  it('returns the server-computed additionalFilter (the single source of the column filter rule)', () => {
    const predicate = { t: 'ge', att: '_statusModified', val: '-P30D' };
    expect(get({ id: 'OPEN', additionalFilter: predicate })).toEqual(predicate);
  });

  it('does NOT derive the cutoff from legacy hideOldItems fields — the server computes the rule', () => {
    expect(get({ id: 'OPEN', hideOldItems: true, hideItemsOlderThan: 'P30D' })).toBeUndefined();
  });
});

describe('getAfterCardRef', () => {
  const recs = [{ id: 'c1' }, { id: 'c2' }, { id: 'c3' }];
  it('returns null for top insert', () => {
    expect(getAfterCardRef(recs, 0, 'cX')).toBeNull();
  });
  it('cross-column: anchor is the card above the slot', () => {
    expect(getAfterCardRef(recs, 2, 'cX')).toBe('c2');
  });
  it('same-column: excludes the moved card before indexing', () => {
    // moving c1 down to index 2 in [c1,c2,c3]: list w/o c1 = [c2,c3], anchor at 2-1=1 -> c3
    expect(getAfterCardRef(recs, 2, 'c1')).toBe('c3');
  });
  it('falls back to last loaded card when slot is past the end', () => {
    expect(getAfterCardRef(recs, 99, 'cX')).toBe('c3');
  });
  it('supports cardId fallback when id is absent', () => {
    expect(getAfterCardRef([{ cardId: 'k1' }, { cardId: 'k2' }], 1, 'kX')).toBe('k1');
  });
});
