import ParserPredicate from '../ParserPredicate';
import { hasLeadingZeros } from '../utils';

const REG_NUMBER = 'regNumber';
const STATUS = 'status';
const AMOUNT = 'amount';
const ITEMS_COUNT = 'itemsCount';

/**
 * A contract journal as `journalsService.__mapNewColumnConfigToLegacy` leaves it: every `NUMBER`
 * attribute becomes the legacy type `double`, so `amount` is what a real numeric column looks like.
 * Date columns are absent because `getAvailableSearchColumns` drops them before this builder runs.
 */
const columns = [
  { attribute: REG_NUMBER, type: 'text', visible: true, default: true, searchable: true },
  { attribute: STATUS, type: 'options', visible: true, default: true, searchable: true },
  { attribute: AMOUNT, type: 'double', visible: true, default: true, searchable: true },
  { attribute: ITEMS_COUNT, type: 'int', visible: true, default: true, searchable: true }
];

/** What the journal header search does: `sagas/journals.ts` `getSearchPredicate`, `sagas/kanban.js`. */
const search = (text: any, cols: any[] = columns) => ParserPredicate.getSearchPredicates({ text, columns: cols });

/** The attributes the search would actually ask about, in the order the builder emits them. */
const searched = (predicate: any) => ((predicate && predicate.val[0].val) || []).map((p: any) => p.att);

describe('ParserPredicate.getSearchPredicates — numeric columns and a padded search text', () => {
  it('COREDEV-478: a text padded with leading zeros leaves the numeric columns out', () => {
    // EMTC-305: `000012` matched STD-000019 too, because `eq(amount, 12)` joined the OR.
    expect(searched(search('000012'))).toEqual([REG_NUMBER, STATUS]);
    expect(searched(search('000010'))).toEqual([REG_NUMBER, STATUS]);
  });

  it('keeps the text columns searching for the padded string itself', () => {
    const val = search('000012').val[0].val;

    expect(val).toEqual([
      expect.objectContaining({ att: REG_NUMBER, t: 'contains', val: '000012' }),
      expect.objectContaining({ att: STATUS, t: 'contains', val: '000012' })
    ]);
  });

  it('every numeric type drops out, not just the `double` a NUMBER column maps to', () => {
    const numeric = ['int', 'long', 'float', 'double'].map(type => ({
      attribute: type,
      type,
      visible: true,
      default: true,
      searchable: true
    }));

    expect(searched(search('000012', [...numeric, columns[0]]))).toEqual([REG_NUMBER]);
  });

  it('a plain number keeps the numeric columns in the search', () => {
    expect(searched(search('12'))).toEqual([REG_NUMBER, STATUS, AMOUNT, ITEMS_COUNT]);
  });

  it('`0` and `0.5` are numbers, not padded ones', () => {
    expect(searched(search('0'))).toEqual([REG_NUMBER, STATUS, AMOUNT, ITEMS_COUNT]);
    expect(searched(search('0.5'))).toEqual([REG_NUMBER, STATUS, AMOUNT, ITEMS_COUNT]);
  });

  it('a padded negative or fractional number is padded all the same', () => {
    expect(searched(search('-000012'))).toEqual([REG_NUMBER, STATUS]);
    expect(searched(search('000012.5'))).toEqual([REG_NUMBER, STATUS]);
  });

  it('surrounding whitespace does not hide the padding', () => {
    expect(searched(search('  000012  '))).toEqual([REG_NUMBER, STATUS]);
  });

  it('a prefixed identifier is unchanged — it is not a number, so nothing is excluded here', () => {
    // `STD-000012` never matches a numeric column anyway: `convertAttributeValues` nulls that
    // branch out downstream. The builder has no reason to treat it specially.
    expect(searched(search('STD-000012'))).toEqual([REG_NUMBER, STATUS, AMOUNT, ITEMS_COUNT]);
  });

  it('no predicate at all when only numeric columns were searchable', () => {
    expect(search('000012', [columns[2], columns[3]])).toBeNull();
  });

  it('the visible/default/searchable gates still apply', () => {
    const hidden = { attribute: 'hidden', type: 'text', visible: false, default: true, searchable: true };
    const notSearchable = { attribute: 'notSearchable', type: 'text', visible: true, default: true, searchable: false };

    expect(searched(search('000012', [...columns, hidden, notSearchable]))).toEqual([REG_NUMBER, STATUS]);
  });

  it('a grouped journal narrows to the grouped attribute before the numeric columns are weighed', () => {
    const grouped = (text: string, groupBy: string[]) => ParserPredicate.getSearchPredicates({ text, columns, groupBy });

    expect(searched(grouped('000012', [`${REG_NUMBER}&${AMOUNT}`]))).toEqual([REG_NUMBER]);
    expect(searched(grouped('12', [`${REG_NUMBER}&${AMOUNT}`]))).toEqual([REG_NUMBER, AMOUNT]);
  });
});

/** The cases above already cover the rule through the public method; these are the ones it cannot reach. */
describe('hasLeadingZeros — inputs the search builder never produces', () => {
  it.each(['01', '00', '0012abc'])('%s is padded', text => {
    expect(hasLeadingZeros(text)).toBe(true);
  });

  it.each(['', '-0.5', 'abc'])('%s is not padded', text => {
    expect(hasLeadingZeros(text)).toBe(false);
  });

  it('takes a missing text without throwing', () => {
    expect(hasLeadingZeros(undefined)).toBe(false);
    expect(hasLeadingZeros(null)).toBe(false);
  });
});
