import Choices from 'choices.js';

import './style.scss';

const originHideDropdown = Choices.prototype.hideDropdown;

Choices.prototype.hideDropdown = function(preventInputFocus) {
  originHideDropdown.call(this, preventInputFocus);

  this.clearInput();

  this.dropdown.element.style.removeProperty('position');
  this.dropdown.element.style.removeProperty('left');
  this.dropdown.element.style.removeProperty('top');
  this.dropdown.element.style.removeProperty('width');
  this.dropdown.element.style.removeProperty('height');
  this.dropdown.element.style.removeProperty('minHeight');

  if (!this.dropdown.isActive) {
    return this;
  }

  return this;
};

Choices.prototype.showDropdown = function(preventInputFocus) {
  if (this.dropdown.isActive) {
    return this;
  }

  this.dropdown.show();

  requestAnimationFrame(() => {
    this.containerOuter.open(this.dropdown.distanceFromTopWindow());

    if (!preventInputFocus && this._canSearch) {
      this.input.focus();
    }

    this.passedElement.triggerEvent('showDropdown', {});
  });

  return this;
};

export default Choices;
