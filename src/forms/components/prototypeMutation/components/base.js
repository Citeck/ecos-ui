import Base from 'formiojs/components/base/Base';
import isObject from 'lodash/isObject';
import clone from 'lodash/clone';
import isEqual from 'lodash/isEqual';

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

// Cause: https://citeck.atlassian.net/browse/ECOSENT-832 - Add inline edit support in view mode to the ECOS forms
Base.prototype.createInlineEditButton = function(container) {
  if (this.disabled || this.component.disabled) {
    return;
  }

  const editButtonIcon = this.ce('span', { class: 'icon icon-edit' });
  const editButton = this.ce(
    'button',
    { class: 'ecos-form__inline-edit-button ecos-btn ecos-btn_i ecos-btn_grey2 ecos-btn_width_auto ecos-btn_hover_t-light-blue' },
    editButtonIcon
  );

  const onEditClick = () => {
    const currentValue = this.getValue();
    this._valueBeforeEdit = isObject(currentValue) ? clone(currentValue) : currentValue;

    this.options.readOnly = false;
    this.options.viewAsHtml = false;
    this._isInlineEditingMode = true;

    this.redraw();
    container.classList.add('inline-editing');
    editButton.removeEventListener('click', onEditClick);

    this.focus();
  };

  editButton.addEventListener('click', onEditClick);

  container.appendChild(editButton);
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

Base.prototype.createInlineEditSaveAndCancelButtons = function() {
  if (this._isInlineEditingMode) {
    const saveButton = this.ce(
      'button',
      {
        class: 'ecos-btn inline-editing__button inline-editing__button_save'
      },
      this.ce('span', { class: 'icon icon-check' })
    );

    const cancelButton = this.ce(
      'button',
      {
        class: 'ecos-btn inline-editing__button inline-editing__button_cancel'
      },
      this.ce('span', { class: 'icon icon-close' })
    );

    const switchToViewOnlyMode = () => {
      this.options.readOnly = true;
      this.options.viewAsHtml = true;
      this._isInlineEditingMode = false;
      this.element.classList.remove('inline-editing');

      this.redraw();
      this._removeEventListeners();

      delete this._valueBeforeEdit;
    };

    const onSaveButtonClick = () => {
      switchToViewOnlyMode();
    };

    const onCancelButtonClick = () => {
      if (this.hasOwnProperty('_valueBeforeEdit')) {
        if (!isEqual(this.getValue(), this._valueBeforeEdit)) {
          // this.setValue(this._valueBeforeEdit);
          this.dataValue = this._valueBeforeEdit;
        }
      }

      switchToViewOnlyMode();
    };

    this._removeEventListeners = () => {
      saveButton.removeEventListener('click', onSaveButtonClick);
      cancelButton.removeEventListener('click', onCancelButtonClick);
      this._removeEventListeners = null;
    };

    saveButton.addEventListener('click', onSaveButtonClick);
    cancelButton.addEventListener('click', onCancelButtonClick);

    const buttonsWrapper = this.ce('div', {
      class: 'inline-editing__buttons'
    });

    buttonsWrapper.appendChild(cancelButton);
    buttonsWrapper.appendChild(saveButton);
    this.element.appendChild(buttonsWrapper);
  }
};

Base.prototype.build = function(state) {
  originalBuild.call(this, state);

  this.createInlineEditSaveAndCancelButtons();
};
