import Webform from 'formiojs/Webform';
import cloneDeep from 'lodash/cloneDeep';
import get from 'lodash/get';
import merge from 'lodash/merge';

import { OUTCOME_BUTTONS_PREFIX } from '../constants/forms';
import { getCurrentLocale } from '../helpers/export/util';
import Formio from './Formio';

const originalSetElement = Webform.prototype.setElement;
const originalSubmit = Webform.prototype.submit;
const originalBuild = Webform.prototype.build;
const originalPropertyLoading = Object.getOwnPropertyDescriptor(Webform.prototype, 'loading');
const originalSetLanguage = Object.getOwnPropertyDescriptor(Webform.prototype, 'language');

Webform.prototype.build = function(state) {
  Formio.forms[this.id] = this;

  console.log(Object.keys(Formio.forms));

  return originalBuild.call(this, state);
};

Object.defineProperty(Webform.prototype, 'parentForm', {
  get: function() {
    const parentId = get(this, 'options.parentId');
    const keys = Object.keys(Formio.forms);
    let latestForm = null;

    // keys.pop();

    const prevFormKey = keys.findIndex(i => i === this.id);

    if (prevFormKey !== -1) {
      latestForm = get(Formio, ['forms', keys.slice(prevFormKey - 1, prevFormKey)[0]]);
    }

    // let latestForm = get(Formio, ['forms', keys.pop()]) || null;

    if (latestForm && latestForm.id === this.id) {
      latestForm = null;
    }

    if (!parentId) {
      return latestForm;
    }

    return get(Formio, ['forms', parentId]) || latestForm;
  }
});

Object.defineProperty(Webform.prototype, 'language', {
  set: function(lang) {
    const currentLang = getCurrentLocale();

    if (lang !== currentLang) {
      lang = currentLang;
    }

    originalSetLanguage.set.call(this, lang);
  }
});

Webform.prototype.setElement = function(element) {
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

Webform.prototype.onSubmit = function(submission, saved) {
  this.loading = true;
  this.submitting = false;
  this.setPristine(true);
  this.setValue(submission, {
    noValidate: true,
    noCheck: true
  });

  this.setAlert('success', `<p>${this.t('complete')}</p>`);

  if (!submission.hasOwnProperty('saved')) {
    submission.saved = saved;
  }

  this.emit('submit', submission);

  if (saved) {
    this.emit('submitDone', submission);
    this.loading = false;
    this.attr(this.buttonElement, { disabled: this.disabled });
  }

  this.setAlert(false);

  return submission;
};

Webform.prototype.submit = function(before, options) {
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
      form.setValue(merge(form.submission, { data: outcomeButtonsAttributes }));
      originalSubmit
        .call(form, before, options)
        .then(resolve)
        .catch(reject);
    };

    let fireSubmit = finishTime => {
      if (form.changing) {
        if (new Date().getTime() < finishTime) {
          setTimeout(() => {
            fireSubmit(finishTime);
          }, 300);
        } else {
          console.warn('Form will be submitted, but changing flag is still true');
          callSubmit();
        }
      } else {
        callSubmit();
      }
    };

    fireSubmit(new Date().getTime() + 5000);
  });
};

Object.defineProperty(Webform.prototype, 'loading', {
  set: function(loading) {
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
