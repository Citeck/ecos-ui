import { TestForm } from './TestForm';
import assert from 'power-assert';

describe('Calculated fields test #2', () => {
  it('Allow calculate override. Create mode', async done => {
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
    assert.equal(formData.totalWithoutOverride, 20);
    assert.equal(formData.totalWithOverride, 20);

    await form.setInputValue('field0', 10);
    formData = form.getFormData();
    assert.equal(formData.field0, 10);
    assert.equal(formData.totalWithoutOverride, 23);
    assert.equal(formData.totalWithOverride, 23);

    await form.setInputValue('totalWithOverride', 1000);
    formData = form.getFormData();
    assert.equal(formData.totalWithOverride, 1000);

    await form.setInputValue('totalWithoutOverride', 1000);
    formData = form.getFormData();
    assert.equal(formData.totalWithoutOverride, 23);
    assert.equal(formData.totalWithOverride, 1000);

    await form.setInputValue('field0', 2000);
    formData = form.getFormData();
    assert.equal(formData.field0, 2000);
    assert.equal(formData.totalWithoutOverride, 2013);
    assert.equal(formData.totalWithOverride, 1000);

    await form.setInputValue('totalWithOverride', null);
    formData = form.getFormData();
    assert.equal(formData.totalWithOverride, '');

    await form.setInputValue('totalWithoutOverride', null);
    formData = form.getFormData();
    assert.equal(formData.totalWithoutOverride, 2013);

    done();
  });

  it('Allow calculated override test. Edit mode', async done => {
    const form0 = await TestForm.create(
      definition,
      { formMode: 'EDIT' },
      {
        field0: 7,
        field1: 13,
        totalWithOverride: 10,
        totalWithoutOverride: 10
      }
    );

    let formData = form0.getFormData();
    assert.equal(formData.field0, 7);
    assert.equal(formData.field1, 13);
    assert.equal(formData.totalWithOverride, 10);
    assert.equal(formData.totalWithoutOverride, 20);

    await form0.setInputValue('field0', 10);
    formData = form0.getFormData();
    assert.equal(formData.field0, 10);
    assert.equal(formData.totalWithOverride, 10);
    assert.equal(formData.totalWithoutOverride, 23);

    const form1 = await TestForm.create(
      definition,
      { formMode: 'EDIT' },
      {
        field0: 7,
        field1: 13,
        totalWithOverride: 20
      }
    );

    formData = form1.getFormData();
    assert.equal(formData.field0, 7);
    assert.equal(formData.field1, 13);
    assert.equal(formData.totalWithOverride, 20);

    await form1.setInputValue('field0', 10);
    formData = form1.getFormData();
    assert.equal(formData.totalWithOverride, 23);

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
