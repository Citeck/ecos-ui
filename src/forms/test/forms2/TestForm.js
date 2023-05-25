import Webform from '../../Webform';
import { COOKIE_KEY_LOCALE } from '../../../constants/alfresco';
import FormioUtils from 'formiojs/utils';
import _ from 'lodash';

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
