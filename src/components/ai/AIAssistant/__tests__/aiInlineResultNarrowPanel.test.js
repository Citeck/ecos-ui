import path from 'path';

import { ROOT, cascade, compileScss, element } from '@/testUtils/cssCascade';

/**
 * COREDEV-534: in the properties panel of a BPMN script task the generated-result panel was drawn
 * 400px wide inside a 328px popper, so its right edge landed at 1488px in a 1440px window — the
 * heading and the right half of every line were cut off.
 *
 * `sizeConstraints` in `AIPopperWrapper` caps the popper to the field the popup belongs to, so in a
 * narrow field the popper is narrower than the panel's own floor. The floor has to yield to the
 * container instead of overflowing it.
 *
 * Numbers below are the ones measured on the stand (window 1440px): field/popper 328px, panel 400px.
 */
describe('AI inline result in a narrow container (COREDEV-534)', () => {
  let sheets;

  beforeAll(() => {
    sheets = [compileScss(path.join(ROOT, 'src/components/ai/AIAssistant/AIQuickActions/styles/_ai-quick-actions.scss'))];
  });

  /** The panel as it is rendered by `AIPopperWrapper`: inside the portal's `.ai-popper` container. */
  const inPopper = (className = 'ai-inline-result') => {
    const popper = element('ai-popper ai-popper--bottom ai-popper--visible');
    const result = element(className);

    popper.appendChild(result);

    return result;
  };

  it('never demands more width than the popper it is placed in', () => {
    expect(cascade(inPopper(), sheets, 'min-width')).toBe('min(var(--ai-result-min-width), 100%)');
  });

  it('is capped to the popper width, overriding the desktop `max-width: none`', () => {
    expect(cascade(inPopper(), sheets, 'max-width')).toBe('100%');
  });

  it('keeps the 400px floor as the preferred width, so a roomy container still gets it', () => {
    // The token is what the floor resolves to when the container can afford it — the regression
    // would be silently dropping it and letting the panel shrink to its content in a wide field.
    const css = sheets[0];

    expect(css).toContain('--ai-result-min-width: 400px');
  });

  it('applies the same cap to the loading card, which shares the container', () => {
    expect(cascade(inPopper('ai-inline-result ai-inline-result--loading'), sheets, 'max-width')).toBe('100%');
  });

  it('caps the floor for a panel rendered without a popper too', () => {
    // Legacy portal / inline rendering: the panel is absolutely positioned inside the field itself,
    // which can be just as narrow as the BPMN properties panel.
    expect(cascade(element('ai-inline-result'), sheets, 'min-width')).toBe('min(var(--ai-result-min-width), 100%)');
  });

  it('leaves the height constraints alone', () => {
    expect(cascade(inPopper(), sheets, 'min-height')).toBe('var(--ai-result-min-height)');
    expect(cascade(inPopper(), sheets, 'max-height')).toBe('var(--ai-result-max-height)');
  });

  /**
   * Found while measuring the fix on the stand: with the panel down to the width of the properties
   * panel, the last action button sits ~16px from the panel's right edge, and the panel is
   * `overflow: hidden`. Its tooltip is `white-space: nowrap` and centred on a 32px button, so a
   * 109px label ("Другой вариант") was cut in half. The right-edge anchoring existed, but only on
   * the Apply button — and Apply is not rendered at all when the answer proposes no edit, which is
   * exactly the explanation-only answer COREDEV-534 was reported on.
   */
  describe('action button tooltips', () => {
    /** The actions row as `AIInlineResult` builds it, for the given list of button classes. */
    const actionsRow = (...buttons) => {
      const row = element('ai-inline-result__actions');

      buttons.forEach(cls => row.appendChild(element(cls, {}, 'button')));

      return [...row.children];
    };

    it('anchors the last button tooltip to its right edge when Apply is absent', () => {
      const [, another] = actionsRow('ai-result-icon-btn', 'ai-result-icon-btn');

      expect(cascade(another, sheets, 'right', '::after')).toBe('0');
      expect(cascade(another, sheets, 'left', '::after')).toBe('auto');
      expect(cascade(another, sheets, 'transform', '::after')).toBe('translateX(0)');
    });

    it('keeps anchoring the Apply button, which is the last one when it is rendered', () => {
      const [, , apply] = actionsRow('ai-result-icon-btn', 'ai-result-icon-btn', 'ai-result-icon-btn ai-result-icon-btn--primary');

      expect(cascade(apply, sheets, 'right', '::after')).toBe('0');
      expect(cascade(apply, sheets, 'left', '::after')).toBe('auto');
    });

    it('moves the arrow with the bubble', () => {
      const [, another] = actionsRow('ai-result-icon-btn', 'ai-result-icon-btn');

      expect(cascade(another, sheets, 'right', '::before')).toBe('12px');
      expect(cascade(another, sheets, 'left', '::before')).toBe('auto');
    });

    it('leaves the buttons that are not last centred', () => {
      const [cancel] = actionsRow('ai-result-icon-btn', 'ai-result-icon-btn');

      expect(cascade(cancel, sheets, 'left', '::after')).toBe('50%');
      expect(cascade(cancel, sheets, 'transform', '::after')).toBe('translateX(-50%)');
    });
  });
});
