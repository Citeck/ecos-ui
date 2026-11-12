import Harness from '../../../test/harness';
import Validator from '../../Validator';

import Checkbox from './Checkbox';
import comp1 from './fixtures/comp1';

async function withCheckbox(validate, run, options = {}) {
  const component = await Harness.testCreate(Checkbox, { ...comp1, ...options, validate });
  try {
    await run(component);
  } finally {
    component.destroy();
  }
}

describe('required checkbox boolean answers', () => {
  test.each([false, true])('three-state=%s treats either boolean as answered and null/undefined as missing', async hasThreeStates => {
    await withCheckbox(
      { required: true },
      component => {
        for (const [value, answered] of [
          [false, true],
          [true, true],
          [null, false],
          [undefined, false]
        ]) {
          expect(component.isEmpty(value)).toBe(!answered);
          const message = Validator.checkValidator(component, Validator.validators.required, true, value, {});
          expect(message === '').toBe(answered);
        }
      },
      { hasThreeStates }
    );
  });

  test('ordinary required checkbox accepts false without an extra validation flag', async () => {
    await withCheckbox({ required: true }, component => {
      component.setValue(false);
      expect(component.getValue()).toBe(false);
      expect(component.checkValidity(component.data, true)).toBe(true);
      component.setValue(true);
      expect(component.checkValidity(component.data, true)).toBe(true);
    });
  });

  test('false stays valid through ordinary two-state clicks', async () => {
    await withCheckbox({ required: true }, component => {
      expect(component.hasThreeStates).toBe(false);
      expect(component.getValue()).toBe(false);
      expect(component.checkValidity(component.data, true)).toBe(true);
      for (const expected of [true, false, true, false]) {
        Harness.clickElement(component, 'input[type="checkbox"]');
        expect(component.getValue()).toBe(expected);
        expect(component.checkValidity(component.data, true)).toBe(true);
      }
    });
  });

  test('an explicit true-only rule still rejects false', async () => {
    await withCheckbox({ required: true, custom: 'valid = input === true || "true only";' }, component => {
      component.setValue(false);
      expect(component.checkValidity(component.data, true)).toBe(false);
      component.setValue(true);
      expect(component.checkValidity(component.data, true)).toBe(true);
    });
  });

  test('an unselected radio checkbox remains empty', async () => {
    await withCheckbox(
      { required: true },
      component => {
        expect(component.isRadioCheckbox).toBe(true);
        expect(component.isEmpty(false)).toBe(true);
        expect(Validator.checkValidator(component, Validator.validators.required, true, false, {})).not.toBe('');
      },
      { inputType: 'radio', value: 'selected' }
    );
  });

  test('optional and disabled required checks retain native handling', async () => {
    await withCheckbox({ required: true }, component => {
      expect(Validator.checkValidator(component, Validator.validators.required, false, null, {})).toBe('');
      component.component.disabled = true;
      expect(Validator.checkValidator(component, Validator.validators.required, true, null, {})).toBe('');
    });
  });
});
