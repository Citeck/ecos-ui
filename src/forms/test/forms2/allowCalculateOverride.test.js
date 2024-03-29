import { TestForm } from './TestForm';
import assert from 'power-assert';

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
    },
    {
      label: 'Non-calculated orgstruct',
      type: 'selectOrgstruct',
      input: true,
      key: 'nonCalculatedOrgstruct'
    },
    {
      label: 'Orgstruct with override',
      type: 'selectOrgstruct',
      input: true,
      key: 'orgstructWithOverride',
      calculateValue: 'value = data.nonCalculatedOrgstruct;',
      allowCalculateOverride: true
    },
    {
      label: 'Non-calculated selectJournal',
      type: 'selectJournal',
      input: true,
      key: 'nonCalculatedSelectJournal'
    },
    {
      label: 'SelectJournal without override',
      type: 'selectJournal',
      input: true,
      key: 'selectJournalWithoutOverride',
      calculateValue: 'value = data.nonCalculatedSelectJournal;'
    },
    {
      label: 'SelectJournal with override',
      type: 'selectJournal',
      input: true,
      key: 'selectJournalWithOverride',
      calculateValue: 'value = data.nonCalculatedSelectJournal;',
      allowCalculateOverride: true
    }
  ]
};

let form;
beforeAll(async () => {
  form = await TestForm.create(
    definition,
    { formMode: 'CREATE' },
    {
      field0: 7,
      field1: 13
    }
  );
});

describe('Calculated fields test #2', () => {
  it('Allow calculate override. Create mode part1', async () => {
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
  });

  it('Allow calculate override. Create mode select orgstruct part 1', async () => {
    let formData = form.getFormData();
    // ++ orgstruct ++

    await form.setInputValue('nonCalculatedOrgstruct', 'admin');
    formData = form.getFormData();
    assert.equal(formData.orgstructWithOverride, 'emodel/person@admin');

    // -- orgstruct --
  });

  it('Allow calculate override. Create mode select orgstruct part 2', async () => {
    let formData = form.getFormData();
    // ++ orgstruct ++

    await form.setInputValue('nonCalculatedOrgstruct', 'fet');
    formData = form.getFormData();
    assert.equal(formData.orgstructWithOverride, 'emodel/person@fet');

    // -- orgstruct --
  });

  it('Allow calculate override. Create mode select orgstruct part 3', async () => {
    let formData = form.getFormData();
    // ++ orgstruct ++

    await form.setInputValue('orgstructWithOverride', 'admin');

    formData = form.getFormData();
    assert.equal(formData.orgstructWithOverride, 'emodel/person@admin');

    // -- orgstruct --
  });

  it('Allow calculate override. Create mode select orgstruct part 4', async () => {
    let formData = form.getFormData();
    // ++ orgstruct ++

    await form.setInputValue('nonCalculatedOrgstruct', 'pushkin');

    formData = form.getFormData();
    assert.equal(formData.nonCalculatedOrgstruct, 'emodel/person@pushkin');

    // -- orgstruct --
  });

  it('Allow calculate override. Create mode selectjournal part1', async () => {
    let formData = form.getFormData();
    // ++ selectjournal ++

    await form.setInputValue('nonCalculatedSelectJournal', 'ecos-documents');
    formData = form.getFormData();
    assert.equal(formData.selectJournalWithOverride, 'ecos-documents');
    assert.equal(formData.selectJournalWithoutOverride, 'ecos-documents');

    // -- selectjournal --
  });

  it('Allow calculate override. Create mode selectjournal part2', async () => {
    let formData = form.getFormData();
    // ++ selectjournal ++

    await form.setInputValue('selectJournalWithOverride', 'ecos-types');
    formData = form.getFormData();
    assert.equal(formData.selectJournalWithOverride, 'ecos-types');

    // -- selectjournal --
  });

  it('Allow calculate override. Create mode selectjournal part3', async () => {
    let formData = form.getFormData();

    // ++ selectjournal ++
    await form.setInputValue('selectJournalWithoutOverride', 'ecos-types');
    formData = form.getFormData();
    assert.equal(formData.selectJournalWithoutOverride, 'ecos-documents');

    // -- selectjournal --
  });

  it('Allow calculate override. Create mode selectjournal part4', async () => {
    let formData = form.getFormData();

    await form.setInputValue('nonCalculatedSelectJournal', 'contract-agreements');
    formData = form.getFormData();
    assert.equal(formData.selectJournalWithOverride, 'ecos-types');
    assert.equal(formData.selectJournalWithoutOverride, 'contract-agreements');

    // -- selectjournal --
  });

  it('Allow calculated override test. Edit mode', async () => {
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
  });
});
