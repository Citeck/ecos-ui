import { buildTotalSumQuery } from '../journals';

/**
 * The footer sum has to count the rows the table counts. The table's own query is already known —
 * the loader returns it and it is kept in `grid.query` — so the sum reuses it instead of rebuilding
 * it from parts and losing whatever the footer never knew about (COREDEV-87: the source used to be
 * guessed from the journal type ref, and a third of the journals on a stand answered with nothing).
 */

/**
 * A FACTORY, not a constant: a shared fixture would hide exactly the defect the last test of the
 * first block looks for — a builder that strips `page`/`sortBy` off the caller's object in place
 * would leave every later assertion comparing the mutated fixture with itself.
 */
const gridQuery = (overrides = {}) => ({
  sourceId: 'emodel/ept-issue',
  language: 'predicate',
  consistency: 'EVENTUAL',
  query: {
    t: 'and',
    val: [
      { t: 'eq', att: '_type', val: 'emodel/type@ept-issue' },
      { t: 'contains', att: '_name', val: 'TEST2' }
    ]
  },
  page: { maxItems: 10, skipCount: 20, page: 3 },
  sortBy: [{ attribute: '_created', ascending: false }],
  groupBy: [],
  workspaces: ['TEST2'],
  ...overrides
});

describe('buildTotalSumQuery — the table query it reuses', () => {
  it('sums through the very query the table has run', () => {
    const result = buildTotalSumQuery({ gridQuery: gridQuery(), sourceId: 'emodel/wrong-guess' });

    expect(result.sourceId).toBe('emodel/ept-issue');
    expect(result.language).toBe('predicate');
    expect(result.consistency).toBe('EVENTUAL');
    expect(result.workspaces).toEqual(['TEST2']);
    expect(result.query).toEqual(gridQuery().query);
  });

  it('turns the page request into an aggregate: no page, no sorting', () => {
    const result = buildTotalSumQuery({ gridQuery: gridQuery() });

    expect(result).not.toHaveProperty('page');
    expect(result).not.toHaveProperty('sortBy');
  });

  /**
   * The table may be grouped by a column; the sum is over the whole result set, never per group.
   */
  it('groups by everything even when the table groups by a column', () => {
    expect(buildTotalSumQuery({ gridQuery: gridQuery() }).groupBy).toEqual(['*']);
    expect(buildTotalSumQuery({ gridQuery: gridQuery({ groupBy: ['assignee'] }) }).groupBy).toEqual(['*']);
  });

  /**
   * `predicate-with-data` is a different language with a payload attached to the predicate: sending
   * the predicate without its `data` (or under the plain `predicate` language) resolves to nothing.
   */
  it('carries a predicate-with-data query over whole', () => {
    const query = {
      data: { recordRef: 'emodel/request@req-1' },
      predicate: { t: 'eq', att: 'assignee', val: '$CURRENT' }
    };

    const result = buildTotalSumQuery({ gridQuery: gridQuery({ language: 'predicate-with-data', query }) });

    expect(result.language).toBe('predicate-with-data');
    expect(result.query).toEqual(query);
  });

  /**
   * The table predicate has already been through the whole loader pipeline. Cleaning it again can
   * invert its OR branches — an empty leaf is `true` under AND and `false` under OR — so it travels
   * untouched, empty leaves included.
   */
  it('does not re-normalize the table predicate', () => {
    const query = {
      t: 'or',
      val: [
        { t: 'eq', att: 'assignee', val: '' },
        { t: 'eq', att: 'priority', val: '200_high' }
      ]
    };

    expect(buildTotalSumQuery({ gridQuery: gridQuery({ query }) }).query).toEqual(query);
  });

  it('does not mutate the query it was handed (the store owns it)', () => {
    const executed = gridQuery();

    buildTotalSumQuery({ gridQuery: executed });

    expect(executed).toEqual(gridQuery());
  });
});

describe('buildTotalSumQuery — the fallback for a caller with no executed query', () => {
  const predicates = [{ t: 'eq', att: 'priority', val: '200_high' }];

  it('builds the plain aggregate query against the source it is handed', () => {
    const result = buildTotalSumQuery({
      sourceId: 'uiserv/journal-records',
      predicates,
      workspaces: ['TEST2']
    });

    expect(result).toEqual({
      sourceId: 'uiserv/journal-records',
      query: { t: 'eq', att: 'priority', val: '200_high' },
      language: 'predicate',
      groupBy: ['*'],
      workspaces: ['TEST2']
    });
  });

  it('cleans and type-normalizes the predicates the way the saga always has', () => {
    const result = buildTotalSumQuery({
      sourceId: 'emodel/ept-issue',
      predicates: [
        { t: 'eq', att: 'assignee', val: '' },
        { t: 'time-interval', att: 'created', val: '-P7D' },
        { t: 'eq', att: 'amount', val: '100' }
      ],
      columns: [{ attribute: 'amount', type: 'int' }],
      workspaces: ['TEST2']
    });

    expect(result.query).toEqual({
      t: 'and',
      val: [
        // replacePredicatesType: an open-ended interval becomes an explicit `<from>/$NOW`
        { t: 'eq', att: 'created', val: '-P7D/$NOW' },
        // convertAttributeValues: an int column gets a number, not the string the filter form holds
        { t: 'eq', att: 'amount', val: 100 }
      ]
    });
  });

  it('takes the fallback when the executed query has no source of its own', () => {
    const result = buildTotalSumQuery({
      gridQuery: gridQuery({ sourceId: '' }),
      sourceId: 'emodel/ept-issue',
      predicates,
      workspaces: ['TEST2']
    });

    expect(result.sourceId).toBe('emodel/ept-issue');
    expect(result.language).toBe('predicate');
  });

  /**
   * The predicates come straight out of the store. `removeEmptyPredicates` rewrites the `val` of
   * every CONTAINER it walks in place, so a nested filter group is what makes the missing copy
   * visible — a flat list of leaves would come back untouched either way.
   */
  it('does not mutate the predicates it was handed', () => {
    const shared = [
      {
        t: 'and',
        val: [
          { t: 'eq', att: 'assignee', val: '' },
          { t: 'eq', att: 'priority', val: '200_high' }
        ]
      }
    ];

    buildTotalSumQuery({ sourceId: 'emodel/ept-issue', predicates: shared, workspaces: ['TEST2'] });

    expect(shared[0].val).toHaveLength(2);
    expect(shared[0].val[0]).toEqual({ t: 'eq', att: 'assignee', val: '' });
  });
});

/**
 * Without a source there is nothing honest to ask for. An empty footer beats a sum taken from
 * someone else's source — the bug this whole builder exists for.
 */
describe('buildTotalSumQuery — nothing to query', () => {
  it('asks for no sum when neither the executed query nor the caller names a source', () => {
    expect(buildTotalSumQuery({ predicates: [{ t: 'eq', att: 'priority', val: '200_high' }] })).toBeNull();
    expect(buildTotalSumQuery({ gridQuery: gridQuery({ sourceId: undefined }) })).toBeNull();
    expect(buildTotalSumQuery({})).toBeNull();
  });
});
