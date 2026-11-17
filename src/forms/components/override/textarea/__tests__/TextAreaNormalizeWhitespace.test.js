import { TestForm } from '../../../../test/forms2/TestForm';
import Base from '../../base/Base';
import CheckboxComponent from '../../checkbox/Checkbox';
import EmailComponent from '../../email/Email';
import NumberComponent from '../../number/Number';
import SelectComponent from '../../select/Select';
import TextFieldComponent from '../../textfield/TextField';
import TextAreaComponent from '../TextArea';

/**
 * Verifies EMTC-616 / FGW-02 client-side whitespace normalization:
 * - Preserves spaces while typing in the focused control so multi-word entry works cleanly.
 * - Visibly normalizes leading/trailing/repeated whitespace on blur (DOM input + submission data)
 *   and emits a form change event.
 * - Normalizes before LENGTH / PATTERN / required validation and submit so an 81-char input with
 *   a doubled internal space (normalizing to 80) is accepted while an 81-char normalized input fails.
 */
describe('TextArea / TextField normalizeWhitespace (EMTC-616)', () => {
  const createNormalizeForm = async () => {
    const definition = {
      components: [
        {
          type: 'textarea',
          key: 'fgraSAPLongDescriptionRU',
          label: 'SAP long description RU',
          input: true,
          normalizeWhitespace: true,
          validate: {
            required: true,
            custom:
              'if (!(input == null || input === "" || (Array.isArray(input) && input.length === 0))) {\n' +
              '  if (("" + input).length > 80) {\n' +
              '    valid = "validation.noMoreThan80CharactersLiteral";\n' +
              '  } else if (!/^[^,"\\;\\*#!\\?a-zа-я]+$/.test(input)) {\n' +
              '    valid = "validation.uppercaseOnlyCommaStar";\n' +
              '  }\n' +
              '}'
          }
        },
        {
          type: 'textfield',
          key: 'shortTextField',
          label: 'Short text',
          input: true,
          normalizeWhitespace: true,
          validate: {
            maxLength: 40
          }
        }
      ]
    };

    const wrapper = await TestForm.create(definition);
    const form = wrapper.getForm();
    form.nosubmit = true;
    return wrapper;
  };

  it('keeps trailing spaces while typing and visibly normalizes leading/repeated spaces on blur', async () => {
    const wrapper = await createNormalizeForm();
    const form = wrapper.getForm();
    const longComp = form.getComponent('fgraSAPLongDescriptionRU');
    const longInput = longComp.inputs[0];
    const shortComp = form.getComponent('shortTextField');
    const shortInput = shortComp.inputs[0];

    longInput.dispatchEvent(new Event('focus'));
    expect(form.focusedComponent).toBe(longComp);

    longInput.value = 'SHAMPOO ';
    longInput.dispatchEvent(new Event('input'));
    expect(longInput.value).toBe('SHAMPOO ');
    expect(longComp.dataValue).toBe('SHAMPOO ');

    longInput.value = '  ШАМПУНЬ   ДЛЯ  ВОЛОС  ';
    longInput.dispatchEvent(new Event('input'));
    expect(longInput.value).toBe('  ШАМПУНЬ   ДЛЯ  ВОЛОС  ');

    //Wait for debounced form 'change' triggered by blur normalization (500ms overrideTriggerChange)
    await new Promise(resolve => {
      const onChange = () => {
        form.off('change', onChange);
        resolve();
      };
      form.on('change', onChange);
      longInput.dispatchEvent(new Event('blur'));
      expect(longInput.value).toBe('ШАМПУНЬ ДЛЯ ВОЛОС');
      expect(longComp.dataValue).toBe('ШАМПУНЬ ДЛЯ ВОЛОС');
    });
    expect(wrapper.getFormData().fgraSAPLongDescriptionRU).toBe('ШАМПУНЬ ДЛЯ ВОЛОС');

    shortInput.dispatchEvent(new Event('focus'));
    shortInput.value = '  SHAMPOO\u00A0\u00A0HAIR  ';
    shortInput.dispatchEvent(new Event('input'));
    shortInput.dispatchEvent(new Event('blur'));
    expect(shortInput.value).toBe('SHAMPOO HAIR');
    expect(shortComp.dataValue).toBe('SHAMPOO HAIR');
  });

  it('normalizes before LENGTH 80 validation and submit, accepting 81-char raw collapsing to 80 and rejecting 81 normalized', async () => {
    const wrapper = await createNormalizeForm();
    const form = wrapper.getForm();
    const longComp = form.getComponent('fgraSAPLongDescriptionRU');
    const longInput = longComp.inputs[0];
    const shortComp = form.getComponent('shortTextField');
    const shortInput = shortComp.inputs[0];

    const raw81To80 = `${'A'.repeat(40)}  ${'B'.repeat(39)}`;
    expect(raw81To80).toHaveLength(81);

    longInput.dispatchEvent(new Event('focus'));
    longInput.value = raw81To80;
    longInput.dispatchEvent(new Event('input'));

    expect(form.checkValidity(form.submission.data, true, null, false)).toBe(true);
    expect(longComp.errors).toHaveLength(0);

    const submission = await form.submit();
    expect(submission.data.fgraSAPLongDescriptionRU).toBe(`${'A'.repeat(40)} ${'B'.repeat(39)}`);
    expect(longInput.value).toBe(`${'A'.repeat(40)} ${'B'.repeat(39)}`);
    expect(longInput.value).toHaveLength(80);

    const raw82To81 = `${'A'.repeat(40)}  ${'B'.repeat(40)}`;
    expect(raw82To81).toHaveLength(82);

    longInput.dispatchEvent(new Event('focus'));
    longInput.value = raw82To81;
    longInput.dispatchEvent(new Event('input'));
    expect(form.checkValidity(form.submission.data, true, null, false)).toBe(false);
    expect(longComp.errors.map(err => err.message)).toContain('validation.noMoreThan80CharactersLiteral');

    shortInput.dispatchEvent(new Event('focus'));
    shortInput.value = `${'C'.repeat(20)}  ${'D'.repeat(19)}`;
    shortInput.dispatchEvent(new Event('input'));
    expect(shortInput.value).toHaveLength(41);
    expect(shortComp.checkValidity(form.submission.data, true)).toBe(true);

    shortInput.value = `${'C'.repeat(20)}  ${'D'.repeat(20)}`;
    shortInput.dispatchEvent(new Event('input'));
    expect(shortComp.checkValidity(form.submission.data, true)).toBe(false);
  });

  it('exposes normalizeWhitespace schema and hooks only on TextField / plain TextArea components', async () => {
    expect(TextFieldComponent.schema().normalizeWhitespace).toBe(false);
    expect(TextAreaComponent.schema().normalizeWhitespace).toBe(false);
    expect(Base.schema().normalizeWhitespace).toBeUndefined();
    expect(NumberComponent.schema().normalizeWhitespace).toBeUndefined();
    expect(SelectComponent.schema().normalizeWhitespace).toBeUndefined();
    expect(CheckboxComponent.schema().normalizeWhitespace).toBeUndefined();
    expect(EmailComponent.schema().normalizeWhitespace).toBeUndefined();

    const wrapper = await TestForm.create({
      components: [
        {
          type: 'email',
          key: 'contactEmail',
          label: 'Email',
          input: true,
          normalizeWhitespace: true
        },
        {
          type: 'number',
          key: 'amount',
          label: 'Amount',
          input: true,
          normalizeWhitespace: true
        },
        {
          type: 'textarea',
          key: 'codeEditor',
          label: 'Code',
          editor: 'ace',
          input: true,
          normalizeWhitespace: true
        },
        {
          type: 'textfield',
          key: 'reqText',
          label: 'Req Text',
          input: true,
          normalizeWhitespace: true,
          validate: { required: true }
        },
        {
          type: 'textarea',
          key: 'optCustomArea',
          label: 'Opt Custom Area',
          input: true,
          normalizeWhitespace: true,
          validate: {
            required: false,
            custom: 'valid = "must not run on blank";'
          }
        },
        {
          type: 'textfield',
          key: 'optCustomText',
          label: 'Opt Custom Text',
          input: true,
          normalizeWhitespace: true,
          validate: {
            required: false,
            custom: 'valid = "must not run on blank";'
          }
        }
      ]
    });

    const form = wrapper.getForm();
    form.nosubmit = true;

    const emailComp = form.getComponent('contactEmail');
    const numberComp = form.getComponent('amount');
    const aceComp = form.getComponent('codeEditor');
    const reqTextComp = form.getComponent('reqText');
    const optCustomArea = form.getComponent('optCustomArea');
    const optCustomText = form.getComponent('optCustomText');

    expect(typeof emailComp.isPlainTextWhitespaceTarget).toBe('undefined');
    expect(typeof numberComp.isPlainTextWhitespaceTarget).toBe('undefined');
    expect(aceComp.isPlainTextWhitespaceTarget()).toBe(false);

    emailComp.setValue('user   name@example.com');
    expect(emailComp.validationValue).toBe('user   name@example.com');

    aceComp.setValue('  const   x = 1;  ');
    expect(aceComp.dataValue).toBe('  const   x = 1;  ');
    expect(aceComp.validationValue).toBe('  const   x = 1;  ');

    const reqTextInput = reqTextComp.inputs[0];
    reqTextInput.dispatchEvent(new Event('focus'));
    reqTextInput.value = '   \u00A0  ';
    reqTextInput.dispatchEvent(new Event('input'));
    expect(reqTextComp.validationValue).toBe('');
    expect(reqTextComp.checkValidity(form.submission.data, true)).toBe(false);

    const optAreaInput = optCustomArea.inputs[0];
    optAreaInput.dispatchEvent(new Event('focus'));
    optAreaInput.value = '   \u00A0  ';
    optAreaInput.dispatchEvent(new Event('input'));
    expect(optCustomArea.validationValue).toBe('');
    expect(optCustomArea.checkValidity(form.submission.data, true)).toBe(true);

    const optTextInput = optCustomText.inputs[0];
    optTextInput.dispatchEvent(new Event('focus'));
    optTextInput.value = '   \u00A0  ';
    optTextInput.dispatchEvent(new Event('input'));
    expect(optCustomText.validationValue).toBe('');
    expect(optCustomText.checkValidity(form.submission.data, true)).toBe(true);
  });
});
