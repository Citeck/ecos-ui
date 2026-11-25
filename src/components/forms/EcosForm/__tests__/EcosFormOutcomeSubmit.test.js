import Records from '@citeck/records-core';

import '@/forms/test/harness';
import '@/forms/Webform';

import EcosForm from '../EcosForm';
import { createFormSubmitHandler } from '../submitUtils';

import Formio from '@/forms/Formio';

// The default test adapter omits submit-time helpers; exercise the production implementation here.
jest.mock('../EcosFormUtils', () => ({
  __esModule: true,
  get default() {
    return jest.requireActual('../EcosFormUtils/EcosFormUtils').default;
  }
}));

const textField = (key, options = {}) => ({ key, label: key, type: 'textfield', input: true, ...options });

it('saves the clicked outcome together with fields recalculated after a forced submit', async () => {
  const form = await Formio.createForm(document.createElement('div'), {
    type: 'form',
    components: [
      textField('sourceField'),
      textField('derivedField', { calculateValue: 'value = data.sourceField + "!";' }),
      { key: 'outcome_Repeal', label: { en: 'Repeal', ru: 'Аннулировать' }, type: 'button', input: true, action: 'event', event: 'repeal' }
    ]
  });
  const ecosForm = new EcosForm({});
  const persistedRecord = {};
  const record = { att: jest.fn(), removeAtt: jest.fn(), save: jest.fn().mockResolvedValue(persistedRecord) };
  const get = jest.spyOn(Records, 'get').mockReturnValue(record);

  const sourceField = form.getComponent('sourceField');
  const originalFormOnChange = form.onChange;
  const originalFormTriggerChange = form.triggerChange;
  const originalSourceTriggerChange = sourceField.triggerChange;

  try {
    form.ecos = { form: ecosForm };
    form.nosubmit = true;
    form.setValue({ data: { sourceField: 'old' } });
    await new Promise(resolve => form.once('change', resolve));
    expect(form.data.derivedField).toBe('old!');

    // Hold both already-queued root onChange timers and new 100ms debounced change triggers until
    // the submit event fires, then run the root onChange synchronously before the debounced save.
    let deferredSourceChangeArgs = null;
    let deferredRootChangeArgs = null;
    form.onChange = () => {
      form.changing = true;
    };
    form.triggerChange = (...args) => {
      form.changing = true;
      deferredRootChangeArgs = args;
    };
    sourceField.triggerChange = (...args) => {
      form.changing = true;
      deferredSourceChangeArgs = args;
    };

    form.on('submit', createFormSubmitHandler(form, ecosForm.submitForm));
    form.once('submit', () => {
      expect(form.data.derivedField).toBe('old!');
      expect(deferredSourceChangeArgs).not.toBeNull();
      delete form.data.outcome_Repeal;
      form.data.outcome_RequestInfo = true;

      deferredRootChangeArgs = null;
      sourceField.triggerChange = originalSourceTriggerChange;
      sourceField.onChange(...deferredSourceChangeArgs);
      deferredSourceChangeArgs = null;

      expect(deferredRootChangeArgs).not.toBeNull();
      form.onChange = originalFormOnChange;
      form.triggerChange = originalFormTriggerChange;
      form.changing = false;
      originalFormOnChange.apply(form, deferredRootChangeArgs);
      deferredRootChangeArgs = null;
      expect(form.data.derivedField).toBe('new!');
    });

    sourceField.setValue('new');
    form.getComponent('outcome_Repeal').buttonElement.click();
    await expect(form.ecosButtonSubmit()).resolves.toMatchObject({ persistedRecord });

    expect(record.att).toHaveBeenCalledWith('outcome_Repeal', true);
    expect(record.att).toHaveBeenCalledWith('_formInfo', expect.objectContaining({ submitName: { en: 'Repeal', ru: 'Аннулировать' } }));
    expect(record.att.mock.calls.some(([key]) => key === 'outcome_RequestInfo')).toBe(false);
    expect(record.att).toHaveBeenCalledWith('.att(n:"derivedField"){str}', 'new!');
    expect(record.save).toHaveBeenCalledTimes(1);
  } finally {
    form.onChange = originalFormOnChange;
    form.triggerChange = originalFormTriggerChange;
    sourceField.triggerChange = originalSourceTriggerChange;
    ecosForm.submitForm.cancel();
    get.mockRestore();
    form.destroy();
  }
}, 20000);
