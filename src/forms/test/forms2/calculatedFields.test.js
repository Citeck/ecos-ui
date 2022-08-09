import { TestForm } from './TestForm';
import assert from 'power-assert';

describe('Calculated fields test #2', () => {
  it('Should be initialized. Create mode', async done => {
    const form = await TestForm.create(
      definition,
      { formMode: 'CREATE' },
      {
        field0: 7,
        field1: 13
      }
    );
    let formData = form.getFormData();
    assert.equal(formData.field0, 7);
    assert.equal(formData.field1, 13);
    assert.equal(formData.totalWithOverride, 20);
    assert.equal(formData.totalWithOverride, 20);

    await form.setInputValue('field0', 10);
    formData = form.getFormData();
    assert.equal(formData.field0, 10);
    assert.equal(formData.totalWithOverride, 23);
    assert.equal(formData.totalWithOverride, 23);

    await form.setInputValue('totalWithOverride', 1000);
    formData = form.getFormData();
    assert.equal(formData.totalWithOverride, 1000);

    await form.setInputValue('totalWithoutOverride', 1000);
    formData = form.getFormData();
    assert.equal(formData.totalWithoutOverride, 23);
    assert.equal(formData.totalWithOverride, 1000);

    await form.setInputValue('totalWithOverride', null);
    formData = form.getFormData();
    assert.equal(formData.totalWithOverride, '');

    await form.setInputValue('totalWithoutOverride', null);
    formData = form.getFormData();
    assert.equal(formData.totalWithoutOverride, 23);

    done();
  });
});

const definition = {
  components: [
    {
      label: 'field0',
      type: 'number',
      input: true,
      key: 'field0'
    },
    {
      label: 'field1',
      type: 'number',
      input: true,
      key: 'field1'
    },
    {
      label: 'Total with override',
      type: 'number',
      input: true,
      key: 'totalWithOverride',
      calculateValue: 'value = (data.field0 || 0) + (data.field1 || 0);',
      allowCalculateOverride: true
    },
    {
      label: 'Total without override',
      type: 'number',
      input: true,
      key: 'totalWithoutOverride',
      calculateValue: 'value = (data.field0 || 0) + (data.field1 || 0);',
      allowCalculateOverride: false
    }
  ]
};
