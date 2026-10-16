import ParserPredicate from '../ParserPredicate';

const defaults = (type: string, predicate: any) =>
  ParserPredicate.getDefaultPredicates([{ attribute: 'startDate', type }], undefined, [predicate]);
const leaf = (predicate: any) => predicate.val[0].val[0].val[0];

describe('date range defaults', () => {
  it.each(['date', 'datetime'])('opens the interval editor for a server %s range without changing its query', type => {
    const predicate = { t: 'eq', att: 'startDate', val: '-P1M/$NOW' };
    const result = defaults(type, predicate);
    expect(leaf(result)).toEqual({ ...predicate, t: 'time-interval' });
    expect(leaf(ParserPredicate.replacePredicateType(result))).toEqual(predicate);
    expect(predicate.t).toBe('eq');
  });

  it('also supports absolute ranges', () => {
    const predicate = { t: 'eq', att: 'startDate', val: '2026-09-01/2026-10-01' };
    expect(leaf(defaults('date', predicate))).toEqual({ ...predicate, t: 'time-interval' });
  });

  it.each([
    ['datetime', 'eq', '2026-10-01T12:00:00Z'],
    ['datetime', 'ge', '-P1M'],
    ['datetime', 'eq', '/$NOW'],
    ['datetime', 'eq', '-P1M/'],
    ['datetime', 'eq', 'a/b/c'],
    ['text', 'eq', 'a/b']
  ])('preserves a %s %s default %s', (type, t, val) => {
    const predicate = { t, att: 'startDate', val };
    expect(leaf(defaults(type, predicate))).toEqual(predicate);
  });
});
