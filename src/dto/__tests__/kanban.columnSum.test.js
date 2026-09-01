import { buildColumnSumQuery, guessTypeSourceId } from '../kanban';

/**
 * The cards of a column/cell are loaded through the `board-cards` source, where the SERVER adds the
 * journal predicate and the type scope. The sum banner goes straight to the record source, so it has
 * to reproduce that scope itself — otherwise it sums records that can never appear on the board
 * ("no cards, but a sum is shown", COREDEV-87).
 */

const COLUMN = { id: 'review', hasSum: true, sumAtt: 'eptNumber' };

const JOURNAL_PREDICATE = {
  t: 'and',
  val: [
    { t: 'eq', att: '_type', val: 'emodel/type@ept-issue' },
    { t: 'eq', att: 'sprint._status', val: 'in-progress' }
  ]
};

const base = {
  column: COLUMN,
  sourceId: 'emodel/ept-issue',
  ecosType: 'ept-issue',
  workspaceId: 'TEST2'
};

describe('buildColumnSumQuery', () => {
  it('always scopes the sum to the column status', () => {
    const { query, language, workspaces, groupBy } = buildColumnSumQuery(base);

    expect(query).toEqual({ t: 'and', v: [{ t: 'eq', a: '_status', v: 'review' }] });
    expect(language).toBe('predicate');
    expect(workspaces).toEqual(['TEST2']);
    expect(groupBy).toEqual(['*']);
  });

  it('includes the journal predicate as is', () => {
    const { query } = buildColumnSumQuery({ ...base, journalPredicate: JOURNAL_PREDICATE });

    expect(query.v).toContainEqual(JOURNAL_PREDICATE);
  });

  /**
   * The caller (Kanban's `mapStateToProps`) is the single owner of the "which source / which type"
   * rule — only it knows whether the board is backed by the journal the page has loaded. The builder
   * never second-guesses it: whatever it is handed is what gets queried.
   */
  it('queries exactly the source it is handed', () => {
    expect(buildColumnSumQuery({ ...base, sourceId: 'emodel/ept-issue' }).sourceId).toBe('emodel/ept-issue');
    // A journal whose source is not derivable from the type ref at all.
    expect(buildColumnSumQuery({ ...base, sourceId: 'uiserv/journal-records' }).sourceId).toBe('uiserv/journal-records');
  });

  /**
   * The server ships the card type with every board-cards request (`withEcosType`): the source is a
   * generic DAO that resolves attributes THROUGH the type, and the sum is type-specific by nature —
   * `sum(<sumAtt>)` and predicates over associations (`sprint._status`) resolve to nothing without it.
   */
  it('sends the card type so the generic source can resolve type-specific attributes', () => {
    expect(buildColumnSumQuery({ ...base, ecosType: 'ept-issue' }).ecosType).toBe('ept-issue');
  });

  it('omits the type key entirely when there is no type (never an empty ecosType)', () => {
    expect(buildColumnSumQuery({ ...base, ecosType: undefined })).not.toHaveProperty('ecosType');
    expect(buildColumnSumQuery({ ...base, ecosType: '' })).not.toHaveProperty('ecosType');
  });

  it('carries every filter the cards are loaded with', () => {
    const groupPredicate = { t: 'eq', att: 'priority', val: '200_high' };
    const relatedFilter = { t: 'or', val: [{ t: 'contains', att: 'request', val: 'emodel/request@req-1' }] };
    const additionalFilter = { t: 'ge', att: '_statusModified', val: '-P30D' };
    const searchPredicate = { t: 'or', val: [{ t: 'contains', att: '_name', val: 'TEST2-1' }] };
    const userPredicate = [{ t: 'eq', att: 'assignee', val: 'emodel/person@ivan' }];

    const { query } = buildColumnSumQuery({
      ...base,
      column: { ...COLUMN, additionalFilter },
      journalPredicate: JOURNAL_PREDICATE,
      predicate: userPredicate,
      searchPredicate,
      groupPredicate,
      relatedFilter
    });

    expect(query.v).toContainEqual({ t: 'eq', a: '_status', v: 'review' });
    expect(query.v).toContainEqual(JOURNAL_PREDICATE);
    expect(query.v).toContainEqual(groupPredicate);
    expect(query.v).toContainEqual(relatedFilter);
    expect(query.v).toContainEqual(additionalFilter);
    expect(query.v).toContainEqual(searchPredicate);
    expect(query.v).toContainEqual(userPredicate[0]);
    expect(query.v).toHaveLength(7);
  });

  it('normalizes data-type predicates of the user filter the same way the card query does', () => {
    const { query } = buildColumnSumQuery({
      ...base,
      predicate: [{ t: 'time-interval', att: 'created', val: '-P7D' }]
    });

    // ParserPredicate.replacePredicatesType: an open-ended interval becomes an explicit `<from>/$NOW`
    expect(query.v).toContainEqual({ t: 'eq', att: 'created', val: '-P7D/$NOW' });
  });

  it('drops empty leaves of the user filter (parity with the card query)', () => {
    const { query } = buildColumnSumQuery({
      ...base,
      predicate: [
        { t: 'eq', att: 'assignee', val: '' },
        { t: 'eq', att: 'priority', val: '200_high' }
      ]
    });

    expect(query.v).toEqual([
      { t: 'eq', a: '_status', v: 'review' },
      { t: 'eq', att: 'priority', val: '200_high' }
    ]);
  });

  /**
   * Emptiness has no single truth value: dropping an empty leaf out of an OR branch WIDENS the
   * branch instead of narrowing it (contract `empty predicates flip OR semantics on cleanup`).
   * The journal predicate is the server's, not a user filter form — it must be shipped untouched.
   */
  it('does not run the journal predicate through the empty-predicate cleanup', () => {
    const journalPredicate = {
      t: 'or',
      val: [
        { t: 'eq', att: 'sprint', val: '' },
        { t: 'eq', att: '_type', val: 'emodel/type@ept-issue' }
      ]
    };

    const { query } = buildColumnSumQuery({ ...base, journalPredicate });

    expect(query.v).toContainEqual(journalPredicate);
    expect(journalPredicate.val).toHaveLength(2);
  });

  it('does not mutate the shared predicate array from the store', () => {
    const shared = [{ t: 'eq', att: 'priority', val: '200_high' }];

    buildColumnSumQuery({ ...base, predicate: shared, searchPredicate: { t: 'contains', att: '_name', val: 'x' } });
    buildColumnSumQuery({ ...base, predicate: shared, searchPredicate: { t: 'contains', att: '_name', val: 'x' } });

    expect(shared).toHaveLength(1);
  });
});

/**
 * The same guess the server makes for a board that has no journal (`typeSourceId(board.typeRef)`).
 */
describe('guessTypeSourceId', () => {
  it('derives the record source of a type from its local id', () => {
    expect(guessTypeSourceId('emodel/type@ept-issue')).toBe('emodel/ept-issue');
  });

  it('has nothing to guess from without a type ref', () => {
    expect(guessTypeSourceId(undefined)).toBeUndefined();
    expect(guessTypeSourceId('')).toBeUndefined();
  });
});
