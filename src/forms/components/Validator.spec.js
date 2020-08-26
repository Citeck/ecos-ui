import BaseComponent from './override/base/Base';
import Validator from './Validator';

describe('Validator Tests', () => {
  const baseComponent = new BaseComponent({});
  const disabledComponent = new BaseComponent({ disabled: true });

  it('Should test for minLength', () => {
    expect(Validator.validators.minLength.check(baseComponent, 5, 'test')).toBe(false);
    expect(Validator.validators.minLength.check(baseComponent, 4, 'test')).toBe(true);
    expect(Validator.validators.minLength.check(baseComponent, 3, 'test')).toBe(true);
    expect(Validator.validators.minLength.check(baseComponent, 6, 'test')).toBe(false);
    expect(Validator.validators.minLength.check(baseComponent, 6, '')).toBe(false);
  });

  it('Should test for maxLength', () => {
    expect(Validator.validators.maxLength.check(baseComponent, 5, 'test')).toBe(true);
    expect(Validator.validators.maxLength.check(baseComponent, 4, 'test')).toBe(true);
    expect(Validator.validators.maxLength.check(baseComponent, 3, 'test')).toBe(false);
    expect(Validator.validators.maxLength.check(baseComponent, 6, 'test')).toBe(true);
    expect(Validator.validators.maxLength.check(baseComponent, 6, '')).toBe(true);
  });

  it('Should test for email', () => {
    expect(Validator.validators.email.check(baseComponent, '', 'test')).toBe(false);
    expect(Validator.validators.email.check(baseComponent, '', 'test@a')).toBe(false);
    expect(Validator.validators.email.check(baseComponent, '', 'test@example.com')).toBe(true);
    expect(Validator.validators.email.check(baseComponent, '', 'test@a.com')).toBe(true);
    expect(Validator.validators.email.check(baseComponent, '', 'test@a.co')).toBe(true);
  });

  it('Should test for required', () => {
    expect(Validator.validators.required.check(baseComponent, true, '')).toBe(false);
    expect(Validator.validators.required.check(baseComponent, true, 't')).toBe(true);
    expect(Validator.validators.required.check(baseComponent, false, '')).toBe(true);
    expect(Validator.validators.required.check(baseComponent, false, 'tes')).toBe(true);
    expect(Validator.validators.required.check(baseComponent, true, undefined)).toBe(false);
    expect(Validator.validators.required.check(baseComponent, true, null)).toBe(false);
    expect(Validator.validators.required.check(baseComponent, true, [])).toBe(false);
    expect(Validator.validators.required.check(baseComponent, true, ['test'])).toBe(true);

    expect(Validator.validators.required.check(disabledComponent, true, '')).toBe(true);
    expect(Validator.validators.required.check(disabledComponent, true, 't')).toBe(true);
    expect(Validator.validators.required.check(disabledComponent, false, '')).toBe(true);
    expect(Validator.validators.required.check(disabledComponent, false, 'tes')).toBe(true);
    expect(Validator.validators.required.check(disabledComponent, true, undefined)).toBe(true);
    expect(Validator.validators.required.check(disabledComponent, true, null)).toBe(true);
    expect(Validator.validators.required.check(disabledComponent, true, [])).toBe(true);
    expect(Validator.validators.required.check(disabledComponent, true, ['test'])).toBe(true);
  });

  it('Should test for custom', () => {
    expect(Validator.validators.custom.check(baseComponent, 'valid = (input == "test")', 'test')).toBe(true);
    expect(Validator.validators.custom.check(baseComponent, 'valid = (input == "test")', 'test2')).toBe(false);
    expect(Validator.validators.custom.check(baseComponent, 'valid = (input == "test") ? true : "Should be false."', 'test2')).toBe(
      'Should be false.'
    );
    expect(Validator.validators.custom.check(baseComponent, 'valid = (input == "test") ? true : "Should be false."', 'test')).toBe(true);
  });

  it('Should test for pattern', () => {
    expect(Validator.validators.pattern.check(baseComponent, 'A.*', 'A')).toBe(true);
    expect(Validator.validators.pattern.check(baseComponent, 'A.*', 'Aaaa')).toBe(true);
    expect(Validator.validators.pattern.check(baseComponent, 'w+', 'test')).toBe(false);
    expect(Validator.validators.pattern.check(baseComponent, '\\w+', 'test')).toBe(true);
    expect(Validator.validators.pattern.check(baseComponent, '\\w+@\\w+', 'test@a')).toBe(true);
    expect(Validator.validators.pattern.check(baseComponent, '\\w+@\\w+', 'test@example.com')).toBe(false);
  });

  it('Should test for json', () => {
    expect(
      Validator.validators.json.check(
        baseComponent,
        {
          or: [{ _isEqual: [{ var: 'data.test' }, ['1', '2', '3']] }, 'Should be false.']
        },
        null,
        { test: ['1', '2', '3'] }
      )
    ).toBe(true);

    expect(
      Validator.validators.json.check(
        baseComponent,
        {
          or: [{ _isEqual: [{ var: 'data.test' }, ['1', '2', '3']] }, 'Should be false.']
        },
        null,
        { test: ['1', '2', '4'] }
      )
    ).toBe('Should be false.');
  });
});
