import assert from 'power-assert';

import { TestForm } from './TestForm';
import Formio from '../../Formio';

describe('Parent Form test', function() {
  const createForm = (options = {}) =>
    TestForm.create(
      { components: [] },
      { formMode: 'CREATE', ...options },
      {
        field0: 7,
        field1: 13
      }
    );

  beforeEach(() => {
    Formio.forms = {};
  });

  it('No parent form', async () => {
    const form = await createForm();

    assert.equal(form.getForm().parentForm, null);
  });

  it('There is a parent form (a chain of 2 forms)', async () => {
    expect(Formio.forms).toMatchObject({});

    const form1 = await createForm();
    const form2 = await createForm();

    assert.equal(form1.getForm().parentForm, null);
    assert.equal(form2.getForm().id, Object.keys(Formio.forms).pop());
    assert.equal(form2.getForm().parentForm.id, Object.keys(Formio.forms)[0]);
  });

  it('There is a parent form (a chain of many forms)', async () => {
    const forms = [];

    expect(Formio.forms).toMatchObject({});

    for (let i = 0; i < 5; i++) {
      forms.push(await createForm());
    }

    forms.forEach((form, index) => {
      if (index === 0) {
        assert.equal(forms[0].getForm().parentForm, null);
      } else {
        assert.equal(forms[index - 1].getForm().id, forms[index].getForm().parentForm.id);
      }
    });
  });

  it('All open forms are cached in Formio.forms', async () => {
    const forms = [];

    expect(Formio.forms).toMatchObject({});

    for (let i = 0; i < 5; i++) {
      forms.push(await createForm());
    }

    forms.forEach((form, index) => {
      assert.equal(form.getForm().id, Object.keys(Formio.forms)[index]);
    });
  });

  it('A closed form is removed from the form cache', async () => {
    const forms = [];

    expect(Formio.forms).toMatchObject({});

    for (let i = 0; i < 5; i++) {
      forms.push(await createForm());
    }

    forms.forEach((item, index) => {
      if (index !== 0) {
        const form = item.getForm();
        const id = form.id;

        assert.equal(Formio.forms[id].id, id);

        form.destroy();

        assert.equal(Formio.forms[id], undefined);
      }
    });
  });

  it('After closing all forms, the form cache is cleared', async () => {
    const forms = [];

    expect(Formio.forms).toMatchObject({});

    for (let i = 0; i < 5; i++) {
      forms.push(await createForm());
    }

    forms.forEach(form => {
      form.getForm().destroy();
    });

    expect(Formio.forms).toMatchObject({});
  });

  it('Explicit parentId in form options', async () => {
    expect(Formio.forms).toMatchObject({});

    const form1 = await createForm();
    const form2 = await createForm();
    const form3 = await createForm({ parentId: form1.getForm().id });
    const form4 = await createForm({ parentId: form1.getForm().id });
    const form5 = await createForm();

    assert.equal(form1.getForm().parentForm, null);
    assert.equal(form2.getForm().parentForm.id, form1.getForm().id);
    assert.equal(form3.getForm().parentForm.id, form1.getForm().id);
    assert.equal(form4.getForm().parentForm.id, form1.getForm().id);
    assert.equal(form5.getForm().parentForm.id, form4.getForm().id);
  });
});
