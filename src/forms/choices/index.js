import Choices from 'choices.js';

import './style.scss';

import { t } from '@/helpers/util';

/**
 * Accessible name of the item a "remove" button belongs to.
 * `data.value` is a plain string for most selects, but components that compare values with
 * `_.isEqual` (EcosSelect) legitimately hold objects there — printing one gives "[object Object]",
 * so fall back to the rendered label with its markup stripped.
 */
const getItemName = data => {
  if (typeof data?.value === 'string') {
    return data.value;
  }

  const label = typeof data?.label === 'string' ? data.label : '';

  if (!label) {
    return '';
  }

  const holder = document.createElement('div');
  holder.innerHTML = label;

  return holder.innerText || holder.textContent || '';
};

// choices.js 8.0.0 hardcodes the English "Remove item" in its item template — there is no option
// for it and the library's own source marks it as a TODO (D-B-8). Patched once here, on the single
// module every component imports the library through, so an instance built anywhere (including by
// formiojs itself) gets the localized label; per-component `callbackOnCreateTemplates` copies had
// to be kept in sync by hand and any new `new Choices(...)` silently got English back.
const originItemTemplate = Choices.defaults.templates.item;

Choices.defaults.templates.item = function (classNames, data, removeItemButton) {
  const element = originItemTemplate.call(this, classNames, data, removeItemButton);
  const removeButton = element.querySelector('[data-button]');

  if (removeButton) {
    const label = t('select.remove-item');
    const name = getItemName(data);

    removeButton.textContent = label;
    removeButton.setAttribute('aria-label', name ? `${label}: '${name}'` : label);
  }

  return element;
};

const originHideDropdown = Choices.prototype.hideDropdown;

Choices.prototype.hideDropdown = function (preventInputFocus) {
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

Choices.prototype.showDropdown = function (preventInputFocus) {
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

Choices.prototype.recalcDropdownPosition = function (preventInputFocus) {
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
