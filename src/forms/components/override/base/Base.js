import Base from 'formiojs/components/base/Base';
import { flattenComponents, getInputMask } from 'formiojs/utils/utils';
import clone from 'lodash/clone';
import cloneDeep from 'lodash/cloneDeep';
import get from 'lodash/get';
import isBoolean from 'lodash/isBoolean';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import isFunction from 'lodash/isFunction';
import isObject from 'lodash/isObject';
import isUndefined from 'lodash/isUndefined';
import set from 'lodash/set';
import Tooltip from 'tooltip.js';

import { checkIsEmptyMlField, clearFormFromCache } from '../../../utils';
import Widgets from '../../../widgets';

import { FORM_MODE_CREATE } from '@/components/EcosForm/constants';
import { t } from '@/helpers/export/util';
import { getCurrentLocale, getMLValue, getTextByLocale, isEqualLexicalValue } from '@/helpers/util';
import WidgetService from '@/services/WidgetService';
import ZIndex from '@/services/ZIndex';

// >>> Methods
const originalCreateViewOnlyValue = Base.prototype.createViewOnlyValue;
const originalBuild = Base.prototype.build;
const originalCreateViewOnlyElement = Base.prototype.createViewOnlyElement;
const originalCheckValidity = Base.prototype.checkValidity;
const originalCheckConditions = Base.prototype.checkConditions;
const originalSetValue = Base.prototype.setValue;
const originalT = Base.prototype.t;
const originalApplyActions = Base.prototype.applyActions;
const originalSetInputMask = Base.prototype.setInputMask;
const originalCreateLabel = Base.prototype.createLabel;
const originalElementInfo = Base.prototype.elementInfo;
const originalCreateDescription = Base.prototype.createDescription;
const originalAddShortcutToLabel = Base.prototype.addShortcutToLabel;
const originalEvalContext = Base.prototype.evalContext;
const originalOnChange = Base.prototype.onChange;
const setPristine = Base.prototype.setPristine;
// Methods <<<

// >>> PropertyDescriptors
// Cause: https://citeck.atlassian.net/browse/ECOSUI-166
const originalGetClassName = Object.getOwnPropertyDescriptor(Base.prototype, 'className');
const originalPropertyViewOnly = Object.getOwnPropertyDescriptor(Base.prototype, 'viewOnly');
// PropertyDescriptors <<<

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

Base.prototype.callFunction = function (functionName, ...args) {
  if (isFunction(this[functionName])) {
    this[functionName].call(this, ...args);
  }
};

Object.defineProperty(Base.prototype, 'valueChangedByUser', {
  enumerable: true,
  configurable: true,
  writable: true,
  value: false
});

Object.defineProperty(Base.prototype, 'calculatedValueWasCalculated', {
  enumerable: true,
  configurable: true,
  writable: true,
  value: false
});

Base.prototype.onChange = function (flags, fromRoot) {
  const isCreateMode = get(this.options, 'formMode') === FORM_MODE_CREATE;

  if (get(flags, 'modified') || get(flags, 'skipReactWrapperUpdating')) {
    const isEqualValues = this.isLexicalEditor
      ? isEqualLexicalValue(this.dataValue, this.calculatedValue)
      : this.customIsEqual(this.dataValue, this.calculatedValue);

    this.valueChangedByUser = (!isCreateMode && !isEqualValues) || (isCreateMode && !this.isEmptyValue(this.dataValue));
  }

  if (get(flags, 'changeByUser')) {
    this.valueChangedByUser = true;
  }

  return originalOnChange.call(this, flags, fromRoot);
};

Base.prototype.isEmptyValue = function (value) {
  const isCreateMode = get(this.options, 'formMode') === FORM_MODE_CREATE;

  if (isCreateMode) {
    return this.isEmpty(value);
  }

  return !isBoolean(value) && this.isEmpty(value);
};

Base.prototype.customIsEqual = function (val1, val2) {
  if (typeof val1 === 'number' || typeof val2 === 'number') {
    return parseFloat(val1) === parseFloat(val2);
  }

  return isEqual(val1, val2);
};

// Cause: https://citeck.atlassian.net/browse/ECOSUI-166
Object.defineProperty(Base.prototype, 'className', {
  get: function () {
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

Object.defineProperty(Base.prototype, 'hasSetValue', {
  get: function () {
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

// Cause: https://citeck.atlassian.net/browse/ECOSUI-826
Object.defineProperty(Base.prototype, 'viewOnly', {
  get: function () {
    const _viewOnly = originalPropertyViewOnly.get.call(this);
    return this.component.unreadable || _viewOnly;
  }
});

// Cause: https://citeck.atlassian.net/browse/ECOSUI-829
Object.defineProperty(Base.prototype, 'label', {
  set: function (value) {
    if (typeof value === 'string') {
      value = {
        [getCurrentLocale()]: value
      };
    }

    this.component.label = value;

    if (this.labelElement) {
      this.labelElement.innerHTML = getTextByLocale(value);
    }
  },

  get: function () {
    return getTextByLocale(this.component.label);
  }
});

// Cause: https://citeck.atlassian.net/browse/ECOSUI-829
Object.defineProperty(Base.prototype, 'placeholder', {
  get: function () {
    return getTextByLocale(this.component.placeholder);
  }
});

// Cause: https://citeck.atlassian.net/browse/ECOSUI-829
Object.defineProperty(Base.prototype, 'name', {
  get: function () {
    return this.t(this.label || this.placeholder || this.key);
  }
});

// Cause: https://citeck.atlassian.net/browse/ECOSUI-208
const emptyCalculateValue = Symbol('empty calculate value');

const modifiedOriginalCalculateValue = function (data, flags) {
  // clear calculate value from comments and empty lines
  let calculateValue = this.component.calculateValue;

  if (calculateValue && typeof calculateValue === 'string') {
    calculateValue = calculateValue.replace(/\/\/.*(\n|$)/g, '').replace(/^(\n)+/g, '');
  }

  // If no calculated value or
  // hidden and set to clearOnHide (Don't calculate a value for a hidden field set to clear when hidden)
  if (!calculateValue || (this.type !== 'hidden' && (!this.visible || this.component.hidden) && this.component.clearOnHide)) {
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
  if (isUndefined(this.calculatedValue)) {
    firstPass = true;
    this.calculatedValue = emptyCalculateValue;
  }

  // Check to ensure that the calculated value is different than the previously calculated value.
  if (allowOverride && this.calculatedValue !== emptyCalculateValue && !this.customIsEqual(dataValue, this.calculatedValue)) {
    return false;
  }

  // Calculate the new value.
  let calculatedValue = this.evaluate(
    this.component.calculateValue,
    {
      value: this.defaultValue,
      data
    },
    'value'
  );

  const isCreateMode = get(this.options, 'formMode') === FORM_MODE_CREATE;
  const isEmptyValue = value => {
    if (isCreateMode) {
      return this.isEmpty(value);
    }

    return !isBoolean(value) && this.isEmpty(value);
  };
  // If this is the firstPass, and the dataValue is different than to the calculatedValue.
  if (allowOverride && firstPass && !isEmptyValue(dataValue) && !this.customIsEqual(dataValue, calculatedValue)) {
    // Cause: https://citeck.atlassian.net/browse/ECOSUI-212
    if (!isCreateMode && isEmptyValue(calculatedValue)) {
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

Base.prototype.calculateValue = function (data, flags) {
  if (!this.component.calculateValue) {
    return false;
  }

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

Base.prototype.isEmpty = function (value) {
  return value === undefined || value === null || value.length === 0 || isEqual(value, this.emptyValue);
};

Base.prototype.applyActions = function (actions, result, data, newComponent) {
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

Base.prototype.setValue = function (value, flags) {
  // Cause: https://citeck.atlassian.net/browse/ECOSCOM-2980
  if (this.viewOnly /* && !this.calculatedValueWasCalculated*/) {
    this.dataValue = value;
  }

  return originalSetValue.call(this, value, flags);
};

Base.prototype.createTooltip = function (container, component, classes) {
  // Cause: https://citeck.atlassian.net/browse/ECOSUI-829
  if (this.tooltip) {
    return;
  }

  component = component || this.component;
  classes = classes || `${this.iconClass('question-sign')} text-muted`;

  if (checkIsEmptyMlField(component.tooltip)) {
    return;
  }

  const ttElement = this.ce('i', {
    class: classes
  });

  container.appendChild(this.text(' '));
  container.appendChild(ttElement);

  this.tooltip = new Tooltip(ttElement, {
    trigger: 'hover click',
    placement: 'top',
    html: true,
    title: this.interpolate(this.t(getTextByLocale(component.tooltip))).replace(/(?:\r\n|\r|\n)/g, '<br />')
  });

  if (this.tooltip) {
    this.tooltip.updateTitleContent(this.t(this.tooltip.options.title));
  }
};

// Cause: https://citeck.atlassian.net/browse/ECOSCOM-2661
Base.prototype.addInputError = function (message, dirty) {
  if (!message) {
    return;
  }

  if (this.viewOnly) {
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
Base.prototype.createInlineEditButton = function (container) {
  if (this.component.unreadable) {
    return;
  }

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
    const onEditClick = async () => {
      setPristine.call(this, false);
      const components = flattenComponents(this.root.components);

      await Promise.all(
        Object.keys(components).map(key => {
          const component = components[key];

          return component.silentSaveForm.call(component);
        })
      );

      const currentValue = this.getValue();
      this._valueBeforeEdit = isObject(currentValue) ? clone(currentValue) : currentValue;

      // Cause: https://citeck.atlassian.net/browse/ECOSUI-1538
      if (isEmpty(this._cachedData)) {
        this._cachedData = cloneDeep(this.data);
      }

      this.options.readOnly = false;
      this.options.viewAsHtml = false;
      this._isInlineEditingMode = true;

      this.redraw();
      container.classList.add(INLINE_EDITING_CLASSNAME);
      editButton.removeEventListener('click', onEditClick);

      if (isFunction(this.prepareToInlineEditMode)) {
        this.prepareToInlineEditMode();
      }

      this.focus();
    };

    editButton.addEventListener('click', onEditClick);
  }

  container.appendChild(editButton);
};

Base.prototype.createViewOnlyValue = function (container) {
  originalCreateViewOnlyValue.call(this, container);

  this.createInlineEditButton(container);

  const customClass = get(this, 'component.customClass');

  if (customClass) {
    const list = `${customClass}_view-mode`.split(' ');
    container.classList.add(...list);
  }
};

Base.prototype.createViewOnlyElement = function () {
  if (this.element) {
    return this.element;
  }

  const element = originalCreateViewOnlyElement.call(this);
  this.errorContainer = element;

  return element;
};

/**
 * Update cached data only for components, opened for inline editing
 *
 * @param data
 */
Base.prototype.updateCachedData = function (data = {}) {
  if (!isEmpty(this._cachedData)) {
    this._cachedData = cloneDeep(data);
  }
};

// Cause: https://citeck.atlassian.net/browse/ECOSUI-2231
Base.prototype.silentSaveForm = function () {
  if (!this._isInlineEditingMode) {
    return Promise.resolve();
  }

  const form = get(this, 'root');
  const options = { withoutLoader: true };
  let before;

  if (this.options.saveDraft) {
    before = false;
    options.state = 'draft';
  } else {
    if (!this.checkValidity(this.dataValue)) {
      return Promise.reject();
    }
  }

  return form
    .submit(before, options)
    .then(() => {
      this.switchToViewOnlyMode();

      if (!this.options.saveDraft) {
        form.showErrors('', true);
      }

      this.removeClass(this.element, 'has-error');

      const components = flattenComponents(this.root.components);

      Object.keys(components).forEach(key => {
        const component = components[key];

        component.updateCachedData(this.data);
      });
    })
    .catch(e => {
      form.showErrors(e, true);
      this.inlineEditRollback();
    });
};

Base.prototype.createInlineEditSaveAndCancelButtons = function () {
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

    const onSaveButtonClick = () => {
      const saveButtonClassList = this._inlineEditSaveButton.classList;

      if (saveButtonClassList.contains(DISABLED_SAVE_BUTTON_CLASSNAME)) {
        if (!this.checkValidity(this.dataValue)) {
          return;
        }

        saveButtonClassList.remove(DISABLED_SAVE_BUTTON_CLASSNAME);
      }

      const form = get(this, 'root');

      if (form.changing) {
        this.switchToViewOnlyMode();
        return;
      }

      // Cause: https://citeck.atlassian.net/browse/ECOSUI-1559
      const submitAttributes = [];

      if (this.options.saveDraft) {
        submitAttributes.push(false);
        submitAttributes.push({ state: 'draft' });
      } else {
        if (!this.checkValidity(this.dataValue)) {
          return;
        }
      }

      return form
        .submit(...submitAttributes)
        .then(() => {
          this.switchToViewOnlyMode();

          if (!this.options.saveDraft) {
            form.showErrors('', true);
          }
          this.removeClass(this.element, 'has-error');
          if (isFunction(this.options.onInlineEditSave)) {
            this.options.onInlineEditSave();
          }
          const ecosForm = get(form, 'ecos.form');
          if (ecosForm !== null) {
            ecosForm.onReload(true);
          } else {
            form.showErrors('', true);
          }
        })
        .finally(() => {
          form.loading = false;
        });
    };

    const onCancelButtonClick = () => {
      // Cause: https://citeck.atlassian.net/browse/ECOSUI-1538
      if (!isEmpty(this._cachedData)) {
        if (this.isLexicalEditor) {
          this.editor = null;
          this._lexicalRoot = null;
          this._lexicalInited = false;
        } else {
          this.root.setValue({ data: this._cachedData });
          this.root.onChange();
          this._cachedData = {};

          const components = flattenComponents(this.root.components);

          for (const key in components) {
            if (components.hasOwnProperty(key)) {
              const component = components[key];

              component.inlineEditRollback.call(component);
            }
          }
        }
      }

      this.inlineEditRollback();
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

Base.prototype.build = function (state) {
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

Base.prototype.checkValidity = function (data, dirty, rowData) {
  if (this.component.unreadable) {
    return true;
  }

  if (!this.component.validate.required && !isBoolean(this.dataValue) && isEmpty(this.dataValue)) {
    return true;
  }

  if (this.component.optionalWhenDisabled && this.component.validate.required && isEmpty(this.dataValue) && this.component.disabled) {
    return true;
  }

  const validity = originalCheckValidity.call(this, data, dirty, rowData);

  if (this._inlineEditSaveButton && !this.options.saveDraft) {
    const saveButtonClassList = this._inlineEditSaveButton.classList;
    if (validity && saveButtonClassList.contains(DISABLED_SAVE_BUTTON_CLASSNAME)) {
      saveButtonClassList.remove(DISABLED_SAVE_BUTTON_CLASSNAME);
    } else if (!validity && !saveButtonClassList.contains(DISABLED_SAVE_BUTTON_CLASSNAME)) {
      saveButtonClassList.add(DISABLED_SAVE_BUTTON_CLASSNAME);
    }
  }

  return validity;
};

Base.prototype.toggleDisableSaveButton = function (disabled) {
  if (this._inlineEditSaveButton) {
    const saveButtonClassList = this._inlineEditSaveButton.classList;

    if (disabled !== undefined) {
      disabled ? saveButtonClassList.add(DISABLED_SAVE_BUTTON_CLASSNAME) : saveButtonClassList.remove(DISABLED_SAVE_BUTTON_CLASSNAME);
      return;
    }

    saveButtonClassList.toggle(DISABLED_SAVE_BUTTON_CLASSNAME);
  }
};

Base.prototype.isDisabledSaveButton = function () {
  if (this._inlineEditSaveButton) {
    const saveButtonClassList = this._inlineEditSaveButton.classList;

    return saveButtonClassList.contains(DISABLED_SAVE_BUTTON_CLASSNAME);
  }

  return false;
};

Base.prototype.checkConditions = function (data) {
  // Cause: https://citeck.atlassian.net/browse/ECOSCOM-2967
  if (!this.parentVisible) {
    return false;
  }

  return originalCheckConditions.call(this, data);
};

// Cause: https://citeck.atlassian.net/browse/ECOSCOM-3000
Base.prototype.__t = function (content, params) {
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

Base.prototype.t = function (text, params) {
  if (typeof text === 'string' && text.includes('__t(')) {
    return this.__t(text, params) || text;
  }

  return originalT.call(this, getMLValue(text), params) || text;
};

Base.prototype.createWidget = function () {
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
  widget.on('update', () => this.updateValue({ changeByUser: true }), true);
  widget.on('redraw', () => this.redraw(), true);
  this._widget = widget;
  return widget;
};

// Cause: https://citeck.atlassian.net/browse/ECOSUI-829
Base.prototype.createLabel = function (container) {
  originalCreateLabel.call(this, container);

  if (!this.labelIsHidden()) {
    this.labelElement.replaceChild(this.text(this.label), this.labelElement.childNodes[0]);
    this.createTooltip(this.labelElement);
  }
};

// Cause: https://citeck.atlassian.net/browse/ECOSUI-829
Base.prototype.createViewOnlyLabel = function (container) {
  if (this.labelIsHidden()) {
    return;
  }

  const labelElement = this.ce('dt');

  labelElement.appendChild(this.text(this.label));
  this.createTooltip(labelElement);

  if (this.labelElement && container.firstChild) {
    container.replaceChild(labelElement, container.firstChild);
  } else {
    container.appendChild(labelElement);
  }

  this.labelElement = labelElement;
};

// Cause: https://citeck.atlassian.net/browse/ECOSUI-829
Object.defineProperty(Base.prototype, 'errorLabel', {
  get: function () {
    return this.t(this.component.errorLabel || getTextByLocale(this.component.label) || this.component.placeholder || this.key);
  }
});

// Cause: https://citeck.atlassian.net/browse/ECOSUI-829
Base.prototype.elementInfo = function () {
  const info = originalElementInfo.call(this);

  if (this.component.placeholder) {
    set(info, 'attr.placeholder', this.t(this.placeholder));
  }

  return info;
};

// Cause: https://citeck.atlassian.net/browse/ECOSUI-829
Base.prototype.createDescription = function (container) {
  originalCreateDescription.call(this, container);

  if (!this.component.description) {
    return;
  }

  this.description.innerHTML = this.t(getTextByLocale(this.component.description));
};

// Cause: https://citeck.atlassian.net/browse/ECOSUI-829
Base.prototype.setInputMask = function (input, inputMask) {
  const result = originalSetInputMask.call(this, input, inputMask, !isEmpty(this.placeholder));

  if (isEmpty(this.placeholder) && input && inputMask) {
    input.setAttribute('placeholder', this.maskPlaceholder(getInputMask(inputMask)));
  }

  return result;
};

// Cause: https://citeck.atlassian.net/browse/ECOSUI-829
Base.prototype.addShortcutToLabel = function (label, shortcut) {
  if (!label) {
    label = this.label;
  }

  return originalAddShortcutToLabel.call(this, label, shortcut);
};

// Cause: https://citeck.atlassian.net/browse/ECOSUI-826
Base.prototype.setUnreadableLabel = function (element) {
  if (!element) {
    return;
  }

  if (this.component.unreadable) {
    element.innerHTML = t('ecos-form.value-unreadable');
    element.className = 'ecos-form__value_unreadable';
  }
};

// Cause: https://citeck.atlassian.net/browse/ECOSUI-826
Base.prototype.setupValueElement = function (element) {
  if (!element) {
    return;
  }

  if (this.component.unreadable) {
    this.setUnreadableLabel(element);
    return;
  }

  let value = this.getValue();

  value = this.isEmpty(value) ? this.defaultViewOnlyValue : this.getView(value);

  element.textContent = value;
};

// Cause: https://citeck.atlassian.net/browse/ECOSUI-963
function extendingOfComponent(component) {
  if (isEmpty(component)) {
    return component;
  }

  const fields = ['label', 'placeholder', 'description', 'tooltip'];

  fields.forEach(key => {
    if (component.hasOwnProperty(`${key}ByLocale`)) {
      return;
    }

    Object.defineProperty(component, `${key}ByLocale`, {
      get: function () {
        return getTextByLocale(this[key]);
      },
      mutable: true,
      configurable: true
    });
  });

  if (!isEmpty(component.components)) {
    component.components = component.components.map(item => extendingOfComponent(item));
  }

  return component;
}

// Cause: https://citeck.atlassian.net/browse/ECOSUI-918
Object.defineProperty(Base.prototype, 'component', {
  get: function () {
    return extendingOfComponent(this._component);
  },

  set: function (component) {
    if (component.addAnother) {
      component.addAnother = t(component.addAnother);
    }

    this._component = extendingOfComponent(component);
  }
});

Base.prototype.evalContext = function (additional) {
  const context = originalEvalContext.call(this, additional);
  const utils = {
    ...context.utils,
    getTextByLocale,
    getCurrentLocale,
    openSettingsWidgets: WidgetService.openEditJournalWidgets
  };

  return {
    ...context,
    utils,
    util: utils
  };
};

Object.defineProperty(Base.prototype, 'originalComponent', {
  get: function () {
    return extendingOfComponent(this._originalComponent);
  },

  set: function (value) {
    this._originalComponent = extendingOfComponent(value);
  }
});

Base.prototype.createModal = function (...params) {
  const modalBody = this.ce('div');
  const modalOverlay = this.ce('div', {
    class: 'formio-dialog-overlay'
  });
  const closeDialog = this.ce('button', {
    class: 'formio-dialog-close pull-right btn btn-default btn-xs',
    'aria-label': 'close'
  });
  const modalBodyContainer = this.ce(
    'div',
    {
      class: 'formio-dialog-content'
    },
    [modalBody, closeDialog]
  );
  const dialog = this.ce(
    'div',
    {
      class: 'formio-dialog formio-dialog-theme-default component-settings'
    },
    [modalOverlay, modalBodyContainer]
  );
  this.addEventListener(modalOverlay, 'click', function (event) {
    event.preventDefault();
    dialog.close();
  });
  this.addEventListener(closeDialog, 'click', function (event) {
    event.preventDefault();
    dialog.close();
  });
  this.addEventListener(dialog, 'close', () => {
    this.removeChildFrom(dialog, document.body);
  });
  dialog.classList.add('ecosZIndexAnchor');

  document.body.appendChild(dialog);
  dialog.body = modalBody;
  dialog.bodyContainer = modalBodyContainer;

  dialog.close = () => {
    clearFormFromCache(this.editForm.id);
    dialog.dispatchEvent(new CustomEvent('close'));
    this.removeChildFrom(dialog, document.body);
  };

  ZIndex.calcZ();
  ZIndex.setZ(dialog);

  return dialog;
};

Base.prototype.inlineEditRollback = function () {
  if (this.hasOwnProperty('_valueBeforeEdit')) {
    if (!isEqual(this.getValue(), this._valueBeforeEdit)) {
      this.setValue(this._valueBeforeEdit);
    }
  }

  this.switchToViewOnlyMode();
};

Base.prototype.switchToViewOnlyMode = function () {
  if (isFunction(this.cleanAfterInlineEditMode)) {
    this.cleanAfterInlineEditMode();
  }

  this.options.readOnly = true;
  this.options.viewAsHtml = true;
  this._isInlineEditingMode = false;
  this.element.classList.remove(INLINE_EDITING_CLASSNAME);

  this.redraw();

  if (isFunction(this._removeEventListeners)) {
    this._removeEventListeners.call(this);
  }

  delete this._valueBeforeEdit;
};

export default Base;
