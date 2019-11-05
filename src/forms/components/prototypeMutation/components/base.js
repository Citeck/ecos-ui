import Base from 'formiojs/components/base/Base';

const originalCreateTooltip = Base.prototype.createTooltip;

Base.prototype.createTooltip = function(container, component, classes) {
  originalCreateTooltip.call(this, container, component, classes);

  if (this.tooltip) {
    this.tooltip.updateTitleContent(this.t(this.tooltip.options.title));
  }
};

// Cause: https://citeck.atlassian.net/browse/ECOSCOM-2661
Base.prototype.addInputError = function(message, dirty) {
  if (!message) {
    return;
  }

  if (this.errorElement) {
    const errorMessage = this.ce('p', {
      class: 'help-block'
    });
    errorMessage.innerHTML = this.t(message);
    this.errorElement.appendChild(errorMessage);
  }

  // Add error classes
  this.addClass(this.element, 'has-error');
  this.inputs.forEach(input => this.addClass(this.performInputMapping(input), 'is-invalid'));
  if (dirty && this.options.highlightErrors) {
    this.addClass(this.element, 'alert alert-danger');
  }
};
