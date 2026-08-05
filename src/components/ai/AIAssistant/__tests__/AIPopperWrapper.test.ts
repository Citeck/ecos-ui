import { clampToFieldBounds } from '../AIQuickActions/components/AIPopperWrapper';

/**
 * D-B-1: the AI popups (quick actions bar and generated-result panel) are anchored to the small
 * trigger button inside the field's toolbar. With a `bottom-end` placement a 485–600px popup starts
 * far to the left of the field, and the only limit in place was the browser window — the panel
 * covered the side menu and the first characters of every line being edited.
 *
 * Numbers below are the ones measured on the stand: field starts at x=275, the trigger button sits
 * at x≈382, the quick actions bar is 485px wide and the result panel 597px.
 */
describe('clampToFieldBounds', () => {
  const field = { left: 275, right: 1300 };

  it('pulls a popup that starts left of the field back to its left edge', () => {
    // 382 - 485 = -103, then the window limit used to park it at 24
    expect(clampToFieldBounds(-103, 485, field)).toBe(275);
    expect(clampToFieldBounds(24, 485, field)).toBe(275);
  });

  it('keeps the result panel inside the field as well', () => {
    expect(clampToFieldBounds(-215, 597, field)).toBe(275);
  });

  it('leaves a popup that already fits alone', () => {
    expect(clampToFieldBounds(400, 485, field)).toBe(400);
  });

  it('pushes a popup overflowing the right edge back inside', () => {
    // 1000 + 485 = 1485 > 1300, so it must end exactly at the field's right edge
    expect(clampToFieldBounds(1000, 485, field)).toBe(815);
    expect(clampToFieldBounds(1000, 485, field) + 485).toBe(field.right);
  });

  it('aligns to the field start when the popup is wider than the field', () => {
    // Narrow field: nothing can satisfy both edges, so show the beginning of the panel
    expect(clampToFieldBounds(-50, 600, { left: 275, right: 700 })).toBe(275);
    expect(clampToFieldBounds(900, 600, { left: 275, right: 700 })).toBe(275);
  });

  it('handles a field that starts at the viewport origin', () => {
    expect(clampToFieldBounds(-40, 300, { left: 0, right: 500 })).toBe(0);
  });
});
