import { TestForm } from '../test/forms2/TestForm';

const field = (key, extra = {}) => ({ type: 'textfield', input: true, key, label: key, ...extra });
const plain = { components: [field('first'), field('second')] };
const summaryItems = form => Array.from(form.element.querySelectorAll('.alert.alert-danger li')).map(el => el.textContent);

function seedError(form, key, message, metadata = {}) {
  const component = form.getComponent(key);
  component.setCustomValidity(message, true);
  Object.assign(component.error, metadata);
  return component.error;
}

function observeErrors(form) {
  const events = [];
  form.on('error', errors => events.push(errors));
  return events;
}

function expectConsistent(form, errors, events, messages) {
  expect(errors.map(error => error.message || error)).toEqual(messages);
  expect(summaryItems(form)).toEqual(messages);
  expect(events[events.length - 1] === errors).toBe(true);
}

describe('Webform error reconciliation (EMTC-482)', () => {
  it('reconciles client, server and custom errors before rendering, returning and emitting', async () => {
    const form = (await TestForm.create(plain)).getForm();
    const clientError = seedError(form, 'first', 'Already exists', { code: 'duplicate', context: { source: 'validation' } });
    const events = observeErrors(form);
    form.customErrors = [{ message: 'Already exists' }, { message: 'Custom only' }, { message: 'Custom only' }];

    const errors = form.showErrors([{ message: 'Already exists' }, { message: 'Server only' }], true);

    expectConsistent(form, errors, events, ['Already exists', 'Server only', 'Custom only']);
    expect(errors[0] === clientError).toBe(true);
    expect(form.getComponent('first').error === clientError).toBe(true);
    expect(form.getComponent('first').element.classList.contains('has-error')).toBe(true);
    expect(clientError.context).toEqual({ source: 'validation' });
  });

  it.each([
    ['string', message => message],
    ['Error', message => new Error(message)],
    ['object', message => ({ message })],
    ['array', message => [{ message }, { message }]],
    ['details', message => ({ details: [{ message }, { message }] })]
  ])('keeps %s delivery idempotent through showErrors and onSubmissionError', async (name, makeError) => {
    const form = (await TestForm.create(plain)).getForm();
    const clientError = seedError(form, 'first', 'Same message', { code: 'kept' });
    const events = observeErrors(form);
    const delivery = makeError('Same message');

    [form.showErrors(delivery, true), form.showErrors(makeError('Same message'), true), form.onSubmissionError(delivery)].forEach(
      errors => {
        expect(errors).toHaveLength(1);
        expect(errors[0] === clientError).toBe(true);
      }
    );
    expectConsistent(form, events[events.length - 1], events, ['Same message']);
    expect(form.getComponent('first').error === clientError).toBe(true);
    expect(events).toHaveLength(3);
  });

  it('preserves two fields with the same message and does not overwrite their inline metadata', async () => {
    const form = (await TestForm.create(plain)).getForm();
    const first = seedError(form, 'first', 'Same message', { code: 'first' });
    const second = seedError(form, 'second', 'Same message', { code: 'second' });
    const events = observeErrors(form);

    const errors = form.showErrors({ message: 'Same message' }, true);

    expectConsistent(form, errors, events, ['Same message', 'Same message']);
    expect(errors[0] === first).toBe(true);
    expect(errors[1] === second).toBe(true);
    expect(form.getComponent('first').error === first).toBe(true);
    expect(form.getComponent('second').error === second).toBe(true);
  });

  it('retains multi-field bindings without mutating them on repeated delivery', async () => {
    const form = (await TestForm.create(plain)).getForm();
    const components = Object.freeze(['first', 'second']);
    const error = Object.freeze({ message: 'Server validation', components, component: 'first', path: 'second', code: 'server' });
    const events = observeErrors(form);

    const first = form.showErrors([error, { ...error, components: [...components] }], true);
    const second = form.onSubmissionError(error);

    expect(components).toEqual(['first', 'second']);
    expectConsistent(form, first, events.slice(0, 1), ['Server validation']);
    expectConsistent(form, second, events, ['Server validation']);
    expect(second[0] === error).toBe(true);
    ['first', 'second'].forEach(key => {
      const component = form.getComponent(key);
      expect(component.error.component === component.component).toBe(true);
      expect(component.error.components).toBeUndefined();
      expect(component.error.path).toBeUndefined();
      expect(component.error.code).toBe('server');
      expect(component.element.classList.contains('has-error')).toBe(true);
    });
  });

  it('normalizes array-valued rows/value lookups before setting inline validity', async () => {
    const wrapper = await TestForm.create(
      { components: [{ type: 'datagrid', input: true, key: 'rows', components: [field('value')] }] },
      {},
      { rows: [{ value: 'one' }, { value: 'two' }] }
    );
    const form = wrapper.getForm();
    const rowFields = form.getComponent('rows').rows.map(row => row.value);
    const path = Object.freeze(['rows', 'value']);
    const error = Object.freeze({ message: 'Invalid row value', path, code: 'row-validation' });
    const events = observeErrors(form);
    expect(form.getComponent(path)).toHaveLength(2);

    expectConsistent(form, form.showErrors(error, true), events, ['Invalid row value']);
    expectConsistent(form, form.onSubmissionError({ ...error, path: [...path] }), events, ['Invalid row value']);
    rowFields.forEach(component => {
      expect(component.error.message).toBe('Invalid row value');
      expect(component.error.code).toBe('row-validation');
      expect(component.element.classList.contains('has-error')).toBe(true);
    });
    expect(path).toEqual(['rows', 'value']);

    expect(rowFields[0].checkValidity(form.submission.data, true)).toBe(true);
    const remaining = form.showErrors(undefined, true);
    expectConsistent(form, remaining, events, ['Invalid row value']);
    expect(rowFields[0].error).toBeFalsy();
    expect(remaining[0].component === rowFields[1].component).toBe(true);
    expect(remaining[0].path).toBeUndefined();
  });

  it('does not resurrect an independently validated field from a surviving multi-target inline error', async () => {
    const form = (await TestForm.create(plain)).getForm();
    // Optional empty fields skip validation in the platform Base override. Nonempty values make
    // this an actual independent validation/clear rather than that intentional short circuit.
    form.setValue({ data: { first: 'valid', second: 'valid' } });
    const error = Object.freeze({
      message: 'Server validation',
      components: Object.freeze(['first', 'second']),
      component: 'first',
      path: 'second',
      code: 'server',
      context: { rule: 'cross-field' }
    });
    const events = observeErrors(form);
    expectConsistent(form, form.showErrors(error, true), events, ['Server validation']);
    const first = form.getComponent('first');
    const second = form.getComponent('second');

    expect(first.checkValidity(form.submission.data, true)).toBe(true);
    expect(first.error).toBeFalsy();
    expect(second.error).toBeTruthy();
    const remaining = form.showErrors(undefined, true);

    expect(first.error).toBeFalsy();
    expect(first.element.classList.contains('has-error')).toBe(false);
    expectConsistent(form, remaining, events, ['Server validation']);
    expect(remaining[0]).toMatchObject({ component: second.component, code: 'server', context: { rule: 'cross-field' } });
    expect(remaining[0].components).toBeUndefined();
    expect(remaining[0].path).toBeUndefined();
    expect(second.error.code).toBe('server');
    expect(error.components).toEqual(['first', 'second']);

    // A genuinely new delivery may invalidate both again; a collected inline snapshot may not.
    expectConsistent(form, form.showErrors({ ...error, components: [...error.components] }, true), events, ['Server validation']);
    expect(first.error.message).toBe('Server validation');
    expect(second.error.message).toBe('Server validation');
    first.checkValidity(form.submission.data, true);
    second.checkValidity(form.submission.data, true);
    expect(form.showErrors()).toEqual([]);
    expect(summaryItems(form)).toEqual([]);
  });

  it('keeps a partially resolved multi-target summary whole but bound only to its remaining owners', async () => {
    const form = (await TestForm.create({ components: [field('first'), field('second'), field('third')] })).getForm();
    form.setValue({ data: { first: 'valid', second: 'valid', third: 'valid' } });
    const bindings = Object.freeze(['first', 'second', 'third']);
    const error = Object.freeze({ message: 'Server validation', components: bindings, code: 'server' });
    const events = observeErrors(form);
    const first = form.getComponent('first');
    const second = form.getComponent('second');
    const third = form.getComponent('third');
    expectConsistent(form, form.showErrors(error, true), events, ['Server validation']);

    first.checkValidity(form.submission.data, true);
    const remaining = form.showErrors({ message: 'Server validation' }, true);

    expectConsistent(form, remaining, events, ['Server validation']);
    expect(first.error).toBeFalsy();
    expect(remaining[0].component).toBeUndefined();
    expect(remaining[0].components).toHaveLength(2);
    expect(remaining[0].components[0] === second.component).toBe(true);
    expect(remaining[0].components[1] === third.component).toBe(true);
    expect(remaining[0].code).toBe('server');
    expect(error.components).toEqual(['first', 'second', 'third']);

    second.checkValidity(form.submission.data, true);
    expect(form.showErrors()[0].component === third.component).toBe(true);
    third.checkValidity(form.submission.data, true);
    expect(form.showErrors()).toEqual([]);
    expect(summaryItems(form)).toEqual([]);
  });

  it('keeps the rich bound version even when the unbound version arrives first', async () => {
    const form = (await TestForm.create(plain)).getForm();
    const bound = { message: 'Same message', path: 'first', code: 'server', context: { rule: 'unique' } };
    form.customErrors = [bound, { ...bound, context: { rule: 'unique' } }];
    const events = observeErrors(form);

    const errors = form.showErrors({ message: 'Same message' }, true);

    expectConsistent(form, errors, events, ['Same message']);
    expect(errors[0] === bound).toBe(true);
    expect(form.getComponent('first').error === bound).toBe(true);
    expectConsistent(form, form.onSubmissionError({ ...bound, context: { rule: 'unique' } }), events, ['Same message']);
  });

  it('does not collapse bound errors with different metadata or different paths', async () => {
    const form = (await TestForm.create(plain)).getForm();
    const errors = [
      { message: 'Same message', path: 'first', code: 'one' },
      { message: 'Same message', path: 'first', code: 'two' },
      { message: 'Same message', path: 'second', code: 'one' }
    ];
    const events = observeErrors(form);

    expectConsistent(form, form.showErrors(errors, true), events, ['Same message', 'Same message', 'Same message']);
  });

  it('keeps repeated datagrid keys bound to their distinct row instances', async () => {
    const wrapper = await TestForm.create(
      {
        components: [{ type: 'datagrid', input: true, key: 'rows', components: [field('value', { validate: { required: true } })] }]
      },
      {},
      { rows: [{ value: '' }, { value: '' }] }
    );
    const form = wrapper.getForm();
    const rowFields = form.getComponent('rows').rows.map(row => row.value);
    expect(rowFields).toHaveLength(2);
    rowFields.forEach(component => component.setCustomValidity('Row value is required', true));
    const originals = rowFields.map(component => component.error);
    expect(originals.every(Boolean)).toBe(true);
    const events = observeErrors(form);

    const errors = form.showErrors({ message: originals[0].message }, true);

    expectConsistent(form, errors, events, [originals[0].message, originals[1].message]);
    rowFields.forEach((component, index) => {
      expect(component.error === originals[index]).toBe(true);
      expect(component.element.classList.contains('has-error')).toBe(true);
    });
  });

  it('does not copy an existing inline error to another instance that shares its schema', async () => {
    const wrapper = await TestForm.create(
      {
        components: [{ type: 'datagrid', input: true, key: 'rows', components: [field('value')] }]
      },
      {},
      { rows: [{ value: 'one' }, { value: 'two' }] }
    );
    const form = wrapper.getForm();
    const rowFields = form.getComponent('rows').rows.map(row => row.value);
    // Error binding cannot use a schema's key to distinguish instances, even if a caller shares
    // the very same schema object. Existing component.error identity still identifies each row.
    rowFields[1].component = rowFields[0].component;
    rowFields[0].setCustomValidity('First row error', true);
    rowFields[1].setCustomValidity('Second row error', true);
    const originals = rowFields.map(component => component.error);
    const events = observeErrors(form);

    expectConsistent(form, form.showErrors(undefined, true), events, ['First row error', 'Second row error']);
    rowFields.forEach((component, index) => expect(component.error === originals[index]).toBe(true));

    rowFields.forEach(component => component.setCustomValidity('Same row error', true));
    expectConsistent(form, form.showErrors(undefined, true), events, ['Same row error', 'Same row error']);
  });

  it('compares exact message text, without whitespace, case or HTML normalization', async () => {
    const form = (await TestForm.create(plain)).getForm();
    const events = observeErrors(form);
    const messages = ['Message', ' Message', 'message', '<b>Message</b>'];
    const errors = form.showErrors([...messages, 'Message'], true);
    expect(errors.map(error => error.message || error)).toEqual(messages);
    expect(events[0] === errors).toBe(true);
    expect(form.element.querySelectorAll('.alert li')).toHaveLength(4);
  });

  it('clears real client validation errors after correction without retaining a reconciliation cache', async () => {
    const wrapper = await TestForm.create({ components: [field('first', { validate: { required: true } })] });
    const form = wrapper.getForm();
    form.setPristine(false);
    expect(form.checkValidity(form.submission.data, true)).toBe(false);
    const clientError = form.getComponent('first').error;
    const events = observeErrors(form);
    expectConsistent(form, form.showErrors({ message: clientError.message }, true), events, [clientError.message]);

    await wrapper.setInputValue('first', 'filled');
    form.checkValidity(form.submission.data, true);
    expect(form.showErrors()).toEqual([]);
    expect(summaryItems(form)).toEqual([]);
    expect(form.getComponent('first').error).toBeFalsy();
    expect(form.getComponent('first').element.classList.contains('has-error')).toBe(false);
  });

  it('preserves triggerEvent and noAlerts clearing behavior', async () => {
    const form = (await TestForm.create(plain, { noAlerts: true })).getForm();
    const events = observeErrors(form);
    const error = { message: 'Server only' };

    expect(form.showErrors([error, error])).toEqual([error]);
    expect(events).toEqual([]);
    const errors = form.showErrors([error, error], true);
    expect(events[0] === errors).toBe(true);
    expect(summaryItems(form)).toEqual([]);
    expect(form.showErrors()).toEqual([]);
    expect(events[1]).toBe(false);
  });

  it('clears errors after correction and permits a successful submission after double-delivered failure', async () => {
    const wrapper = await TestForm.create({
      components: [field('first'), { type: 'button', key: 'submit', action: 'submit', input: true }]
    });
    const form = wrapper.getForm();
    // Let the initial debounced change finish before exercising button locking.
    await new Promise(resolve => setTimeout(resolve, 600));
    form.ecos = { form: {} };
    const events = observeErrors(form);
    let attempts = 0;
    form.on('submit', (submission, resolve, reject) => {
      attempts += 1;
      if (attempts === 1) {
        const clientError = seedError(form, 'first', 'Rejected value', { code: 'server' });
        form.showErrors({ message: clientError.message }, true);
        reject({ message: clientError.message });
      } else {
        resolve(submission);
      }
    });

    await expect(form.executeSubmit()).rejects.toHaveLength(1);
    expect(events).toHaveLength(2);
    events.forEach(errors => expect(errors).toHaveLength(1));
    expect(form.submitting).toBe(false);
    expect(form.loading).toBe(false);
    expect(form.wrapper.querySelector('.loader-wrapper')).toBeNull();
    expect(form.getComponent('submit').buttonElement.disabled).toBe(false);

    await wrapper.setInputValue('first', 'corrected');
    const component = form.getComponent('first');
    form.onChange({}, { instance: component, component: component.component, value: 'corrected' });
    expect(component.error).toBeFalsy();
    expect(form.showErrors()).toEqual([]);
    expect(summaryItems(form)).toEqual([]);

    await expect(form.executeSubmit()).resolves.toMatchObject({ data: { first: 'corrected' } });
    expect(attempts).toBe(2);
    expect(form.submitting).toBe(false);
    expect(form.getComponent('submit').buttonElement.disabled).toBe(false);
    expect(summaryItems(form)).toEqual([]);
  });
});
