import Webform from 'formiojs/Webform';

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
  originalOnSubmit.call(this, submission, saved);
  this.setAlert(false);
};

Webform.prototype.submit = function(before, options) {
  const form = this;

  return new Promise((resolve, reject) => {
    let fireSubmit = finishTime => {
      if (form.changing) {
        if (new Date().getTime() < finishTime) {
          setTimeout(() => {
            fireSubmit(finishTime);
          }, 300);
        } else {
          console.warn('Form will be submitted, but changing flag is still true');
          originalSubmit
            .call(this, before, options)
            .then(resolve)
            .catch(reject);
        }
      } else {
        originalSubmit
          .call(this, before, options)
          .then(resolve)
          .catch(reject);
      }
    };

    fireSubmit(new Date().getTime() + 5000);
  });
};
