import assert from 'power-assert';

import { TestForm } from './TestForm';
import Formio from '../../Formio';

describe('Parent Form test', function() {
  beforeEach(() => {
    Formio.forms = {};
  });

  it('No parent form', async done => {
    const form = await TestForm.create(
      { components: [] },
      { formMode: 'CREATE' },
      {
        field0: 7,
        field1: 13
      }
    );

    assert.equal(form.getForm().parentForm, null);

    done();
  });

  it('There is a parent form (a chain of 2 forms)', async done => {
    expect(Formio.forms).toMatchObject({});

    const form1 = await TestForm.create(
      { components: [] },
      { formMode: 'CREATE' },
      {
        field0: 7,
        field1: 13
      }
    );
    const form2 = await TestForm.create(
      { components: [] },
      { formMode: 'CREATE' },
      {
        field0: 7,
        field1: 13
      }
    );

    assert.equal(form1.getForm().parentForm, null);
    assert.equal(form2.getForm().id, Object.keys(Formio.forms).pop());
    assert.equal(form2.getForm().parentForm.id, Object.keys(Formio.forms)[0]);

    done();
  });

  it('There is a parent form (a chain of many forms)', async done => {
    const forms = [];

    expect(Formio.forms).toMatchObject({});

    for (let i = 0; i < 5; i++) {
      forms.push(
        await TestForm.create(
          { components: [] },
          { formMode: 'CREATE' },
          {
            field0: 7,
            field1: 13
          }
        )
      );
    }

    forms.forEach((form, index) => {
      if (index === 0) {
        assert.equal(forms[0].getForm().parentForm, null);
      } else {
        assert.equal(forms[index - 1].getForm().id, forms[index].getForm().parentForm.id);
      }
    });

    done();
  });

  it('All open forms are cached in Formio.forms', async done => {
    const forms = [];

    expect(Formio.forms).toMatchObject({});

    for (let i = 0; i < 5; i++) {
      forms.push(
        await TestForm.create(
          { components: [] },
          { formMode: 'CREATE' },
          {
            field0: 7,
            field1: 13
          }
        )
      );
    }

    forms.forEach((form, index) => {
      assert.equal(form.getForm().id, Object.keys(Formio.forms)[index]);
    });

    done();
  });

  it('A closed form is removed from the form cache', async done => {
    const forms = [];

    expect(Formio.forms).toMatchObject({});

    for (let i = 0; i < 5; i++) {
      forms.push(
        await TestForm.create(
          { components: [] },
          { formMode: 'CREATE' },
          {
            field0: 7,
            field1: 13
          }
        )
      );
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

    done();
  });

  it('After closing all forms, the form cache is cleared', async done => {
    const forms = [];

    expect(Formio.forms).toMatchObject({});

    for (let i = 0; i < 5; i++) {
      forms.push(
        await TestForm.create(
          { components: [] },
          { formMode: 'CREATE' },
          {
            field0: 7,
            field1: 13
          }
        )
      );
    }

    forms.forEach(form => {
      form.getForm().destroy();
    });

    expect(Formio.forms).toMatchObject({});

    done();
  });
});
