import { getPredicates } from '@citeck/records-core/predicates/predicates';

import ParserPredicate from '../ParserPredicate';

const STATUS = '_status';
const AUTHOR = 'author';
const CREATED = '_created';
const AMOUNT = 'amount';

const columns = [
  { attribute: STATUS, type: 'options', label: 'Status' },
  { attribute: AUTHOR, type: 'person', label: 'Author' }
];

const status = (val: string) => ({ att: STATUS, t: 'contains', val });
const author = (val: string) => ({ att: AUTHOR, t: 'contains', val });
const created = (val: string) => ({ att: CREATED, t: 'ge', val });
const amount = (val: string) => ({ att: AMOUNT, t: 'eq', val });

/** Shape produced by the journal filter UI: OR of groups, each group a list of conditions. */
const group = (t: string, ...conditions: any[]) => ({ t: 'or', val: [{ t, val: conditions }] });

/** Flat list of the conditions the filter settings UI would render for a predicate. */
const rendered = (predicate: any) => ParserPredicate.getFlatFilters(predicate).map(({ att, t, val }: any) => ({ att, t, val }));

describe('ParserPredicate.getGroupedRowPredicate', () => {
  it('COREDEV-371: an OR filter on the grouped attribute collapses to the clicked group value only', () => {
    const predicate = group('or', status('Доработка'), status('Подписание'));

    const result = ParserPredicate.getGroupedRowPredicate({
      predicate,
      row: { [STATUS]: 'Доработка' },
      columns,
      groupBy: [STATUS]
    });

    // ОЖ: exactly one condition — the group's own value, pinned with equality.
    expect(rendered(result)).toEqual([{ att: STATUS, t: 'eq', val: 'Доработка' }]);
  });

  it('COREDEV-371: the value never comes from another OR branch', () => {
    const predicate = group('or', status('Доработка'), status('Подписание'), status('Согласование'));

    const result = ParserPredicate.getGroupedRowPredicate({
      predicate,
      row: { [STATUS]: 'Подписание' },
      columns,
      groupBy: [STATUS]
    });

    expect(rendered(result)).toEqual([{ att: STATUS, t: 'eq', val: 'Подписание' }]);
  });

  it('keeps the conditions on other attributes and pins the grouped one', () => {
    const predicate = group('and', status('Доработка'), author('ivanov'));

    const result = ParserPredicate.getGroupedRowPredicate({
      predicate,
      row: { [STATUS]: 'Доработка' },
      columns,
      groupBy: [STATUS]
    });

    expect(rendered(result)).toEqual([
      { att: AUTHOR, t: 'contains', val: 'ivanov' },
      { att: STATUS, t: 'eq', val: 'Доработка' }
    ]);
  });

  it('keeps a group that is AND-ed with the group of the grouped attribute', () => {
    const predicate = {
      t: 'or',
      val: [
        {
          t: 'and',
          val: [
            { t: 'or', val: [status('Доработка'), status('Подписание')] },
            { t: 'or', val: [author('ivanov')] }
          ]
        }
      ]
    };

    const result = ParserPredicate.getGroupedRowPredicate({
      predicate,
      row: { [STATUS]: 'Доработка' },
      columns,
      groupBy: [STATUS]
    });

    expect(rendered(result)).toEqual([
      { att: AUTHOR, t: 'contains', val: 'ivanov' },
      { att: STATUS, t: 'eq', val: 'Доработка' }
    ]);
  });

  it('drops a group that is OR-ed with the group of the grouped attribute', () => {
    // `(status ~ Доработка OR status ~ Подписание) OR author = ivanov` — every record of the
    // «Доработка» group already matches through the status branch, so the author branch adds nothing.
    const predicate = {
      t: 'or',
      val: [
        { t: 'or', val: [status('Доработка'), status('Подписание')] },
        { t: 'and', val: [author('ivanov')] }
      ]
    };

    const result = ParserPredicate.getGroupedRowPredicate({
      predicate,
      row: { [STATUS]: 'Доработка' },
      columns,
      groupBy: [STATUS]
    });

    expect(rendered(result)).toEqual([{ att: STATUS, t: 'eq', val: 'Доработка' }]);
  });

  it('keeps the branches of an OR the clicked group does not satisfy on its own', () => {
    // `(status ~ Доработка AND author = ivanov) OR (status ~ Подписание AND author = petrov)`.
    // The «Доработка» group holds only records of the first branch, so the second one must survive
    // to keep filtering them out.
    const predicate = {
      t: 'or',
      val: [
        { t: 'and', val: [status('Доработка'), author('ivanov')] },
        { t: 'and', val: [status('Подписание'), author('petrov')] }
      ]
    };

    const result = ParserPredicate.getGroupedRowPredicate({
      predicate,
      row: { [STATUS]: 'Доработка' },
      columns,
      groupBy: [STATUS]
    });

    const conditions = rendered(result);

    expect(conditions).toContainEqual({ att: STATUS, t: 'contains', val: 'Подписание' });
    expect(conditions).toContainEqual({ att: AUTHOR, t: 'contains', val: 'petrov' });
    expect(conditions[0]).toEqual({ att: STATUS, t: 'eq', val: 'Доработка' });
  });

  it('without an active filter only the clicked group value is applied', () => {
    const result = ParserPredicate.getGroupedRowPredicate({
      predicate: {},
      row: { [STATUS]: 'Доработка' },
      columns,
      groupBy: [STATUS]
    });

    expect(rendered(result)).toEqual([{ att: STATUS, t: 'eq', val: 'Доработка' }]);
  });

  it('pins every attribute of a composite grouping', () => {
    const predicate = group('or', status('Доработка'), status('Подписание'));

    const result = ParserPredicate.getGroupedRowPredicate({
      predicate,
      row: { [STATUS]: 'Доработка', [AUTHOR]: 'ivanov' },
      columns,
      groupBy: [`${STATUS}&${AUTHOR}`]
    });

    // status is a value column and pins with equality; author is a ref column and keeps `contains`
    expect(rendered(result)).toEqual([
      { att: STATUS, t: 'eq', val: 'Доработка' },
      { att: AUTHOR, t: 'contains', val: 'ivanov' }
    ]);
  });

  it('resolves an OR of the grouped attribute with another one through the clicked group', () => {
    // `status ~ Доработка OR author = ivanov` — the clicked group satisfies the status branch, so
    // the whole condition holds for it and only the pinned value is left.
    const predicate = group('or', status('Доработка'), author('ivanov'));

    const result = ParserPredicate.getGroupedRowPredicate({
      predicate,
      row: { [STATUS]: 'Доработка' },
      columns,
      groupBy: [STATUS]
    });

    expect(rendered(result)).toEqual([{ att: STATUS, t: 'eq', val: 'Доработка' }]);
  });

  describe('COREDEV-371 return: a criteria group padded with empty conditions', () => {
    // The saved «двойной фильтр»: a criteria group where only «Статус содержит Доработка» is
    // filled — the other criteria are present but empty — OR «Статус содержит Подписание».
    // The query engine ignores empty conditions (removeEmptyPredicates), so for it the first
    // branch is `status ~ Доработка` and nothing else. The drill-down must see the branch the
    // same way: an empty condition is vacuously true, it cannot keep a branch "occupied", and it
    // must never survive into the result — after cleanup an all-empty AND is dropped from its OR,
    // which would silently flip a true branch into a removed one.
    const predicate = {
      t: 'or',
      val: [
        {
          t: 'or',
          val: [{ t: 'and', val: [created(''), author(''), status('Доработка'), amount('')] }, status('Подписание')]
        }
      ]
    };

    it('the branch of the clicked group collapses to the pinned value only', () => {
      const result = ParserPredicate.getGroupedRowPredicate({
        predicate,
        row: { [STATUS]: 'Доработка' },
        columns,
        groupBy: [STATUS]
      });

      expect(rendered(result)).toEqual([{ att: STATUS, t: 'eq', val: 'Доработка' }]);
    });

    it('the other OR branch still resolves through the clicked group', () => {
      const result = ParserPredicate.getGroupedRowPredicate({
        predicate,
        row: { [STATUS]: 'Подписание' },
        columns,
        groupBy: [STATUS]
      });

      // eq, not `contains`: the pinned condition must not capture «Подписание контрагентом»
      expect(rendered(result)).toEqual([{ att: STATUS, t: 'eq', val: 'Подписание' }]);
    });

    it('a group matched by a branch through a substring collapses to its own value', () => {
      // «Подписание контрагентом» is in the grouped list because `contains Подписание` matches it
      // as a substring. Every record of the group therefore satisfies that branch — the filter is
      // provably true and only the pinned equality remains. The pin must be `eq`, not `contains`:
      // the symmetric substring trap is clicking «Подписание» and capturing «Подписание
      // контрагентом» records.
      const result = ParserPredicate.getGroupedRowPredicate({
        predicate,
        row: { [STATUS]: 'Подписание контрагентом' },
        columns,
        groupBy: [STATUS]
      });

      expect(rendered(result)).toEqual([{ att: STATUS, t: 'eq', val: 'Подписание контрагентом' }]);
    });

    it('the surviving OR becomes a nested condition group, AND-ed with the pinned value', () => {
      // An OR over another attribute cannot be proven by the clicked group, so it must survive —
      // and flattened into one group it would read `ivanov or petrov and pinned` with no way to
      // see the brackets, so it comes out as its own condition group. (An OR over the grouped
      // attribute alone never gets here: the group's existence proves it as a conjunct.)
      const result = ParserPredicate.getGroupedRowPredicate({
        predicate: {
          t: 'or',
          val: [{ t: 'or', val: [{ t: 'and', val: [created(''), author('ivanov')] }, author('petrov')] }]
        },
        row: { [STATUS]: 'Согласование' },
        columns,
        groupBy: [STATUS]
      });

      const groups = ParserPredicate.parse(result, columns);

      expect(groups).toHaveLength(2);

      const [main, sub] = groups;

      expect(main.getFilters()).toHaveLength(1);
      expect(main.getFilters()[0].predicate).toMatchObject({ att: STATUS, t: 'eq', val: 'Согласование' });

      expect(sub.getCondition()).toEqual('and');
      expect(sub.getFilters()).toHaveLength(2);
      expect(sub.getFilters().map((f: any) => f.predicate.val)).toEqual(['ivanov', 'petrov']);
      expect(sub.getFilters()[1].getCondition()).toEqual('or');

      // and the UI round-trip must not change the meaning
      expect(rendered(ParserPredicate.reverse(groups))).toEqual(rendered(result));
    });
  });

  it('an empty condition OR-ed next to a real one is removed from the OR, not read as a true branch', () => {
    // The query engine (removeEmptyPredicates) drops an empty condition from whatever list it sits
    // in: `or(amount eq 5, author contains '')` is evaluated as `amount eq 5`. The drill-down must
    // do the same — treating the empty leaf as a proven-true branch would short-circuit the whole
    // OR and silently discard the user's amount condition, widening the result set.
    const predicate = {
      t: 'or',
      val: [{ t: 'or', val: [{ att: AMOUNT, t: 'eq', val: '5' }, author('')] }]
    };

    const result = ParserPredicate.getGroupedRowPredicate({
      predicate,
      row: { [STATUS]: 'Доработка' },
      columns,
      groupBy: [STATUS]
    });

    expect(rendered(result)).toEqual([
      { att: AMOUNT, t: 'eq', val: '5' },
      { att: STATUS, t: 'eq', val: 'Доработка' }
    ]);
  });

  it('pins value-typed columns with equality and ref-typed ones with contains', () => {
    const NAME = 'name';
    const DUE = 'due';
    const STARTED = 'started';
    const CUSTOM = 'custom';
    const cols = [
      { attribute: NAME, type: 'mltext', label: 'Name' },
      { attribute: DUE, type: 'date', label: 'Due' },
      { attribute: STARTED, type: 'datetime', label: 'Started' },
      { attribute: CUSTOM, type: 'some-exotic-type', label: 'Custom' },
      { attribute: AUTHOR, type: 'person', label: 'Author' }
    ];

    const byAtt = (att: string, groupBy: string, row: any) =>
      rendered(ParserPredicate.getGroupedRowPredicate({ predicate: {}, row, columns: cols, groupBy: [groupBy] }));

    // mltext: the backend resolves `eq` to an exact locale value; `contains` is a substring LIKE
    expect(byAtt(NAME, NAME, { [NAME]: 'Подписание' })).toEqual([{ att: NAME, t: 'eq', val: 'Подписание' }]);
    // date/datetime: `ge` from EQUAL_PREDICATES_MAP would capture everything on and after the value
    expect(byAtt(DUE, DUE, { [DUE]: '2026-08-17' })).toEqual([{ att: DUE, t: 'eq', val: '2026-08-17' }]);
    expect(byAtt(STARTED, STARTED, { [STARTED]: '2026-08-17T10:00:00Z' })).toEqual([
      { att: STARTED, t: 'eq', val: '2026-08-17T10:00:00Z' }
    ]);
    // an unmapped type falls back to `eq` instead of silently losing the pin
    expect(byAtt(CUSTOM, CUSTOM, { [CUSTOM]: 'x' })).toEqual([{ att: CUSTOM, t: 'eq', val: 'x' }]);
    // person is a ref — `contains` there is exact-ref membership, not a substring
    expect(byAtt(AUTHOR, AUTHOR, { [AUTHOR]: 'ivanov' })).toEqual([{ att: AUTHOR, t: 'contains', val: 'ivanov' }]);
  });

  it('the settings panel can display an eq pin for a datetime column, with ge still the default', () => {
    // The pin uses `eq`, so `eq` must be in the datetime operator list — otherwise Filter.jsx
    // falls back to displaying the first operator («≥») while the query really is `eq`. And the
    // first entry is the default operator for a new filter row, so it must stay `ge`.
    const operators = getPredicates({ type: 'datetime' }).map((p: any) => p.value);

    expect(operators).toContain('eq');
    expect(operators[0]).toEqual('ge');
  });

  it('pins a falsy group value as itself and a missing one as empty', () => {
    const AMOUNT_COL = 'total';
    const cols = [
      { attribute: AMOUNT_COL, type: 'int', label: 'Total' },
      { attribute: STATUS, type: 'options', label: 'Status' }
    ];

    // a falsy value (0) must not fall through to the raw cell object
    expect(
      rendered(
        ParserPredicate.getGroupedRowPredicate({
          predicate: {},
          row: { [AMOUNT_COL]: { value: 0, disp: '0' } },
          columns: cols,
          groupBy: [AMOUNT_COL]
        })
      )
    ).toEqual([{ att: AMOUNT_COL, t: 'eq', val: 0 }]);

    // a missing value pins with `empty`: `eq ''` would be stripped by removeEmptyPredicates
    // before the query, silently widening the drill-down to the whole journal
    for (const missing of [null, '']) {
      expect(
        rendered(
          ParserPredicate.getGroupedRowPredicate({
            predicate: {},
            row: { [STATUS]: { value: missing, disp: '' } },
            columns: cols,
            groupBy: [STATUS]
          })
        )
      ).toEqual([{ att: STATUS, t: 'empty', val: missing }]);
    }
  });

  it('drops a branch proven by a positive operator, keeps a negation it cannot prove', () => {
    // Both filters are true for the «Подписание» group, but only the first one is provable.
    // `starts` is existential — the pinned value alone proves it. `not-eq` is universal: on a
    // multi-valued attribute the pinned value proves nothing about the other values, so the
    // condition must survive even though it is true for the pinned value itself. (The author
    // branch keeps the OR from depending on the grouped attribute alone — such a filter would be
    // dropped whole as a conjunct.)
    const proven = ParserPredicate.getGroupedRowPredicate({
      predicate: { t: 'or', val: [{ att: STATUS, t: 'starts', val: 'Подпи' }, author('petrov')] },
      row: { [STATUS]: 'Подписание' },
      columns,
      groupBy: [STATUS]
    });

    // the `starts` branch holds for «Подписание» — the whole OR is satisfied
    expect(rendered(proven)).toEqual([{ att: STATUS, t: 'eq', val: 'Подписание' }]);

    const kept = ParserPredicate.getGroupedRowPredicate({
      predicate: { t: 'or', val: [{ att: STATUS, t: 'not-eq', val: 'Доработка' }, author('petrov')] },
      row: { [STATUS]: 'Подписание' },
      columns,
      groupBy: [STATUS]
    });

    const conditions = rendered(kept);
    expect(conditions[0]).toEqual({ att: STATUS, t: 'eq', val: 'Подписание' });
    expect(conditions).toContainEqual({ att: STATUS, t: 'not-eq', val: 'Доработка' });
    expect(conditions).toContainEqual({ att: AUTHOR, t: 'contains', val: 'petrov' });
  });

  it('drops a negation on the grouped attribute in a conjunctive position', () => {
    // A conjunct is satisfied by every record passing the filter, and the group exists — so it
    // holds for the group regardless of the operator, negations included.
    const predicate = group('and', { att: STATUS, t: 'not-eq', val: 'Черновик' }, author('ivanov'));

    const result = ParserPredicate.getGroupedRowPredicate({
      predicate,
      row: { [STATUS]: 'Доработка' },
      columns,
      groupBy: [STATUS]
    });

    expect(rendered(result)).toEqual([
      { att: AUTHOR, t: 'contains', val: 'ivanov' },
      { att: STATUS, t: 'eq', val: 'Доработка' }
    ]);
  });

  it('produces a predicate the filter settings UI can parse back into groups', () => {
    const predicate = group('and', status('Доработка'), author('ivanov'));

    const result = ParserPredicate.getGroupedRowPredicate({
      predicate,
      row: { [STATUS]: 'Доработка' },
      columns,
      groupBy: [STATUS]
    });

    const groups = ParserPredicate.parse(result, columns);

    expect(groups).toHaveLength(1);
    expect(groups[0].getFilters()).toHaveLength(2);
  });
});
