import Webform from 'formiojs/Webform';
import cloneDeep from 'lodash/cloneDeep';
import merge from 'lodash/merge';
import { OUTCOME_BUTTONS_PREFIX } from '../../constants/forms';

const originalSetElement = Webform.prototype.setElement;
const originalOnSubmit = Webform.prototype.onSubmit;
const originalSubmit = Webform.prototype.submit;

Webform.prototype.setElement = function(element) {
  originalSetElement.call(this, element);

  if (this.options.viewAsHtml && this.options.readOnly) {
    this.addClass(this.wrapper, 'formio-form_view-mode');

    if (this.options.viewAsHtmlConfig.alwaysWrap) {
      this.addClass(this.wrapper, 'formio-form_view-mode-wrap');
    }
  }
};

Webform.prototype.onSubmit = function(submission, saved) {
  const result = originalOnSubmit.call(this, submission, saved);

  this.setAlert(false);

  return result;
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

export default Webform;
