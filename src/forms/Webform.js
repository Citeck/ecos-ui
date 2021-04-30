import Webform from 'formiojs/Webform';
import cloneDeep from 'lodash/cloneDeep';
import merge from 'lodash/merge';

import { OUTCOME_BUTTONS_PREFIX } from '../constants/forms';

const originalSetElement = Webform.prototype.setElement;
const originalOnSubmit = Webform.prototype.onSubmit;
const originalSubmit = Webform.prototype.submit;
const originalOnSubmissionError = Webform.prototype.onSubmissionError;
const originalSetAlert = Webform.prototype.showErrors;
const originalcheckData = Webform.prototype.checkData;
const originalsubmitUrl = Webform.prototype.submitUrl;

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
  console.warn('onSubmit');
  this.loading = true;
  // const result = originalOnSubmit.call(this, submission, saved);
  this.submitting = false;
  this.setPristine(true);
  this.setValue(submission, {
    noValidate: true,
    noCheck: true
  });

  this.setAlert('success', `<p>${this.t('complete')}</p>`);

  if (!submission.hasOwnProperty('saved')) {
    console.warn("!submission.hasOwnProperty('saved')");
    submission.saved = saved;
  }

  this.emit('submit', submission);

  if (saved) {
    this.emit('submitDone', submission);
    this.loading = false;
  }

  this.setAlert(false);

  console.warn({ submission });

  // if (!submission.saved) {
  //   this.loading = false;
  // }

  return submission;
  // return result;
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

Webform.prototype.executeSubmit = function(options = {}) {
  this.submitted = true;
  this.submitting = true;

  return this.submitForm(options)
    .then(({ submission, saved }) => this.onSubmit(submission, saved))
    .catch(err => {
      console.warn('reject => ', { err });

      return Promise.reject(this.onSubmissionError(err));
    });
};

Webform.prototype.onSubmissionError = function(error) {
  console.warn('onSubmissionError');
  // this.loading = false;
  return originalOnSubmissionError.call(this, error);
};

Webform.prototype.checkData = function(data, flags, source) {
  console.warn('checkData => ', { data, flags, source });
  // this.loading = false;
  return originalcheckData.call(this, data, flags, source);
};

Webform.prototype.submitUrl = function(URL, headers) {
  console.warn('submitUrl => ', { URL, headers });
  // this.loading = false;
  return originalsubmitUrl.call(this, URL, headers);
};

Webform.prototype.showErrors = function(error, triggerEvent) {
  const errors = originalSetAlert.call(this, error, triggerEvent);

  console.warn('showErrors => ', { error, errors, triggerEvent });

  if (error) {
    window.setTimeout(() => {
      this.loading = false;
    }, 0);
  }

  // this.loading = false;
  return errors;
};

export default Webform;
