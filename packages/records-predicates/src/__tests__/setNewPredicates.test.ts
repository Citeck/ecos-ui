import ParserPredicate from '../ParserPredicate';

const STATUS = '_status';
const AUTHOR = 'author';
const AMOUNT = 'amount';

const columns = [
  { attribute: STATUS, type: 'options', label: 'Status' },
  { attribute: AUTHOR, type: 'person', label: 'Author' },
  { attribute: AMOUNT, type: 'number', label: 'Amount' }
];

const status = (val: string) => ({ att: STATUS, t: 'eq', val });
const author = (val: string) => ({ att: AUTHOR, t: 'contains', val });
const amount = (val: string) => ({ att: AMOUNT, t: 'eq', val });
const or = (...val: any[]) => ({ t: 'or', val });
const and = (...val: any[]) => ({ t: 'and', val });

/** What the column header filter does: `JournalsDashletGrid.onFilterInline`. */
const addColumnFilter = (predicate: any, condition: any) => ParserPredicate.setNewPredicates(predicate, condition, true);

/** `[attribute, connector]` of every criterion, group by group, as the filter settings panel shows them. */
const rendered = (predicate: any) =>
  ParserPredicate.parse(predicate, columns).map((group: any) =>
    group.getFilters().map((filter: any) => [filter.getPredicate().att, filter.getCondition()])
  );

describe('ParserPredicate.setNewPredicates — a column header filter joins the active filter with AND', () => {
  it('COREDEV-371: after a drill-down that left the single pinned group condition', () => {
    // buildGroupedRowPredicate: the filter collapsed to the clicked group value alone
    const predicate = or(or(status('Доработка')));

    const result = addColumnFilter(predicate, author('Иванов'));

    expect(result).toEqual(or(or(and(status('Доработка'), author('Иванов')))));
    expect(rendered(result)).toEqual([
      [
        [STATUS, expect.any(String)],
        [AUTHOR, 'and']
      ]
    ]);
  });

  it('COREDEV-371: after a drill-down that kept a nested condition group — into the main group only', () => {
    // buildGroupedRowPredicate: pinned value in the main group, the surviving OR as a nested group
    const predicate = or(and(or(status('Согласование')), or(author('Иванов'), author('Петров'))));

    const result = addColumnFilter(predicate, amount('5'));

    expect(result).toEqual(or(and(or(and(status('Согласование'), amount('5'))), or(author('Иванов'), author('Петров')))));
  });

  it('a settings group with one criterion', () => {
    const result = addColumnFilter(or(or(author('Иванов'))), status('Доработка'));

    expect(result).toEqual(or(or(and(author('Иванов'), status('Доработка')))));
  });

  it('a settings group with several AND-ed criteria — appended, as before', () => {
    const result = addColumnFilter(or(or(and(status('Доработка'), amount('5')))), author('Иванов'));

    expect(result).toEqual(or(or(and(status('Доработка'), amount('5'), author('Иванов')))));
  });

  it('a settings group with OR-ed criteria — every branch, so the OR stays inside the new AND', () => {
    const predicate = or(or(status('Доработка'), and(status('Подписание'), amount('5'))));

    const result = addColumnFilter(predicate, author('Иванов'));

    expect(result).toEqual(or(or(and(status('Доработка'), author('Иванов')), and(status('Подписание'), amount('5'), author('Иванов')))));
  });

  it('several settings groups — every group, as before', () => {
    const result = addColumnFilter(or(or(status('Доработка')), or(and(status('Подписание'), amount('5')))), author('Иванов'));

    expect(result).toEqual(
      or(or(and(status('Доработка'), author('Иванов'))), or(and(status('Подписание'), amount('5'), author('Иванов'))))
    );
  });

  it('an empty group receives the condition as its first criterion', () => {
    expect(addColumnFilter(or(or(and())), author('Иванов'))).toEqual(or(or(and(author('Иванов')))));
    expect(addColumnFilter(or(or()), author('Иванов'))).toEqual(or(or(author('Иванов'))));
  });

  it('a criterion on the same attribute is updated in place, not added', () => {
    const result = addColumnFilter(or(or(and(status('Доработка'), amount('5')))), status('Подписание'));

    expect(result).toEqual(or(or(and(status('Подписание'), amount('5')))));
  });
});
