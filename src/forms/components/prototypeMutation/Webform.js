import Webform from 'formiojs/Webform';

const originalSetElement = Webform.prototype.setElement;
const originalOnSubmit = Webform.prototype.onSubmit;

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
