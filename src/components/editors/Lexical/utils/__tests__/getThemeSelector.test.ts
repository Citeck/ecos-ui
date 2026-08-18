import { getThemeClassSelector, getThemeSelector } from '../getThemeSelector';

const SINGLE = { tableCell: 'rt-editor-theme__tableCell' };
const MULTI = { tableCell: 'rt-editor-theme__tableCell is-bordered' };

describe('getThemeSelector', () => {
  it('builds a compound selector for a multi-class theme value, not a selector list', () => {
    expect(getThemeSelector(() => SINGLE, 'tableCell')).toBe('.rt-editor-theme__tableCell');
    expect(getThemeSelector(() => MULTI, 'tableCell')).toBe('.rt-editor-theme__tableCell.is-bordered');
  });

  it('matches only the element that has every class — a selector list would match far more', () => {
    const cell = document.createElement('td');
    const alien = document.createElement('div');

    cell.className = MULTI.tableCell;
    alien.className = 'is-bordered';
    document.body.append(cell, alien);

    const selector = `td${getThemeSelector(() => MULTI, 'tableCell')}, th${getThemeSelector(() => MULTI, 'tableCell')}`;

    expect(cell.closest(selector)).toBe(cell);
    expect(alien.closest(selector)).toBeNull();

    document.body.replaceChildren();
  });

  it('throws when a required theme property is missing', () => {
    expect(() => getThemeSelector(() => ({}), 'tableCell')).toThrow();
    expect(() => getThemeSelector(() => null, 'tableCell')).toThrow();
  });
});

describe('getThemeClassSelector', () => {
  it('returns null instead of throwing when the theme does not define the property', () => {
    expect(getThemeClassSelector(null, 'tableCell')).toBeNull();
    expect(getThemeClassSelector({}, 'tableCell')).toBeNull();
    expect(getThemeClassSelector({ tableCell: '   ' }, 'tableCell')).toBeNull();
  });

  it('returns the same compound selector as getThemeSelector for a defined property', () => {
    expect(getThemeClassSelector(MULTI, 'tableCell')).toBe('.rt-editor-theme__tableCell.is-bordered');
  });
});
