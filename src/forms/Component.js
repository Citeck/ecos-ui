import Component from 'formiojs/Component';
import tippy from 'tippy.js';
import ZIndex from '../services/ZIndex';

const originAddComponent = Component.prototype.hook;

const prependTooltip = (buttonGroup, querySelectorClass, content) => {
  const button = buttonGroup.querySelector(querySelectorClass);
  if (button) {
    tippy(button, {
      zIndex: ZIndex.calcZ() + 1,
      content: content
    });
  }
};

Component.prototype.hook = function(name, ...args) {
  if (!(this.options && this.options.hooks && this.options.hooks[name])) {
    var fn = typeof arguments[arguments.length - 1] === 'function' ? arguments[arguments.length - 1] : null;
    if (fn) {
      return fn(null, arguments[1]);
    } else {
      return arguments[1];
    }
  }
  if (name === 'addComponent') {
    const [, component] = args;
    const result = originAddComponent.call(this, name, ...args);
    if (!component.noEdit && !component.component.internal) {
      const buttonGroup = component.element.querySelector('.component-btn-group');
      if (buttonGroup && component.element && component.element.removeChild) {
        prependTooltip(buttonGroup, '.component-settings-button-remove', this.t('Remove'));
        prependTooltip(buttonGroup, '.component-settings-button-edit', this.t('Edit'));
        prependTooltip(buttonGroup, '.component-settings-button-copy', this.t('Copy'));
        prependTooltip(buttonGroup, '.component-settings-button-paste', this.t('Paste below'));
        prependTooltip(buttonGroup, '.component-settings-button-edit-json', this.t('Edit JSON'));
      }
    }
    return result;
  }

  return originAddComponent.call(this, name, ...args);
};
