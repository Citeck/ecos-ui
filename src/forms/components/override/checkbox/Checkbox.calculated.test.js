import Harness from '../../../test/harness';

import Checkbox from './Checkbox';
import comp1 from './fixtures/comp1';

describe('checkbox boolean values beside required validation', () => {
  test.each([
    [false, false, true, false],
    [false, false, false, true],
    [true, false, true, false],
    [true, false, false, true],
    [true, null, true, true]
  ])('three-state=%s value=%s with calculation override=%s becomes %s', async (hasThreeStates, value, allowCalculateOverride, expected) => {
    const component = await Harness.testCreate(Checkbox, { ...comp1, hasThreeStates });
    try {
      component.setValue(value);
      component.component.calculateValue = 'value = true;';
      component.component.allowCalculateOverride = allowCalculateOverride;
      component.calculatedValue = undefined;
      component.calculateValue(component.data, {});
      component.calculateValue(component.data, {});
      expect(component.getValue()).toBe(expected);
    } finally {
      component.destroy();
    }
  });

  test('an explicit false survives a true default', async () => {
    const component = await Harness.testCreate(Checkbox, { ...comp1, defaultValue: true });
    try {
      expect(component.getValue()).toBe(true);
      component.setValue(false);
      expect(component.getValue()).toBe(false);
      expect(component.hasSetValue).toBe(true);
    } finally {
      component.destroy();
    }
  });
});
