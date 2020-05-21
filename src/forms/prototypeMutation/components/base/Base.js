import Base from 'formiojs/components/base/Base';
import isObject from 'lodash/isObject';
import clone from 'lodash/clone';
import isEqual from 'lodash/isEqual';
import get from 'lodash/get';
import Widgets from '../../../widgets';

const originalCreateTooltip = Base.prototype.createTooltip;
const originalCreateViewOnlyValue = Base.prototype.createViewOnlyValue;
const originalBuild = Base.prototype.build;
const originalCreateViewOnlyElement = Base.prototype.createViewOnlyElement;
const originalCheckValidity = Base.prototype.checkValidity;
const originalCheckConditions = Base.prototype.checkConditions;
const originalSetValue = Base.prototype.setValue;
const originalT = Base.prototype.t;
const originalApplyActions = Base.prototype.applyActions;
const originalCalculateValue = Base.prototype.calculateValue;

const DISABLED_SAVE_BUTTON_CLASSNAME = 'inline-editing__save-button_disabled';

Base.prototype.calculateValue = function(data, flags) {
  const changed = originalCalculateValue.call(this, data, flags);

  if (changed && this.component.triggerChangeWhenCalculate) {
    this.triggerChange(flags);
  }

  return changed;
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

  const isInlineEditUnavailable = get(this, 'options.disableInlineEdit', false);
  if (isInlineEditUnavailable) {
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
      this.emit('inlineEditingStart', currentValue);

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
      this.emit('inlineEditingFinish');
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

      if (!this.checkValidity(this.getValue(), true)) {
        return;
      }

      if (this._isInlineEditingMode) {
        var changed = {
          instance: this,
          component: this.component,
          value: this.dataValue,
          flags: {}
        };
        this.emit('inlineSubmit', changed);
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
  this.showElement(this.visible && !this.component.hidden);

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
  if (text.includes('__t(')) {
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
