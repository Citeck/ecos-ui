import { render } from '@testing-library/react';
import React from 'react';


/**
 * PropertiesDashlet is a complex connected component with many dependencies.
 * Instead of rendering the full component tree, we test the key behaviors
 * in isolation by invoking prototype methods on mock instances and by
 * rendering the action button configs directly.
 */

describe('PropertiesDashlet', () => {
  describe('submitForm', () => {
    const PropertiesDashlet = require('../PropertiesDashlet').default;

    function createSubmitDashlet({ valid = true } = {}) {
      const instance = new PropertiesDashlet({ record: 'app/rec@1', id: 'w1', config: {}, tabId: 't1' });

      instance.setState = jest.fn((state, cb) => {
        Object.assign(instance.state, typeof state === 'function' ? state(instance.state) : state);
        if (cb) cb();
      });

      const submitForm = jest.fn();
      submitForm.cancel = jest.fn();
      const components = [{ updateValue: jest.fn() }, { updateValue: jest.fn() }];
      const form = { data: {}, checkValidity: jest.fn(() => valid), getAllComponents: () => components };
      const baseForm = { base: true };

      instance._propertiesRef = {
        current: {
          _ecosForm: { current: { submitForm, _form: form } },
          _hiddenEcosForm: { current: { _form: baseForm } }
        }
      };

      return { instance, submitForm, components, form, baseForm };
    }

    it('flushes every component value and submits through the hidden base form', () => {
      const { instance, submitForm, components, form, baseForm } = createSubmitDashlet();

      instance.submitForm(false);

      components.forEach(c => expect(c.updateValue).toHaveBeenCalledWith({ changeByUser: true, noUpdateEvent: true }));
      expect(submitForm.cancel).toHaveBeenCalled();
      expect(submitForm).toHaveBeenCalledWith(baseForm, form, true);
      expect(instance.state.isSaving).toBe(true);
      expect(instance.state.wasLastModifiedWithFormSubmit).toBe(true);
    });

    it('does not submit when the form is invalid and it is not a draft', () => {
      const { instance, submitForm } = createSubmitDashlet({ valid: false });

      instance.submitForm(false);

      expect(submitForm).not.toHaveBeenCalled();
      expect(instance.state.formIsValid).toBe(false);
    });

    it('submits a draft even when the form is invalid', () => {
      const { instance, submitForm } = createSubmitDashlet({ valid: false });

      instance.submitForm(true);

      expect(submitForm).toHaveBeenCalled();
    });
  });

  describe('dashletActions — the submit button while saving', () => {
    const PropertiesDashlet = require('../PropertiesDashlet').default;

    function createEditDashlet(stateOverrides) {
      const instance = new PropertiesDashlet({ record: 'app/rec@1', id: 'w1', config: { formMode: 'EDIT' }, tabId: 't1' });

      Object.assign(instance.state, {
        canEditRecord: true,
        formIsChanged: true,
        formIsValid: true,
        isDraft: false,
        isSaving: false,
        ...stateOverrides
      });

      const actions = instance.dashletActions;
      const submitAction = Object.values(actions).find(action => action.component);

      return { instance, submitAction };
    }

    it('renders the loader inside the button and disables it while saving', () => {
      const { submitAction } = createEditDashlet({ isSaving: true });

      expect(submitAction).toBeDefined();
      expect(submitAction.className).toContain('btn_disabled');

      const { container } = render(submitAction.component);
      expect(container.querySelector('.ecos-points-loader')).toBeInTheDocument();
    });

    it('renders the label and stays enabled when idle and valid', () => {
      const { submitAction } = createEditDashlet({ isSaving: false });

      expect(submitAction.className).not.toContain('btn_disabled');

      const { container } = render(submitAction.component);
      expect(container.querySelector('.ecos-points-loader')).not.toBeInTheDocument();
      expect(container.querySelector('button').textContent).not.toBe('');
    });
  });

  describe('handleUpdate routing (COREDEV-429)', () => {
    const PropertiesDashlet = require('../PropertiesDashlet').default;

    function createInstance(stateOverrides = {}) {
      const instance = Object.create(PropertiesDashlet.prototype);

      Object.assign(instance, {
        state: {
          wasLastModifiedWithInlineEditor: false,
          wasLastModifiedWithFormSubmit: false,
          ...stateOverrides
        },
        setState: jest.fn((state, cb) => {
          Object.assign(instance.state, typeof state === 'function' ? state(instance.state) : state);
          if (cb) cb();
        }),
        checkPermissions: jest.fn(),
        softReloadDashlet: jest.fn(),
        _propertiesRef: { current: null }
      });

      return instance;
    }

    it('routes a background update through the soft path', () => {
      const instance = createInstance();

      instance.handleUpdate();

      expect(instance.softReloadDashlet).toHaveBeenCalledTimes(1);
    });

    it('consumes the own-change flags without reloading anything', () => {
      const instance = createInstance({ wasLastModifiedWithInlineEditor: true });

      instance.handleUpdate();

      expect(instance.softReloadDashlet).not.toHaveBeenCalled();
      expect(instance.checkPermissions).toHaveBeenCalledTimes(1);
      expect(instance.state.wasLastModifiedWithInlineEditor).toBe(false);
    });

    it('the edit-modal submit goes through the soft path, not the full reload', () => {
      // A real instance: class-field methods (onPropertiesEditFormSubmit, softReloadDashlet)
      // only exist after the constructor runs — the prototype does not have them.
      const instance = new PropertiesDashlet({ record: 'app/rec@1', id: 'w1', config: {}, tabId: 't1' });

      instance.setState = jest.fn((state, cb) => {
        Object.assign(instance.state, typeof state === 'function' ? state(instance.state) : state);
        if (cb) cb();
      });
      instance.softReloadDashlet = jest.fn();
      instance.onReloadDashlet = jest.fn();

      instance.onPropertiesEditFormSubmit();

      expect(instance.state.isEditProps).toBe(false);
      expect(instance.softReloadDashlet).toHaveBeenCalledTimes(1);
      expect(instance.onReloadDashlet).not.toHaveBeenCalled();
    });
  });

  describe('softReloadDashlet (COREDEV-429)', () => {
    const PropertiesDashlet = require('../PropertiesDashlet').default;

    const flushMicrotasks = async (turns = 10) => {
      for (let i = 0; i < turns; i++) {
        await Promise.resolve();
      }
    };

    function createDashlet({ softUpdate = jest.fn().mockResolvedValue({ changed: false, rebuilt: false }), hasForm = true } = {}) {
      const instance = new PropertiesDashlet({ record: 'app/rec@1', id: 'w1', config: {}, tabId: 't1' });

      instance._isMounted = true;
      instance.setState = jest.fn((state, cb) => {
        Object.assign(instance.state, typeof state === 'function' ? state(instance.state) : state);
        if (cb) cb();
      });
      instance.checkPermissions = jest.fn();
      instance.onReloadDashlet = jest.fn();
      instance._propertiesRef = { current: { softUpdateForm: softUpdate, form: hasForm ? {} : null } };

      return { instance, softUpdate };
    }

    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it('falls back to the full reload when there is no form yet', () => {
      const { instance, softUpdate } = createDashlet({ hasForm: false });

      instance.softReloadDashlet();

      expect(instance.onReloadDashlet).toHaveBeenCalledWith(false);
      expect(softUpdate).not.toHaveBeenCalled();
    });

    it('spins for at least the minimum time, then clears the spinner and the in-flight flag', async () => {
      const { instance, softUpdate } = createDashlet();

      instance.softReloadDashlet();

      expect(instance.state.isRefreshing).toBe(true);
      expect(softUpdate).toHaveBeenCalledTimes(1);

      // the read resolved instantly, but the minimum spin has not elapsed
      await flushMicrotasks();
      expect(instance.state.isRefreshing).toBe(true);

      jest.advanceTimersByTime(500);
      await flushMicrotasks();

      expect(instance.state.isRefreshing).toBe(false);
      expect(instance._softReloadInFlight).toBe(false);
    });

    it('coalesces a request arriving mid-run into one trailing pass', async () => {
      const { instance, softUpdate } = createDashlet();

      instance.softReloadDashlet();
      instance.softReloadDashlet(); // e.g. the edit-modal submit during a background tick

      expect(softUpdate).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(500);
      await flushMicrotasks();

      // the dropped request ran as one trailing pass
      expect(softUpdate).toHaveBeenCalledTimes(2);
    });

    it('releases the in-flight flag when the re-read rejects', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      const { instance } = createDashlet({ softUpdate: jest.fn().mockRejectedValue(new Error('boom')) });

      instance.softReloadDashlet();
      jest.advanceTimersByTime(500);
      await flushMicrotasks();

      expect(instance._softReloadInFlight).toBe(false);
      expect(instance.state.isRefreshing).toBe(false);

      consoleError.mockRestore();
    });
  });
});
