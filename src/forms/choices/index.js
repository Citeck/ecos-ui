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
    this.recalcDropdownPosition(preventInputFocus);

    if (!preventInputFocus && this._canSearch) {
      this.input.focus();
    }

    this.passedElement.triggerEvent('showDropdown', {});
  });

  return this;
};

Choices.prototype.recalcDropdownPosition = function(preventInputFocus) {
  try {
    const modalWrapper = this.containerInner.element.closest('.modal.show');
    const containerSizes = this.containerInner.element.getBoundingClientRect();
    const needToFlip = this.containerOuter.shouldFlip(containerSizes.top + this.dropdown.element.offsetHeight);

    let top = containerSizes.top + containerSizes.height;
    let left = containerSizes.left;

    if (needToFlip) {
      top = containerSizes.top - this.dropdown.element.offsetHeight - containerSizes.height + 28;
    }

    const dropdownSizes = this.dropdown.element.getBoundingClientRect();

    if (modalWrapper) {
      const modalContent = this.containerInner.element.closest('.modal-content');
      const modalContentSizes = modalContent.getBoundingClientRect();

      left -= modalContentSizes.left;
      top = top - modalContentSizes.top;
    }

    this.dropdown.element.style.position = 'fixed';
    this.dropdown.element.style.left = `${left}px`;
    this.dropdown.element.style.top = `${top}px`;
    this.dropdown.element.style.width = `${dropdownSizes.width}px`;
    this.dropdown.element.style.minHeight = `${dropdownSizes.height}px`;

    this.containerOuter.open(containerSizes.top + this.dropdown.element.offsetHeight);
  } catch (e) {
    console.error(e);
  }
};

export default Choices;
