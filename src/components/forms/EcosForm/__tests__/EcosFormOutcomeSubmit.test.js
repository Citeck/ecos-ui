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

  try {
    form.ecos = { form: ecosForm };
    form.nosubmit = true;
    form.setValue({ data: { sourceField: 'old' } });
    await new Promise(resolve => form.once('change', resolve));
    expect(form.data.derivedField).toBe('old!');

    form.on('submit', createFormSubmitHandler(form, ecosForm.submitForm));
    form.once('submit', () => {
      expect(form.data.derivedField).toBe('old!');
      delete form.data.outcome_Repeal;
      form.data.outcome_RequestInfo = true;
    });

    form.getComponent('sourceField').setValue('new');
    form.getComponent('outcome_Repeal').buttonElement.click();
    await expect(form.ecosButtonSubmit()).resolves.toMatchObject({ persistedRecord });

    expect(record.att).toHaveBeenCalledWith('outcome_Repeal', true);
    expect(record.att).toHaveBeenCalledWith('_formInfo', expect.objectContaining({ submitName: { en: 'Repeal', ru: 'Аннулировать' } }));
    expect(record.att.mock.calls.some(([key]) => key === 'outcome_RequestInfo')).toBe(false);
    expect(record.att).toHaveBeenCalledWith('.att(n:"derivedField"){str}', 'new!');
    expect(record.save).toHaveBeenCalledTimes(1);
  } finally {
    ecosForm.submitForm.cancel();
    get.mockRestore();
    form.destroy();
  }
}, 9000);
