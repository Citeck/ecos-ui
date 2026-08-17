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

// choices.js renders no more than `searchResultLimit` matches as soon as the user types — 4 of them by
// default. A list cut down to four looked like the whole answer, so options past the fourth could not be
// found by searching for them (COREDEV-359). The option is read as a plain loop bound, so no value means
// "all of them": -1 renders nothing and a huge number spins the loop over empty indexes. Default it to
// `null` — no limit — and resolve that to the number of matches at render time.
Choices.defaults.options.searchResultLimit = null;

const originCreateChoicesFragment = Choices.prototype._createChoicesFragment;

Choices.prototype._createChoicesFragment = function (choices, fragment, withinGroup) {
  // A limit a caller asked for is still obeyed; only the absent one means "render them all".
  if (!this._isSearching || this.config.searchResultLimit != null) {
    return originCreateChoicesFragment.call(this, choices, fragment, withinGroup);
  }

  this.config.searchResultLimit = Array.isArray(choices) ? choices.length : 0;

  try {
    return originCreateChoicesFragment.call(this, choices, fragment, withinGroup);
  } finally {
    this.config.searchResultLimit = null;
  }
};

const originRenderChoices = Choices.prototype._renderChoices;

Choices.prototype._renderChoices = function () {
  originRenderChoices.call(this);

  // The dropdown is placed once, when it opens, and it is anchored by its top edge — see
  // `recalcDropdownPosition`. Filtering changes the height of the list, so a dropdown that had to open
  // upwards would stay where it was and hang detached from its field. Re-anchor it to what it now shows.
  if (this.dropdown.isActive) {
    this.recalcDropdownPosition(true);
  }
};

/**
 * The dropdown is taken out of the flow (`position: fixed` in `recalcDropdownPosition`) so that a
 * panel with `overflow: hidden` cannot cut it off. The flip side is that its coordinates are frozen
 * at the moment it opens: scroll the page afterwards and the list stays where the field used to be,
 * hanging over whatever is underneath (COREDEV-317). Keep it under its field for as long as it is
 * open — on capture, because a scrolling container does not bubble its event.
 */
Choices.prototype.bindDropdownPositionSync = function () {
  if (this.syncDropdownPosition) {
    return;
  }

  this.syncDropdownPosition = () => {
    if (this.dropdownPositionFrame) {
      return;
    }

    // one recalculation per frame: a scroll fires far more often than the screen is painted
    this.dropdownPositionFrame = requestAnimationFrame(() => {
      this.dropdownPositionFrame = null;

      if (this.dropdown.isActive) {
        this.recalcDropdownPosition(true);
      }
    });
  };

  window.addEventListener('scroll', this.syncDropdownPosition, true);
  window.addEventListener('resize', this.syncDropdownPosition);
};

Choices.prototype.unbindDropdownPositionSync = function () {
  if (!this.syncDropdownPosition) {
    return;
  }

  window.removeEventListener('scroll', this.syncDropdownPosition, true);
  window.removeEventListener('resize', this.syncDropdownPosition);
  this.syncDropdownPosition = null;

  if (this.dropdownPositionFrame) {
    cancelAnimationFrame(this.dropdownPositionFrame);
    this.dropdownPositionFrame = null;
  }
};

const originDestroy = Choices.prototype.destroy;

Choices.prototype.destroy = function () {
  this.unbindDropdownPositionSync();

  originDestroy.call(this);
};

const originHideDropdown = Choices.prototype.hideDropdown;

Choices.prototype.hideDropdown = function (preventInputFocus) {
  originHideDropdown.call(this, preventInputFocus);

  this.unbindDropdownPositionSync();
  this.clearInput();

  this.dropdown.element.style.removeProperty('position');
  this.dropdown.element.style.removeProperty('left');
  this.dropdown.element.style.removeProperty('top');
  this.dropdown.element.style.removeProperty('bottom');
  this.dropdown.element.style.removeProperty('width');
  this.dropdown.element.style.removeProperty('height');

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
    this.bindDropdownPositionSync();

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
    // `containerOuter` keeps the flipped state for as long as the dropdown stays open — it drops the class
    // only on close. Follow it, so that re-anchoring a list that has just been filtered down to a couple of
    // matches keeps the orientation it opened with instead of jumping to the other side of the field.
    const needToFlip =
      this.containerOuter.isFlipped || this.containerOuter.shouldFlip(containerSizes.top + this.dropdown.element.offsetHeight);

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
    // A dropdown opened upwards is laid out by the stylesheet as `top: auto; bottom: 100%`. The `top` we
    // set just above would leave it constrained by both edges — a height of its own, and the height of
    // the list inside it, would then be ignored. We place both orientations by their top edge.
    this.dropdown.element.style.bottom = 'auto';
    // No min-height here: it used to freeze the height the dropdown had when it opened, and a list
    // filtered down to a few matches then kept the empty space of the full one below it (COREDEV-359).
    this.dropdown.element.style.width = `${dropdownSizes.width}px`;

    this.containerOuter.open(containerSizes.top + this.dropdown.element.offsetHeight);
  } catch (e) {
    console.error(e);
  }
};

export default Choices;
