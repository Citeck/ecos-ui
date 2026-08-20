import { get } from 'lodash';

import { AWAITED_SUBMIT, handleSubmitResult, isAwaitedSubmit, isThenable } from '../submitUtils';

describe('EcosForm on submition', () => {
  describe('submitDone emit logic', () => {
    /**
     * Replicates the onSubmit callback pattern from EcosForm.submitForm.
     * Tests the branching logic without importing the heavy EcosForm component.
     */
    function simulateOnSubmit({ persistedRecord, form, record, submissionResolve }) {
      if (typeof submissionResolve === 'function') {
        submissionResolve({ persistedRecord, form, record });
      } else {
        form.emit('submitDone');
      }
    }

    function simulateOnError({ form, error, submissionReject }) {
      if (typeof submissionReject === 'function') {
        submissionReject(error);
      } else {
        form.emit('submitDone');
      }
    }

    it('onSubmit should emit submitDone when submissionResolve is not provided', () => {
      const form = { emit: jest.fn() };

      simulateOnSubmit({
        persistedRecord: { id: 'rec' },
        form,
        record: { id: 'rec' },
        submissionResolve: undefined
      });

      expect(form.emit).toHaveBeenCalledTimes(1);
      expect(form.emit).toHaveBeenCalledWith('submitDone');
    });

    it('onSubmit should call submissionResolve when it IS provided', () => {
      const form = { emit: jest.fn() };
      const submissionResolve = jest.fn();

      simulateOnSubmit({
        persistedRecord: { id: 'rec' },
        form,
        record: { id: 'rec' },
        submissionResolve
      });

      expect(submissionResolve).toHaveBeenCalledTimes(1);
      expect(form.emit).not.toHaveBeenCalled();
    });

    it('on save error should emit submitDone when submissionReject is not provided', () => {
      const form = { emit: jest.fn() };

      simulateOnError({
        form,
        error: new Error('Save failed'),
        submissionReject: undefined
      });

      expect(form.emit).toHaveBeenCalledTimes(1);
      expect(form.emit).toHaveBeenCalledWith('submitDone');
    });

    it('on save error should call submissionReject when it IS provided', () => {
      const form = { emit: jest.fn() };
      const submissionReject = jest.fn();
      const error = new Error('Save failed');

      simulateOnError({ form, error, submissionReject });

      expect(submissionReject).toHaveBeenCalledTimes(1);
      expect(submissionReject).toHaveBeenCalledWith(error);
      expect(form.emit).not.toHaveBeenCalled();
    });
  });

  describe('saveOnSubmit: false with a promise returning onSubmit', () => {
    /**
     * Wires the EcosFormModal.onSubmit wrapper to the `saveOnSubmit: false` branch of
     * EcosForm.submitForm: both call `handleSubmitResult` exactly as they do in production.
     */
    const createSubmission = consumerOnSubmit => {
      const hide = jest.fn();
      const form = { emit: jest.fn(), showErrors: jest.fn() };
      const record = { id: 'rec@' };
      const state = {
        hide,
        form,
        record,
        consumerOnSubmit,
        releaseAll: jest.fn(),
        toggleLoader: jest.fn(),
        onSubmitDone: jest.fn()
      };

      // EcosFormModal: postpones hide() until the awaited submission succeeds
      const modalOnSubmit = (rec, frm, alias, meta) =>
        isAwaitedSubmit(meta) ? handleSubmitResult(consumerOnSubmit(rec, frm, alias, meta), { onSuccess: () => hide() }) : hide();

      // EcosForm: awaits the result of props.onSubmit and reports a failure in the form
      state.submit = ({ submissionReject } = {}) => {
        state.toggleLoader(true);

        return handleSubmitResult(modalOnSubmit(record, form, undefined, AWAITED_SUBMIT), {
          onSuccess: () => {
            state.releaseAll();
            state.onSubmitDone(record, form);
          },
          onError: e => {
            form.showErrors(e, true);

            if (typeof submissionReject === 'function') {
              submissionReject(e);
            } else {
              form.emit('submitDone');
            }
          },
          onSettled: () => state.toggleLoader(false)
        });
      };

      return state;
    };

    it('should hide the modal only after the resolved promise', async () => {
      let resolveSubmit;
      const consumerOnSubmit = jest.fn(() => new Promise(resolve => (resolveSubmit = resolve)));
      const submission = createSubmission(consumerOnSubmit);

      const awaited = submission.submit();

      expect(consumerOnSubmit).toHaveBeenCalledTimes(1);
      expect(submission.hide).not.toHaveBeenCalled();
      expect(submission.toggleLoader).toHaveBeenLastCalledWith(true);

      resolveSubmit();
      await awaited;

      expect(submission.hide).toHaveBeenCalledTimes(1);
      expect(submission.releaseAll).toHaveBeenCalledTimes(1);
      expect(submission.onSubmitDone).toHaveBeenCalledTimes(1);
      expect(submission.form.showErrors).not.toHaveBeenCalled();
      expect(submission.toggleLoader).toHaveBeenLastCalledWith(false);
    });

    it('should keep the modal open and show errors in the form on a rejected promise', async () => {
      const error = new Error('Mutation failed');
      const submission = createSubmission(jest.fn(() => Promise.reject(error)));

      await submission.submit();

      expect(submission.hide).not.toHaveBeenCalled();
      expect(submission.form.showErrors).toHaveBeenCalledWith(error, true);
      expect(submission.form.emit).toHaveBeenCalledWith('submitDone');
      expect(submission.releaseAll).not.toHaveBeenCalled();
      expect(submission.onSubmitDone).not.toHaveBeenCalled();
      expect(submission.toggleLoader).toHaveBeenLastCalledWith(false);
    });

    it('should call submissionReject instead of submitDone on a rejected promise', async () => {
      const error = new Error('Mutation failed');
      const submission = createSubmission(jest.fn(() => Promise.reject(error)));
      const submissionReject = jest.fn();

      await submission.submit({ submissionReject });

      expect(submissionReject).toHaveBeenCalledWith(error);
      expect(submission.form.emit).not.toHaveBeenCalled();
    });

    it('should stay synchronous when onSubmit returns a non-thenable value', () => {
      const consumerOnSubmit = jest.fn(() => undefined);
      const submission = createSubmission(consumerOnSubmit);

      const awaited = submission.submit();

      expect(isThenable(awaited)).toBe(false);
      expect(submission.hide).toHaveBeenCalledTimes(1);
      expect(submission.releaseAll).toHaveBeenCalledTimes(1);
      expect(submission.onSubmitDone).toHaveBeenCalledTimes(1);
      expect(submission.form.showErrors).not.toHaveBeenCalled();
      expect(submission.toggleLoader).toHaveBeenLastCalledWith(false);
    });
  });

  describe('toggleContainerHeight', () => {
    /**
     * Extracted toggleContainerHeight logic from EcosForm to avoid importing
     * the heavy component with all its dependencies.
     */
    function toggleContainerHeight(instance, toSave) {
      const container = get(instance, '_formContainer.current');

      if (container) {
        if (toSave) {
          container.style.minHeight = `${container.offsetHeight}px`;
          container.style.height = '';
        } else {
          container.style.minHeight = '';
          container.style.height = '';
        }
      }
    }

    it('toggleContainerHeight(true) should set minHeight and clear height', () => {
      const element = {
        offsetHeight: 500,
        style: { minHeight: '', height: 'some-value' }
      };

      toggleContainerHeight({ _formContainer: { current: element } }, true);

      expect(element.style.minHeight).toBe('500px');
      expect(element.style.height).toBe('');
    });

    it('toggleContainerHeight(false) should clear both minHeight and height', () => {
      const element = {
        offsetHeight: 500,
        style: { minHeight: '500px', height: '500px' }
      };

      toggleContainerHeight({ _formContainer: { current: element } }, false);

      expect(element.style.minHeight).toBe('');
      expect(element.style.height).toBe('');
    });

    it('toggleContainerHeight should not throw when container ref is null', () => {
      expect(() => {
        toggleContainerHeight({ _formContainer: { current: null } }, true);
      }).not.toThrow();

      expect(() => {
        toggleContainerHeight({ _formContainer: { current: null } }, false);
      }).not.toThrow();
    });
  });
});
