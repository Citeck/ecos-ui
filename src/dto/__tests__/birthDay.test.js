import { compareDayAndMonth } from '../birthday';

describe('BirthdaySortings', function() {
  it('sort', function() {
    expect(compareDayAndMonth(new Date(2021, 1, 9), new Date(2023, 1, 8))).toEqual(1);
    expect(compareDayAndMonth(new Date(2022, 1, 8), new Date(2023, 1, 8))).toEqual(0);
    expect(compareDayAndMonth(new Date(2025, 1, 7), new Date(2023, 1, 8))).toEqual(-1);
  });
});
