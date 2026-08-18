import { act } from '@testing-library/react';

/**
 * Shared scaffolding for suites that assert on FormWrapper's build strategy (FormWrapper.test.js,
 * Kanban's Card.test.js). Lives outside `__tests__/` on purpose: jest's testMatch treats every file
 * in there as a suite. The `jest.mock('formiojs/Formio', ...)` calls themselves stay in each test
 * file — babel-jest hoists them and they cannot come from a helper.
 */

/**
 * Minimal stand-in for a built formio form: enough of the API for FormWrapper, plus the call
 * counters the assertions are made of.
 */
export function createFakeForm() {
  const form = {
    value: { data: {} },
    getValue: jest.fn(() => form.value),
    setValue: jest.fn(value => {
      form.value = value;
    }),
    formReady: Promise.resolve(),
    formReadyReject: jest.fn(),
    destroy: jest.fn(),
    redraw: jest.fn(),
    on: jest.fn()
  };

  return form;
}

/**
 * Points the mocked `Formio.createForm` at a fresh fake per call and returns the collector array —
 * `forms[i]` is the form the (i+1)-th build resolved to. Call from `beforeEach`.
 */
export function installCreateForm(createFormMock) {
  const forms = [];

  createFormMock.mockReset();
  createFormMock.mockImplementation(() => {
    const form = createFakeForm();
    forms.push(form);
    return Promise.resolve(form);
  });

  return forms;
}

/** Lets the `Formio.createForm` promise (and the `formReady` one behind it) settle. */
export const flush = () => act(async () => undefined);
