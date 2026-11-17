import { fireEvent, waitFor } from '@testing-library/react';

import EventEmitter from '../../../EventEmitter';
import WebformBuilder from '../../../WebformBuilder';
import Harness from '../../../test/harness';

import SelectJournalComponent from './SelectJournal';
import comp1 from './fixtures/comp1';

const setting = 'openNewBrowserTab';

describe('SelectJournal optional link policy', () => {
  it('does not default the schema to false', () => {
    expect(SelectJournalComponent.schema()).not.toHaveProperty(setting);
  });

  it.each([undefined, true, false])('passes %s initially and through the debounced update', async value => {
    const component = await Harness.testCreate(SelectJournalComponent, { ...comp1, [setting]: value });
    expect(component.getComponentAttributes()[setting]).toBe(value);
    expect((await component.getInitialReactProps())[setting]).toBe(value);
    const push = jest.spyOn(component, 'setReactProps').mockImplementation(() => {});
    for (const next of [true, false, undefined]) {
      component.component[setting] = next;
      component.delayedSettingProps({});
      component.delayedSettingProps.flush();
      expect(push).toHaveBeenLastCalledWith(expect.objectContaining({ [setting]: next }));
    }
    push.mockRestore();
    component.destroy();
  });
});

describe('SelectJournal builder link policy serialization', () => {
  let builder;
  let element;

  const close = () => {
    if (builder) {
      builder.editForm.destroy();
      builder.dialog.close();
      builder.destroy();
      element.remove();
      builder = null;
    }
  };

  afterEach(close);

  // Recreate the builder from persisted JSON, as when reopening a saved form.
  const open = async schema => {
    close();
    element = document.createElement('div');
    document.body.appendChild(element);
    builder = new WebformBuilder(element, {
      editForm: { events: new EventEmitter({ wildcard: false, maxListeners: 0 }) }
    });
    await builder.setForm({ components: [schema] });
    await builder.builderReady;
    builder.editComponent(builder.getComponent(schema.key));
    await builder.editForm.formReady;
    fireEvent.click(builder.dialog.querySelector('a[href="#display-reworked"]'));
    await waitFor(() => expect(builder.dialog.querySelectorAll('input[name^="data[openNewBrowserTab]"]')).toHaveLength(3));
  };

  const choose = async choice => {
    const value = choice === '' ? '' : choice === 'true';
    const updated = new Promise(resolve => {
      const onUpdate = component => {
        if (component.component[setting] === value) {
          builder.off('updateComponent', onUpdate);
          resolve();
        }
      };
      builder.on('updateComponent', onUpdate);
    });
    fireEvent.click(builder.dialog.querySelector(`input[name^="data[openNewBrowserTab]"][value="${choice}"]`));
    await updated;
    expect(builder.editForm.data[setting]).toBe(value);
  };

  const save = async () => {
    const rebuild = jest.spyOn(builder, 'setForm');
    fireEvent.click(builder.dialog.querySelector('button.btn-success'));
    await rebuild.mock.results[0].value;
    rebuild.mockRestore();
    return JSON.parse(JSON.stringify(builder.schema.components[0]));
  };

  it.each(['', 'true', 'false'])('saves/reopens the actual builder choice "%s" without coercion', async choice => {
    await open(SelectJournalComponent.schema());
    await choose(choice);
    const saved = await save();
    if (choice === '') {
      expect(saved).not.toHaveProperty(setting);
    } else {
      expect(saved[setting]).toBe(choice === 'true');
    }
    await open(JSON.parse(JSON.stringify(saved)));
    await waitFor(() =>
      expect(builder.dialog.querySelector(`input[name^="data[openNewBrowserTab]"][value="${choice}"]`).checked).toBe(true)
    );
    expect(await save()).toEqual(saved);
  });

  it('saves legacy absence and removes either explicit policy when returning to default', async () => {
    await open(SelectJournalComponent.schema());
    let saved = await save();
    expect(saved).not.toHaveProperty(setting);
    for (const choice of ['true', 'false']) {
      await open(saved);
      await choose(choice);
      saved = await save();
      expect(saved[setting]).toBe(choice === 'true');
      await open(saved);
      await choose('');
      saved = await save();
      expect(saved).not.toHaveProperty(setting);
      await open(saved);
      saved = await save();
      expect(saved).not.toHaveProperty(setting);
    }
  });
});
