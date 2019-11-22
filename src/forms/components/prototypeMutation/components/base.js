import Base from 'formiojs/components/base/Base';

const originalCreateTooltip = Base.prototype.createTooltip;
const originalCreateViewOnlyValue = Base.prototype.createViewOnlyValue;
const originalBuild = Base.prototype.build;
const originalCreateViewOnlyElement = Base.prototype.createViewOnlyElement;

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

Base.prototype.createInlineEditButton = function(container) {
  const editElement = this.ce(
    'span',
    {
      className: 'edit'
    },
    'Edit'
  );

  // TODO unsubscribe
  editElement.addEventListener('click', () => {
    console.log('this', this);
    this.options.readOnly = false;
    this.options.viewAsHtml = false;
    this.options.inlineEditing = true;
    this.redraw();
    container.classList.add('inline-editing');
  });

  container.appendChild(editElement);
};

Base.prototype.createViewOnlyValue = function(container) {
  originalCreateViewOnlyValue.call(this, container);

  this.createInlineEditButton(container);
};

Base.prototype.createViewOnlyElement = function(container) {
  if (this.element) {
    return this.element;
  }

  return originalCreateViewOnlyElement.call(this);
};

Base.prototype.createInlineSaveButton = function() {
  if (this.options.inlineEditing) {
    const saveElement = this.ce(
      'span',
      {
        className: 'save'
      },
      'Save'
    );

    // TODO unsubscribe
    saveElement.addEventListener('click', () => {
      console.log('this', this);
      this.options.readOnly = true;
      this.options.viewAsHtml = true;
      this.options.inlineEditing = false;
      this.element.classList.remove('inline-editing');
      // this.element = null;
      this.redraw();
    });

    this.element.appendChild(saveElement);
  }
};

Base.prototype.build = function(state) {
  originalBuild.call(this, state);

  this.createInlineSaveButton();
};
