import Webform from 'formiojs/Webform';
import cloneDeep from 'lodash/cloneDeep';
import get from 'lodash/get';
import merge from 'lodash/merge';

import { OUTCOME_BUTTONS_PREFIX, SUBMIT_FORM_TIMEOUT } from '../constants/forms';
import { getCurrentLocale } from '../helpers/export/util';

import Formio from './Formio';
import { findUploadDocsService } from './utils';

const originalSetElement = Webform.prototype.setElement;
const originalSubmit = Webform.prototype.submit;
const originalSubmitForm = Webform.prototype.submitForm;
const originalBuild = Webform.prototype.build;
const originalPropertyLoading = Object.getOwnPropertyDescriptor(Webform.prototype, 'loading');
const originalSetLanguage = Object.getOwnPropertyDescriptor(Webform.prototype, 'language');

Webform.prototype.submitForm = function (options) {
  this.submitActionDone = true;
  const result = originalSubmitForm.call(this, options);

  this.withoutLoader = get(options, 'withoutLoader');

  return result;
};

Webform.prototype.build = function (state) {
  Formio.forms[this.id] = this;

  return originalBuild.call(this, state);
};

Object.defineProperty(Webform.prototype, 'parentForm', {
  get: function () {
    const parentId = get(this, 'options.parentId');
    const keys = Object.keys(Formio.forms);
    const prevFormKey = keys.findIndex(i => i === this.id);
    let penultimateForm = null;

    if (prevFormKey !== -1) {
      penultimateForm = get(Formio, ['forms', keys.slice(prevFormKey - 1, prevFormKey)[0]]) || null;
    }

    if (penultimateForm && penultimateForm.id === this.id) {
      penultimateForm = null;
    }

    return parentId ? get(Formio, ['forms', parentId]) : penultimateForm;
  }
});

Object.defineProperty(Webform.prototype, 'language', {
  set: function (lang) {
    const currentLang = getCurrentLocale();

    if (lang !== currentLang) {
      lang = currentLang;
    }

    originalSetLanguage.set.call(this, lang);
  }
});

Object.defineProperty(Webform.prototype, 'withoutLoader', {
  set: function (withoutLoader) {
    this.__withoutLoader = withoutLoader;
  },

  get: function () {
    return this.__withoutLoader;
  }
});

Object.defineProperty(Webform.prototype, 'previSubmitTime', {
  set: function (time = 0) {
    this.__previSubmitTime = time;
  },

  get: function () {
    return this.__previSubmitTime || Date.now();
  }
});

Webform.prototype.setElement = function (element) {
  originalSetElement.call(this, element);

  const { viewAsHtml, readOnly, viewAsHtmlConfig, theme } = this.options;

  if (viewAsHtml && readOnly) {
    this.addClass(this.wrapper, 'formio-form_view-mode');

    if (viewAsHtmlConfig.alwaysWrap) {
      this.addClass(this.wrapper, 'formio-form_view-mode-wrap');
    }
  }

  if (theme) {
    this.addClass(this.wrapper, `formio-form_theme_${theme}`);
  }
};

Webform.prototype.setAlert = function (type, message) {
  if (this.options.noAlerts) {
    if (!message) {
      this.emit('error', false);
    }
    return;
  }

  const alertElements = this.element.querySelectorAll('div.alert.alert-danger');
  const foundAlertElement = Array.from(alertElements).find(el => el.innerHTML === message);

  if (message && foundAlertElement) {
    return;
  }

  if (this.alert) {
    try {
      this.removeChild(this.alert);
      this.alert = null;
    } catch (err) {
      // ignore
    }
  }

  if (message) {
    this.alert = this.ce('div', {
      class: `alert alert-${type}`,
      role: 'alert'
    });
    this.alert.innerHTML = message;
  }
  if (!this.alert) {
    return;
  }
  this.prepend(this.alert);
};

Webform.prototype.onSubmit = function (submission, saved) {
  this.submitActionDone = true;
  this.submitting = false;
  this.setPristine(true);
  this.setValue(submission, {
    noValidate: true,
    noCheck: true
  });

  if (!submission.hasOwnProperty('saved')) {
    submission.saved = saved;
  }

  if (!get(this, 'ecos.form')) {
    this.emit('submit', submission);

    if (saved) {
      this.emit('submitDone', submission);
      this.attr(this.buttonElement, { disabled: this.disabled });
    }

    this.setAlert(false);
    return submission;
  }

  const DOCS_ATT = 'att_add_docs:documents';
  const UploadDocsService = findUploadDocsService.call(this);

  if (UploadDocsService && !submission.data?.hasOwnProperty(DOCS_ATT) && UploadDocsService.getUploadedEntityRefs()?.length > 0) {
    const docsRefs = UploadDocsService.getUploadDocsRefsOfAttrs(submission.data);

    if (docsRefs.length > 0) {
      submission.data = {
        ...submission.data,
        [DOCS_ATT]: docsRefs
      };
    }
  }

  return new Promise((resolve, reject) => {
    this.emit('submit', submission, resolve, reject);

    return submission;
  }).finally(() => {
    if (saved) {
      this.emit('submitDone', submission);
      this.attr(this.buttonElement, { disabled: this.disabled });
    }
  });
};

Webform.prototype.ecosButtonSubmit = function () {
  return this.submit(false, { state: get(this, 'component.state') || 'submitted' }, true);
};

Webform.prototype.submit = function (before, options, forceChanging) {
  const form = this;
  const originalSubmission = cloneDeep(this.submission || {});
  const originalSubmissionData = originalSubmission.data || {};

  const outcomeButtonsAttributes = {}; // Cause: https://citeck.atlassian.net/browse/ECOSCOM-3079
  for (let [key, value] of Object.entries(originalSubmissionData)) {
    if (!key.startsWith(OUTCOME_BUTTONS_PREFIX)) {
      continue;
    }

    const component = form.getComponent(key);
    if (!component || component.type !== 'button') {
      continue;
    }

    outcomeButtonsAttributes[key] = value;
  }

  return new Promise((resolve, reject) => {
    const callSubmit = () => {
      form.previSubmitTime = new Date().getTime();

      for (let [key] of Object.entries(originalSubmissionData)) {
        const component = form.getComponent(key);
        if (get(component, 'type') === 'datagrid') {
          form.submission = {
            ...form.submission,
            data: {
              ...get(form.submission, 'data', {}),
              [key]: component.getNotEmptyValue()
            }
          };
        }
      }

      form.setValue(merge(form.submission, { data: outcomeButtonsAttributes }));
      originalSubmit.call(form, before, options).then(resolve).catch(reject);
    };

    let fireSubmit = finishTime => {
      if (form.changing && !forceChanging) {
        if (new Date().getTime() < finishTime) {
          setTimeout(() => {
            fireSubmit(finishTime);
          }, 300);
        } else {
          console.warn('Form will be submitted, but changing flag is still true');
          callSubmit();
        }
      } else {
        const diff = Date.now() - form.previSubmitTime;
        const timeout = diff === 0 || diff > SUBMIT_FORM_TIMEOUT ? 0 : SUBMIT_FORM_TIMEOUT - Math.floor(diff / 1000) * 1000;

        window.setTimeout(() => {
          callSubmit();
        }, timeout);
      }
    };

    fireSubmit(new Date().getTime() + 5000);
  });
};

Object.defineProperty(Webform.prototype, 'loading', {
  set: function (loading) {
    originalPropertyLoading.set.call(this, loading);

    if (!loading && this.loader) {
      try {
        this.removeChildFrom(this.loader, this.wrapper);
      } catch (e) {
        // ignore
      }
    }
  }
});

export default Webform;
