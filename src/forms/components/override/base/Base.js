import isObject from 'lodash/isObject';
import isBoolean from 'lodash/isBoolean';
import clone from 'lodash/clone';
import isEqual from 'lodash/isEqual';
import get from 'lodash/get';
import Base from 'formiojs/components/base/Base';

import Widgets from '../../../widgets';
import { FORM_MODE_CREATE } from '../../../../components/EcosForm/constants';
import { t } from '../../../../helpers/export/util';

const originalCreateTooltip = Base.prototype.createTooltip;
const originalCreateViewOnlyValue = Base.prototype.createViewOnlyValue;
const originalBuild = Base.prototype.build;
const originalCreateViewOnlyElement = Base.prototype.createViewOnlyElement;
const originalCheckValidity = Base.prototype.checkValidity;
const originalCheckConditions = Base.prototype.checkConditions;
const originalSetValue = Base.prototype.setValue;
const originalT = Base.prototype.t;
const originalApplyActions = Base.prototype.applyActions;

const INLINE_EDITING_CLASSNAME = 'inline-editing';
const DISABLED_SAVE_BUTTON_CLASSNAME = 'inline-editing__save-button_disabled';

const originalBaseSchema = Base.schema;
Base.schema = (...extend) => {
  return originalBaseSchema(
    {
      alwaysEnabled: false,
      attributes: {},
      conditional: {
        json: '',
        show: '',
        when: '',
        eq: ''
      },
      customConditional: '',
      disableInlineEdit: false,
      encrypted: false,
      logic: [],
      mask: false,
      properties: {},
      shortcut: '',
      tags: [],
      triggerChangeWhenCalculate: false,
      validate: {
        customMessage: '',
        json: '',
        required: false,
        custom: '',
        customPrivate: false
      },
      addAnother: t('ecos.forms.btn.add-another')
    },
    ...extend
  );
};

// Cause: https://citeck.atlassian.net/browse/ECOSUI-166
const originalGetClassName = Object.getOwnPropertyDescriptor(Base.prototype, 'className');
Object.defineProperty(Base.prototype, 'className', {
  get: function() {
    let className = originalGetClassName.get.call(this);

    if (this._isInlineEditingMode) {
      className += ` ${INLINE_EDITING_CLASSNAME}`;
    }

    if (this.options.theme) {
      className += ` formio-component-${this.component.type}_theme_${this.options.theme}`;
    }

    return className;
  }
});

// Cause: https://citeck.atlassian.net/browse/ECOSUI-208
const emptyCalculateValue = Symbol('empty calculate value');
const customIsEqual = (val1, val2) => {
  if (typeof val1 === 'number' || typeof val2 === 'number') {
    return parseFloat(val1) === parseFloat(val2);
  }
  return isEqual(val1, val2);
};

const modifiedOriginalCalculateValue = function(data, flags) {
  // If no calculated value or
  // hidden and set to clearOnHide (Don't calculate a value for a hidden field set to clear when hidden)
  if (!this.component.calculateValue || ((!this.visible || this.component.hidden) && this.component.clearOnHide)) {
    return false;
  }

  // Get the dataValue.
  let firstPass = false;
  let dataValue = null;
  const allowOverride = this.component.allowCalculateOverride;
  if (allowOverride) {
    dataValue = this.dataValue;
  }

  // First pass, the calculatedValue is undefined.
  if (this.calculatedValue === undefined) {
    firstPass = true;
    this.calculatedValue = emptyCalculateValue;
  }

  // Check to ensure that the calculated value is different than the previously calculated value.
  if (allowOverride && this.calculatedValue !== emptyCalculateValue && !customIsEqual(dataValue, this.calculatedValue)) {
    return false;
  }

  // Calculate the new value.
  const calculatedValue = this.evaluate(
    this.component.calculateValue,
    {
      value: this.defaultValue,
      data
    },
    'value'
  );

  const formOptions = this.options;
  const formMode = formOptions.formMode;
  const isEmptyValue = value => {
    if (formMode === FORM_MODE_CREATE) {
      return this.isEmpty(value);
    }
    return !isBoolean(value) && this.isEmpty(value);
  };
  // If this is the firstPass, and the dataValue is different than to the calculatedValue.
  if (allowOverride && firstPass && !isEmptyValue(dataValue) && !customIsEqual(dataValue, calculatedValue)) {
    // Cause: https://citeck.atlassian.net/browse/ECOSUI-212
    if (formMode && formMode !== FORM_MODE_CREATE && isEmptyValue(calculatedValue)) {
      this.calculatedValue = undefined;
      return false;
    }

    // Return that we have a change so it will perform another pass.
    this.calculatedValue = calculatedValue;
    return true;
  }

  flags = flags || {};
  flags.noCheck = true;
  const changed = this.setValue(calculatedValue, flags);
  this.calculatedValue = this.dataValue;

  return changed;
};

Base.prototype.calculateValue = function(data, flags) {
  if (!this.component.calculateValue) {
    return false;
  }
  // TODO: check, it seems redundant
  const hasChanged = this.hasChanged(
    this.evaluate(
      this.component.calculateValue,
      {
        value: this.defaultValue,
        data
      },
      'value'
    )
  );

  const changed = modifiedOriginalCalculateValue.call(this, data, flags);

  if (this.component.triggerChangeWhenCalculate && (changed || hasChanged)) {
    this.triggerChange(flags);
  }

  return changed;
};

Object.defineProperty(Base.prototype, 'hasSetValue', {
  get: function() {
    // Cause: https://citeck.atlassian.net/browse/ECOSUI-664
    if (!this.hasValue()) {
      this.dataValue = this.component.multiple ? [] : this.emptyValue;
    }
    const formMode = get(this.options, 'formMode');
    if (formMode && formMode !== FORM_MODE_CREATE) {
      return this.hasValue();
    }

    return this.hasValue() && !this.isEmpty(this.dataValue);
  }
});

Base.prototype.isEmpty = function(value) {
  return value === undefined || value === null || value.length === 0 || isEqual(value, this.emptyValue);
};

Base.prototype.applyActions = function(actions, result, data, newComponent) {
  return actions.reduce((changed, action) => {
    switch (action.type) {
      // Cause: https://citeck.atlassian.net/browse/ECOSCOM-3102
      case 'validation':
        this.setPristine(false);
        this.checkValidity(this.getValue(), false);
        return false;
      default:
        return originalApplyActions.call(this, actions, result, data, newComponent);
    }
  }, false);
};

Base.prototype.setValue = function(value, flags) {
  // Cause: https://citeck.atlassian.net/browse/ECOSCOM-2980
  if (this.viewOnly) {
    this.dataValue = value;
  }

  return originalSetValue.call(this, value, flags);
};

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

  const isInlineEditDisabled = get(this, 'options.disableInlineEdit', false) || this.component.disableInlineEdit;
  if (isInlineEditDisabled) {
    return;
  }

  const canWrite = get(this, 'options.canWrite', false);
  if (!canWrite) {
    return;
  }

  const isMobileDevice = get(this, 'options.isMobileDevice', false);

  const editButtonIcon = this.ce('span', { class: 'icon icon-edit' });
  let editButtonClassesList = ['ecos-btn ecos-btn_i ecos-btn_grey2 ecos-btn_width_auto ecos-form__inline-edit-button'];
  if (isComponentDisabled) {
    editButtonClassesList.push('ecos-form__inline-edit-button_disabled');
  } else {
    editButtonClassesList.push('ecos-btn_hover_t-light-blue');
    if (isMobileDevice) {
      editButtonClassesList.push('ecos-form__inline-edit-button_mobile');
    }
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
      container.classList.add(INLINE_EDITING_CLASSNAME);
      editButton.removeEventListener('click', onEditClick);

      if (typeof this.prepareToInlineEditMode === 'function') {
        this.prepareToInlineEditMode();
      }

      this.focus();
    };

    editButton.addEventListener('click', onEditClick);
  }

  container.appendChild(editButton);
};

Base.prototype.createViewOnlyValue = function(container) {
  originalCreateViewOnlyValue.call(this, container);

  this.createInlineEditButton(container);

  const customClass = get(this, 'component.customClass');
  if (customClass) {
    container.classList.add(`${customClass}_view-mode`);
  }
};

Base.prototype.createViewOnlyElement = function() {
  if (this.element) {
    return this.element;
  }

  const element = originalCreateViewOnlyElement.call(this);
  this.errorContainer = element;

  return element;
};

Base.prototype.createInlineEditSaveAndCancelButtons = function() {
  if (this._isInlineEditingMode) {
    this._inlineEditSaveButton = this.ce(
      'button',
      {
        class: 'ecos-btn inline-editing__button inline-editing__save-button'
      },
      this.ce('span', { class: 'icon icon-small-check' })
    );

    const cancelButton = this.ce(
      'button',
      {
        class: 'ecos-btn inline-editing__button inline-editing__cancel-button'
      },
      this.ce('span', { class: 'icon icon-small-close' })
    );

    const switchToViewOnlyMode = () => {
      if (typeof this.cleanAfterInlineEditMode === 'function') {
        this.cleanAfterInlineEditMode();
      }

      this.options.readOnly = true;
      this.options.viewAsHtml = true;
      this._isInlineEditingMode = false;
      this.element.classList.remove(INLINE_EDITING_CLASSNAME);

      this.redraw();
      this._removeEventListeners();

      delete this._valueBeforeEdit;
    };

    const rollBack = () => {
      if (this.hasOwnProperty('_valueBeforeEdit')) {
        if (!isEqual(this.getValue(), this._valueBeforeEdit)) {
          // this.dataValue = this._valueBeforeEdit;
          this.setValue(this._valueBeforeEdit);
        }
      }

      switchToViewOnlyMode();
    };

    const onSaveButtonClick = () => {
      const saveButtonClassList = this._inlineEditSaveButton.classList;

      if (saveButtonClassList.contains(DISABLED_SAVE_BUTTON_CLASSNAME)) {
        return;
      }

      const form = get(this, 'root');
      if (form.changing) {
        return;
      }

      if (!this.checkValidity(this.data, true)) {
        return;
      }

      return form
        .submit()
        .then(() => {
          switchToViewOnlyMode();
          form.showErrors('', true);
          if (typeof this.options.onInlineEditSave === 'function') {
            this.options.onInlineEditSave();
          }
        })
        .catch(e => {
          form.showErrors(e, true);
          rollBack();
        });
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

  // Cause: https://citeck.atlassian.net/browse/ECOSUI-37
  if (!this.options.builder) {
    this.showElement(this.visible && !this.component.hidden);
  }

  const { options = {} } = this;
  const { isDebugModeOn = false } = options;

  if (isDebugModeOn) {
    this.on('change', change => {
      console.log(`This component is changed ${this.label}`);
    });
  }

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

Base.prototype.toggleDisableSaveButton = function(disabled) {
  if (this._inlineEditSaveButton) {
    const saveButtonClassList = this._inlineEditSaveButton.classList;

    if (disabled !== undefined) {
      disabled ? saveButtonClassList.add(DISABLED_SAVE_BUTTON_CLASSNAME) : saveButtonClassList.remove(DISABLED_SAVE_BUTTON_CLASSNAME);
      return;
    }

    saveButtonClassList.toggle(DISABLED_SAVE_BUTTON_CLASSNAME);
  }
};

Base.prototype.isDisabledSaveButton = function() {
  if (this._inlineEditSaveButton) {
    const saveButtonClassList = this._inlineEditSaveButton.classList;

    return saveButtonClassList.contains(DISABLED_SAVE_BUTTON_CLASSNAME);
  }

  return false;
};

Base.prototype.checkConditions = function(data) {
  // Cause: https://citeck.atlassian.net/browse/ECOSCOM-2967
  if (!this.parentVisible) {
    return false;
  }

  return originalCheckConditions.call(this, data);
};

// Cause: https://citeck.atlassian.net/browse/ECOSCOM-3000
Base.prototype.__t = function(content, params) {
  const replacements = content.match(new RegExp(/__t\((.*?)\)/, 'g'));
  if (!replacements) {
    return content;
  }

  let result = content;

  replacements.forEach(item => {
    result = result.replace(item, this.t(item.slice(4, -1), params));
  });

  return result;
};

Base.prototype.t = function(text, params) {
  if (typeof text === 'string' && text.includes('__t(')) {
    return this.__t(text, params);
  }

  return originalT.call(this, text, params);
};

Base.prototype.createWidget = function() {
  if (!this.component.widget) {
    return null;
  }

  const settings =
    typeof this.component.widget === 'string'
      ? {
          type: this.component.widget
        }
      : this.component.widget;

  if (!Widgets.hasOwnProperty(settings.type)) {
    return null;
  }

  settings.icons = this.options.icons;
  settings.i18n = this.options.i18n;
  settings.language = this.options.language;

  const widget = new Widgets[settings.type](settings, this.component);
  widget.on('update', () => this.updateValue(), true);
  widget.on('redraw', () => this.redraw(), true);
  this._widget = widget;
  return widget;
};

Base.prototype.createViewOnlyLabel = function(container) {
  if (this.labelIsHidden()) {
    return;
  }

  if (!this.labelElement) {
    this.labelElement = this.ce('dt');
    this.labelElement.appendChild(this.text(this.component.label));
    this.createTooltip(this.labelElement);
    container.appendChild(this.labelElement);

    return;
  }

  this.labelElement.replaceChild(this.text(this.label), this.labelElement.childNodes[0]);
};

export default Base;
