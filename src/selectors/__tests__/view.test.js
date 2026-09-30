import { selectJournalsPageFixedPageSize } from '../view';

const withConfig = journalsPagination => ({ view: { journalsPagination } });

describe('selectJournalsPageFixedPageSize (COREDEV-583)', () => {
  it('returns the configured count in the fixed mode', () => {
    expect(selectJournalsPageFixedPageSize(withConfig({ journalsPage: { pageSizeMode: 'FIXED', pageSize: 15 } }))).toBe(15);
  });

  it('ignores the mode in another case', () => {
    expect(selectJournalsPageFixedPageSize(withConfig({ journalsPage: { pageSizeMode: 'fixed', pageSize: 15 } }))).toBeNull();
  });

  it('accepts a count that came as a string', () => {
    expect(selectJournalsPageFixedPageSize(withConfig({ journalsPage: { pageSizeMode: 'FIXED', pageSize: '20' } }))).toBe(20);
  });

  it.each([
    ['the auto mode', { journalsPage: { pageSizeMode: 'AUTO', pageSize: 15 } }],
    ['no count', { journalsPage: { pageSizeMode: 'FIXED' } }],
    ['an empty count', { journalsPage: { pageSizeMode: 'FIXED', pageSize: '' } }],
    ['zero', { journalsPage: { pageSizeMode: 'FIXED', pageSize: 0 } }],
    ['a negative count', { journalsPage: { pageSizeMode: 'FIXED', pageSize: -3 } }],
    ['a fraction', { journalsPage: { pageSizeMode: 'FIXED', pageSize: 2.5 } }],
    ['no journalsPage section', {}],
    ['no config at all', undefined]
  ])('returns null for %s', (_, config) => {
    expect(selectJournalsPageFixedPageSize(withConfig(config))).toBeNull();
  });
});
