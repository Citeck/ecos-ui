import Choices from 'choices.js';

const originShowDropdown = Choices.prototype.showDropdown;
const originHideDropdown = Choices.prototype.hideDropdown;
const originRenderChoices = Choices.prototype._renderChoices;

Choices.prototype._renderChoices = function() {
  originRenderChoices.call(this);

  requestAnimationFrame(() => {
    const containerSizes = this.containerInner.element.getBoundingClientRect();
    const height = this.choiceList.element.offsetHeight + this.input.element.offsetHeight || 300;

    this.dropdown.element.style.minHeight = `${(this.choiceList.element.offsetHeight + this.input.element.offsetHeight || 300) + 20}px`;
    this.dropdown.element.style.top = `${containerSizes.top + containerSizes.height}px`;

    if (this.containerOuter.isFlipped) {
      this.dropdown.element.style.top = `${containerSizes.top - 30 - height}px`;
    }
  });
};

Choices.prototype.hideDropdown = function(preventInputFocus) {
  originHideDropdown.call(this, preventInputFocus);

  if (!this.dropdown.isActive) {
    return this;
  }

  this.dropdown.element.style.removeProperty('position');
  this.dropdown.element.style.removeProperty('left');
  this.dropdown.element.style.removeProperty('top');
  this.dropdown.element.style.removeProperty('width');
  this.dropdown.element.style.removeProperty('height');
  this.dropdown.element.style.removeProperty('minHeight');

  return this;
};

Choices.prototype.showDropdown = function(preventInputFocus) {
  originShowDropdown.call(this, preventInputFocus);

  if (this.dropdown.isActive) {
    return this;
  }

  const containerSizes = this.containerInner.element.getBoundingClientRect();
  const modal = this.containerInner.element.closest('.modal-content');
  let { left, top } = containerSizes;

  if (modal) {
    const modalSizes = modal.getBoundingClientRect();

    left = left - modalSizes.left;
    top = top - modalSizes.top;
  }

  this.dropdown.element.style.position = 'fixed';
  this.dropdown.element.style.left = `${left}px`;
  this.dropdown.element.style.top = `${top + containerSizes.height}px`;
  this.dropdown.element.style.width = `${containerSizes.width}px`;
  this.dropdown.element.style.minHeight = `${(this.choiceList.element.offsetHeight + this.input.element.offsetHeight || 300) + 20}px`;

  requestAnimationFrame(() => {
    const { top } = this.containerInner.element.getBoundingClientRect();
    const height = this.choiceList.element.offsetHeight + this.input.element.offsetHeight || 300;

    this.dropdown.element.style.minHeight = `${height + 20}px`;

    if (this.containerOuter.isFlipped) {
      this.dropdown.element.style.top = `${top - 30 - height}px`;
    }
  });

  return this;
};

export default Choices;
