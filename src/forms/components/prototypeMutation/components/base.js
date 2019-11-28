import Base from 'formiojs/components/base/Base';
import isObject from 'lodash/isObject';
import clone from 'lodash/clone';
import isEqual from 'lodash/isEqual';
import get from 'lodash/get';
import Records from '../../../../components/Records';
import EcosFormUtils from '../../../../components/EcosForm/EcosFormUtils';

const originalCreateTooltip = Base.prototype.createTooltip;
const originalCreateViewOnlyValue = Base.prototype.createViewOnlyValue;
const originalBuild = Base.prototype.build;
const originalCreateViewOnlyElement = Base.prototype.createViewOnlyElement;
const originalCheckValidity = Base.prototype.checkValidity;

const DISABLED_SAVE_BUTTON_CLASSNAME = 'inline-editing__save-button_disabled';

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
  const isComponentDisabled = this.disabled || this.component.disabled;

  const canWrite = get(this, 'options.canWrite', false);
  if (!canWrite) {
    return;
  }

  const editButtonIcon = this.ce('span', { class: 'icon icon-edit' });
  let editButtonClassesList = ['ecos-btn ecos-btn_i ecos-btn_grey2 ecos-btn_width_auto ecos-form__inline-edit-button'];
  if (isComponentDisabled) {
    editButtonClassesList.push('ecos-form__inline-edit-button_disabled');
  } else {
    editButtonClassesList.push('ecos-btn_hover_t-light-blue');
  }
  const editButton = this.ce('button', { class: editButtonClassesList.join(' ') }, editButtonIcon);

  if (!isComponentDisabled) {
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
  }

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
    this._inlineEditSaveButton = this.ce(
      'button',
      {
        class: 'ecos-btn inline-editing__button inline-editing__save-button'
      },
      this.ce('span', { class: 'icon icon-check' })
    );

    const cancelButton = this.ce(
      'button',
      {
        class: 'ecos-btn inline-editing__button inline-editing__cancel-button'
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

    const rollBack = () => {
      if (this.hasOwnProperty('_valueBeforeEdit')) {
        if (!isEqual(this.getValue(), this._valueBeforeEdit)) {
          this.dataValue = this._valueBeforeEdit;
        }
      }

      switchToViewOnlyMode();
    };

    const onSaveButtonClick = () => {
      const saveButtonClassList = this._inlineEditSaveButton.classList;
      if (saveButtonClassList.contains(DISABLED_SAVE_BUTTON_CLASSNAME)) {
        return;
      }

      const recordId = get(this, 'root.options.recordId');
      const componentKey = get(this, 'component.key');
      const form = get(this, 'root');
      if (form.changing) {
        return;
      }

      if (!this.checkValidity(this.getValue(), true)) {
        return;
      }

      if (recordId && componentKey) {
        const record = Records.get(recordId);
        const inputs = EcosFormUtils.getFormInputs(form.component);
        const keysMapping = EcosFormUtils.getKeysMapping(inputs);
        const inputByKey = EcosFormUtils.getInputByKey(inputs);

        let input = inputByKey[componentKey];
        const value = EcosFormUtils.processValueBeforeSubmit(this.dataValue, input, keysMapping);

        record.att(keysMapping[componentKey] || componentKey, value);
        record
          .save()
          .then(() => {
            switchToViewOnlyMode();
            form.showErrors('', true);
          })
          .catch(e => {
            form.showErrors(e, true);
            rollBack();
          });
      } else {
        rollBack();
      }
    };

    const onCancelButtonClick = () => {
      rollBack();
      this.setCustomValidity('');
    };

    this._removeEventListeners = () => {
      this._inlineEditSaveButton.removeEventListener('click', onSaveButtonClick);
      cancelButton.removeEventListener('click', onCancelButtonClick);
      this._removeEventListeners = null;
      this._inlineEditSaveButton = null;
    };

    this._inlineEditSaveButton.addEventListener('click', onSaveButtonClick);
    cancelButton.addEventListener('click', onCancelButtonClick);

    const buttonsWrapper = this.ce('div', {
      class: 'inline-editing__buttons'
    });

    buttonsWrapper.appendChild(cancelButton);
    buttonsWrapper.appendChild(this._inlineEditSaveButton);
    this.element.appendChild(buttonsWrapper);
  }
};

Base.prototype.build = function(state) {
  originalBuild.call(this, state);

  this.createInlineEditSaveAndCancelButtons();
};

Base.prototype.checkValidity = function(data, dirty, rowData) {
  const validity = originalCheckValidity.call(this, data, dirty, rowData);

  if (this._inlineEditSaveButton) {
    const saveButtonClassList = this._inlineEditSaveButton.classList;
    if (validity && saveButtonClassList.contains(DISABLED_SAVE_BUTTON_CLASSNAME)) {
      saveButtonClassList.remove(DISABLED_SAVE_BUTTON_CLASSNAME);
    } else if (!validity && !saveButtonClassList.contains(DISABLED_SAVE_BUTTON_CLASSNAME)) {
      saveButtonClassList.add(DISABLED_SAVE_BUTTON_CLASSNAME);
    }
  }

  return validity;
};
