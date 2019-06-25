import Webform from 'formiojs/Webform';

const originalSetElement = Webform.prototype.setElement;

Webform.prototype.setElement = function(element) {
  originalSetElement.call(this, element);

  if (this.options.viewAsHtml && this.options.readOnly) {
    this.addClass(this.wrapper, 'formio-form_view-mode');

    if (this.options.viewAsHtmlConfig.alwaysWrap) {
      this.addClass(this.wrapper, 'formio-form_view-mode-wrap');
    }
  }
};
