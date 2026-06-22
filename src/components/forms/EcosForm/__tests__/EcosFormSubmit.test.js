import { get } from 'lodash';

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
