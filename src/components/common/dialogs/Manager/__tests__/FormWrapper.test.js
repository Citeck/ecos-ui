import { act, render } from '@testing-library/react';
import React from 'react';

import Formio from 'formiojs/Formio';

import FormWrapper from '../FormWrapper';
import { createFakeForm, flush, installCreateForm } from '../formioTestUtils';

jest.mock('formiojs/Formio', () => ({
  __esModule: true,
  default: {
    createForm: jest.fn()
  }
}));

jest.mock('@/helpers/export/util', () => ({
  getCurrentLocale: () => 'en'
}));

jest.mock('@/components/forms/EcosForm/EcosFormUtils', () => ({
  __esModule: true,
  default: {
    getI18n: () => ({}),
    preProcessFormDefinition: definition => definition
  }
}));

const FORM_DEFINITION = { components: [{ type: 'textfield', key: 'title' }] };

const baseProps = () => ({
  isVisible: true,
  formDefinition: FORM_DEFINITION,
  formOptions: { readOnly: true, viewAsHtml: true },
  formData: { title: 'first', status: 'backlog' }
});

describe('<FormWrapper /> update strategy', () => {
  let forms;

  beforeEach(() => {
    forms = installCreateForm(Formio.createForm);
  });

  it('should build the form once on mount and fill it with the initial data', async () => {
    render(<FormWrapper {...baseProps()} />);
    await flush();

    expect(Formio.createForm).toHaveBeenCalledTimes(1);
    expect(forms[0].setValue).toHaveBeenCalledWith({ data: { title: 'first', status: 'backlog' } });
  });

  it('should do nothing when the new props are deeply equal to the previous ones', async () => {
    const { rerender } = render(<FormWrapper {...baseProps()} />);
    await flush();
    forms[0].setValue.mockClear();

    // A new object with the same content — exactly what a redux re-render hands over.
    rerender(<FormWrapper {...baseProps()} />);
    await flush();

    expect(Formio.createForm).toHaveBeenCalledTimes(1);
    expect(forms[0].setValue).not.toHaveBeenCalled();
    expect(forms[0].destroy).not.toHaveBeenCalled();
    expect(forms[0].redraw).not.toHaveBeenCalled();
  });

  it('should update the values in place when only formData has changed', async () => {
    const { rerender } = render(<FormWrapper {...baseProps()} />);
    await flush();
    forms[0].setValue.mockClear();

    rerender(<FormWrapper {...baseProps()} formData={{ title: 'first', status: 'done' }} />);
    await flush();

    expect(Formio.createForm).toHaveBeenCalledTimes(1);
    expect(forms[0].destroy).not.toHaveBeenCalled();
    // Merged over the current form value, and only the changed key is sent.
    expect(forms[0].setValue).toHaveBeenCalledWith({ data: { title: 'first', status: 'done' } }, undefined);
  });

  /**
   * In read-only `viewAsHtml` mode the markup is painted once, so the form has to be repainted
   * explicitly — at form level, because card values are resolved by an `asyncData` component and
   * repainting single components would leave the raw attribute ids on screen.
   */
  it('should repaint the form after an in-place update', async () => {
    const { rerender } = render(<FormWrapper {...baseProps()} />);
    await flush();

    rerender(<FormWrapper {...baseProps()} formData={{ title: 'first', status: 'done' }} />);
    await flush();

    expect(forms[0].redraw).toHaveBeenCalledTimes(1);
  });

  it('should clear a key that has disappeared from formData', async () => {
    const { rerender } = render(<FormWrapper {...baseProps()} />);
    await flush();
    forms[0].setValue.mockClear();

    rerender(<FormWrapper {...baseProps()} formData={{ title: 'first' }} />);
    await flush();

    expect(Formio.createForm).toHaveBeenCalledTimes(1);
    expect(forms[0].setValue.mock.calls[0][0].data).toEqual({ title: 'first', status: undefined });
  });

  it.each([
    ['formDefinition', { formDefinition: { components: [{ type: 'textfield', key: 'other' }] } }],
    ['formOptions', { formOptions: { readOnly: false, viewAsHtml: true } }],
    ['formI18n', { formI18n: { en: { title: 'Title' } } }],
    ['onSubmit identity', { onSubmit: () => undefined }],
    ['onFormChange identity', { onFormChange: () => undefined }]
  ])('should rebuild the form when %s has changed', async (_, changedProps) => {
    const { rerender } = render(<FormWrapper {...baseProps()} />);
    await flush();

    rerender(<FormWrapper {...baseProps()} {...changedProps} />);
    await flush();

    expect(Formio.createForm).toHaveBeenCalledTimes(2);
    expect(forms[0].formReadyReject).toHaveBeenCalled();
  });

  it('should rebuild, not update in place, when formData changes together with a form-constituting prop', async () => {
    const { rerender } = render(<FormWrapper {...baseProps()} />);
    await flush();
    forms[0].setValue.mockClear();

    // A consumer shipping a new definition and its data in one commit must get the new form,
    // not the old definition with fresh values patched in
    rerender(
      <FormWrapper {...baseProps()} formOptions={{ readOnly: false, viewAsHtml: true }} formData={{ title: 'second', status: 'done' }} />
    );
    await flush();

    expect(Formio.createForm).toHaveBeenCalledTimes(2);
    expect(forms[0].formReadyReject).toHaveBeenCalled();
    expect(forms[0].setValue).not.toHaveBeenCalled();
  });

  /**
   * `Formio.createForm` is asynchronous, so a rebuild (or an unmount) can land while the previous
   * build is still in flight. The superseded build was never seen by the user: its form must be
   * destroyed on resolution, not kept as a leak with live listeners — and never handed to
   * `onFormReady`.
   */
  it('should destroy the superseded form when a rebuild starts before the previous build resolved', async () => {
    const { rerender } = render(<FormWrapper {...baseProps()} />);

    // No flush in between: the second build starts while the first createForm is still pending
    rerender(<FormWrapper {...baseProps()} formDefinition={{ components: [{ type: 'textfield', key: 'other' }] }} />);
    await flush();

    expect(Formio.createForm).toHaveBeenCalledTimes(2);
    expect(forms[0].destroy).toHaveBeenCalled();
    expect(forms[1].destroy).not.toHaveBeenCalled();

    // Only the winner serves the in-place updates from now on
    rerender(
      <FormWrapper
        {...baseProps()}
        formDefinition={{ components: [{ type: 'textfield', key: 'other' }] }}
        formData={{ title: 'first', status: 'done' }}
      />
    );
    await flush();

    expect(forms[0].setValue).not.toHaveBeenCalled();
    expect(forms[1].setValue).toHaveBeenCalledWith({ data: { title: 'first', status: 'done' } }, undefined);
  });

  it('should destroy the form of a build that resolves after unmount and not report it ready', async () => {
    const onFormReady = jest.fn();
    const { unmount } = render(<FormWrapper {...baseProps()} onFormReady={onFormReady} />);

    unmount();
    await flush();

    expect(forms[0].destroy).toHaveBeenCalled();
    expect(onFormReady).not.toHaveBeenCalled();
  });

  it('should rebuild the form when the visibility is toggled back on', async () => {
    const { rerender } = render(<FormWrapper {...baseProps()} />);
    await flush();

    rerender(<FormWrapper {...baseProps()} isVisible={false} />);
    await flush();
    expect(Formio.createForm).toHaveBeenCalledTimes(1);

    rerender(<FormWrapper {...baseProps()} isVisible />);
    await flush();
    expect(Formio.createForm).toHaveBeenCalledTimes(2);
  });

  /**
   * ModelEditor persists the data of the element being left (an element rename included) from
   * `onBeforeFormDestroy`, and that callback is only ever reached through a rebuild. A consumer
   * that passes it must therefore keep getting the rebuild even for a data-only change.
   */
  describe('onBeforeFormDestroy consumers', () => {
    it('should rebuild the form on a data-only change and hand over the pre-update value', async () => {
      const onBeforeFormDestroy = jest.fn();
      const { rerender } = render(<FormWrapper {...baseProps()} onBeforeFormDestroy={onBeforeFormDestroy} />);
      await flush();

      rerender(<FormWrapper {...baseProps()} formData={{ title: 'first', status: 'done' }} onBeforeFormDestroy={onBeforeFormDestroy} />);
      await flush();

      expect(Formio.createForm).toHaveBeenCalledTimes(2);
      expect(onBeforeFormDestroy).toHaveBeenCalledTimes(1);
      expect(onBeforeFormDestroy).toHaveBeenCalledWith({ data: { title: 'first', status: 'backlog' } });
      expect(forms[0].redraw).not.toHaveBeenCalled();
    });
  });

  it('should not start a second build while the first one is still in flight', async () => {
    let resolveForm;
    const form = createFakeForm();

    Formio.createForm.mockImplementation(() => new Promise(resolve => (resolveForm = () => resolve(form))));

    const { rerender } = render(<FormWrapper {...baseProps()} />);

    // The data settled by the server arrives before `createForm` has resolved.
    rerender(<FormWrapper {...baseProps()} formData={{ title: 'first', status: 'done' }} />);

    expect(Formio.createForm).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveForm();
    });

    expect(Formio.createForm).toHaveBeenCalledTimes(1);
    // The pending build reads the props when it resolves, so it picks the fresh values up itself.
    expect(form.setValue).toHaveBeenCalledWith({ data: { title: 'first', status: 'done' } });
  });
});
