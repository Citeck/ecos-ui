import { COOKIE_KEY_LOCALE } from '@citeck/constants/alfresco';
import FormioUtils from 'formiojs/utils';
import _ from 'lodash';

import EventEmitter from '../../EventEmitter';
import Webform from '../../Webform';

import '../harness';
import '../APIMock';

export const TestForm = {
  /**
   * @returns {Promise<TestFormWrapper>}
   */
  create: async (definition, options = {}, data = null) => {
    document.cookie = `${COOKIE_KEY_LOCALE}=en`;
    const formElement = document.createElement('div');
    const form = new Webform(formElement, {
      language: 'en',
      // The app's forms get this emitter budget (EcosForm: loadLimit 200). formio's default of 50
      // counts a whole multi-step test as one burst — the guard only resets after 300 ms of silence
      // and harness steps are ~200 ms apart — then drops every event for 500 ms, including the
      // `change` a step awaits: allowCalculateOverride part4 timed out in CI that way.
      events: new EventEmitter({ wildcard: false, maxListeners: 0, loadLimit: 200 }),
      ...options
    });
    return form.setForm(definition).then(() => {
      const wrapper = new TestFormWrapper(form);
      if (!!data) {
        return wrapper.setFormData(data).then(() => wrapper);
      } else {
        return wrapper;
      }
    });
  }
};

class TestFormWrapper {
  constructor(form) {
    this._form = form;
  }

  getForm() {
    return this._form;
  }

  getFormData() {
    return _.cloneDeep(this._form.getValue().data);
  }

  __doAndWaitOnFormChange(action) {
    return new Promise(resolve => {
      const onChange = () => {
        this._form.off('change', onChange);
        resolve();
      };
      this._form.on('change', onChange);
      action();
    });
  }

  async setFormData(data) {
    return this.__doAndWaitOnFormChange(() => {
      this._form.setValue({ data });
    });
  }

  async setInputValue(key, value, flags) {
    const component = FormioUtils.getComponent(this._form.components, key, false);
    return this.__doAndWaitOnFormChange(() => {
      component.setValue(value, flags);
    });
  }
}
