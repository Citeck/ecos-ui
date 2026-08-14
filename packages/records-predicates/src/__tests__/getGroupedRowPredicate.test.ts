import ParserPredicate from '../ParserPredicate';

const STATUS = '_status';
const AUTHOR = 'author';

const columns = [
  { attribute: STATUS, type: 'options', label: 'Status' },
  { attribute: AUTHOR, type: 'person', label: 'Author' }
];

const status = (val: string) => ({ att: STATUS, t: 'contains', val });
const author = (val: string) => ({ att: AUTHOR, t: 'contains', val });

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

    // ОЖ: exactly one condition — «Статус содержит Доработка».
    expect(rendered(result)).toEqual([{ att: STATUS, t: 'contains', val: 'Доработка' }]);
  });

  it('COREDEV-371: the value never comes from another OR branch', () => {
    const predicate = group('or', status('Доработка'), status('Подписание'), status('Согласование'));

    const result = ParserPredicate.getGroupedRowPredicate({
      predicate,
      row: { [STATUS]: 'Подписание' },
      columns,
      groupBy: [STATUS]
    });

    expect(rendered(result)).toEqual([{ att: STATUS, t: 'contains', val: 'Подписание' }]);
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
      { att: STATUS, t: 'contains', val: 'Доработка' }
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
      { att: STATUS, t: 'contains', val: 'Доработка' }
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

    expect(rendered(result)).toEqual([{ att: STATUS, t: 'contains', val: 'Доработка' }]);
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
    expect(conditions[conditions.length - 1]).toEqual({ att: STATUS, t: 'contains', val: 'Доработка' });
  });

  it('without an active filter only the clicked group value is applied', () => {
    const result = ParserPredicate.getGroupedRowPredicate({
      predicate: {},
      row: { [STATUS]: 'Доработка' },
      columns,
      groupBy: [STATUS]
    });

    expect(rendered(result)).toEqual([{ att: STATUS, t: 'contains', val: 'Доработка' }]);
  });

  it('pins every attribute of a composite grouping', () => {
    const predicate = group('or', status('Доработка'), status('Подписание'));

    const result = ParserPredicate.getGroupedRowPredicate({
      predicate,
      row: { [STATUS]: 'Доработка', [AUTHOR]: 'ivanov' },
      columns,
      groupBy: [`${STATUS}&${AUTHOR}`]
    });

    expect(rendered(result)).toEqual([
      { att: STATUS, t: 'contains', val: 'Доработка' },
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

    expect(rendered(result)).toEqual([{ att: STATUS, t: 'contains', val: 'Доработка' }]);
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
