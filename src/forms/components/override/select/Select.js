/* eslint-disable array-callback-return */

import FormIOSelectComponent from 'formiojs/components/select/Select';
import _ from 'lodash';
import Choices from 'choices.js';

import Base from '../../override/base/Base';

const baseAddInput = Base.prototype.addInput;

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

export default class SelectComponent extends FormIOSelectComponent {
  static schema(...extend) {
    return FormIOSelectComponent.schema(
      {
        unavailableItems: {
          isActive: false,
          code: ''
        },
        refreshOnEvent: false,
        selectThreshold: 0.3
      },
      ...extend
    );
  }

  static optimizeSchema(comp) {
    return {
      ...comp,
      data: _.omitBy(comp.data, (value, key) => key !== comp.dataSrc)
    };
  }

  get defaultSchema() {
    return SelectComponent.schema();
  }

  get unavailableItems() {
    const { code: items, isActive } = _.get(this.component, 'unavailableItems', {});

    if (!isActive) {
      return [];
    }

    return this.evaluate(items, {}, 'value', true);
  }

  hideDropdown() {
    if (!_.get(this, 'choices.dropdown.isActive')) {
      return false;
    }

    this.choices.hideDropdown();
  }

  itemTemplate(data) {
    let newData = _.cloneDeep(data);

    if (data && data.label) {
      newData.label = this.t(data.label);
    } else {
      newData = this.t(data);
    }

    return super.itemTemplate(newData);
  }

  addOption(value, label, attr) {
    const option = {
      value: value,
      label: label,
      disabled: this.unavailableItems.includes(value),
      // TODO: unable to add multiple custom properties
      customProperties: this.unavailableItems.includes(value)
    };

    if (value) {
      this.selectOptions.push(option);
    }
    if (this.choices) {
      return;
    }

    option.element = document.createElement('option');
    if (this.dataValue === option.value) {
      option.element.setAttribute('selected', 'selected');
      option.element.selected = 'selected';
    }
    option.element.innerHTML = label;
    if (attr) {
      _.each(attr, (value, key) => {
        option.element.setAttribute(key, value);
      });
    }
    this.selectInput.appendChild(option.element);
  }

  addCurrentChoices(values, items, keyValue) {
    if (!values) {
      return false;
    }

    const notFoundValuesToAdd = [];
    const added = values.reduce((defaultAdded, value) => {
      if (!value) {
        return defaultAdded;
      }
      let found = false;

      // Make sure that `items` and `this.selectOptions` points
      // to the same reference. Because `this.selectOptions` is
      // internal property and all items are populated by
      // `this.addOption` method, we assume that items has
      // 'label' and 'value' properties. This assumption allows
      // us to read correct value from the item.
      const isSelectOptions = items === this.selectOptions;
      if (items && items.length) {
        _.each(items, choice => {
          if (choice._id && value._id && choice._id === value._id) {
            found = true;

            return false;
          }

          const itemValue = keyValue ? choice.value : this.itemValue(choice, isSelectOptions);
          found |= _.isEqual(itemValue, value);

          return !found;
        });
      }

      // Add the default option if no item is found.
      if (!found) {
        notFoundValuesToAdd.push({
          value: this.itemValue(value),
          label: this.itemTemplate(value)
        });

        return true;
      }

      return found || defaultAdded;
    }, false);

    // Cause: https://citeck.atlassian.net/browse/ECOSUI-169
    // if (notFoundValuesToAdd.length) {
    //   if (this.choices) {
    //     this.choices.setChoices(notFoundValuesToAdd, 'value', 'label');
    //   }
    //   else {
    //     notFoundValuesToAdd.map(notFoundValue => {
    //       this.addOption(notFoundValue.value, notFoundValue.label);
    //     });
    //   }
    // }
    return added;
  }

  addInput(input, container) {
    baseAddInput.call(this, input, container);

    if (this.component.multiple) {
      input.setAttribute('multiple', true);
    }

    if (this.component.widget === 'html5') {
      this.triggerUpdate();
      this.focusableElement = input;
      this.addEventListener(input, 'focus', () => this.update());
      this.addEventListener(input, 'keydown', event => {
        const { keyCode } = event;

        if ([8, 46].includes(keyCode)) {
          this.setValue(null);
        }
      });
      return;
    }

    const useSearch = this.component.hasOwnProperty('searchEnabled') ? this.component.searchEnabled : true;
    const placeholderValue = this.t(this.component.placeholder);
    let customOptions = this.component.customOptions || {};
    if (typeof customOptions == 'string') {
      try {
        customOptions = JSON.parse(customOptions);
      } catch (err) {
        console.warn(err.message);
        customOptions = {};
      }
    }

    const searchField = this.component.searchField;
    const choicesOptions = {
      removeItemButton: this.component.disabled ? false : _.get(this.component, 'removeItemButton', true),
      itemSelectText: '',
      classNames: {
        containerOuter: 'choices form-group formio-choices',
        containerInner: 'form-control'
      },
      addItemText: false,
      placeholder: !!this.component.placeholder,
      placeholderValue: placeholderValue,
      noResultsText: this.t('No results found'),
      noChoicesText: this.t('No choices to choose from'),
      searchPlaceholderValue: this.t('Type to search'),
      shouldSort: false,
      position: this.component.dropdown || 'auto',
      searchEnabled: useSearch,
      searchChoices: !searchField,
      searchFields: this.component.searchFields || (searchField ? [`value.${searchField}`] : ['label']),
      fuseOptions: Object.assign(
        {
          include: 'score',
          threshold: _.get(this, 'component.searchThreshold', 0.3)
        },
        _.get(this, 'component.fuseOptions', {})
      ),
      itemComparer: _.isEqual,
      ...customOptions
    };

    const tabIndex = input.tabIndex;
    this.addPlaceholder(input);
    input.setAttribute('dir', this.i18next.dir());
    this.choices = new Choices(input, choicesOptions);

    if (this.component.multiple) {
      this.focusableElement = this.choices.input.element;
    } else {
      this.focusableElement = this.choices.containerInner.element;
      this.choices.containerOuter.element.setAttribute('tabIndex', '-1');
      if (useSearch) {
        this.addEventListener(this.choices.containerOuter.element, 'focus', () => this.focusableElement.focus());
      }
    }

    this.scrollList = this.choices.choiceList.element;
    this.onScroll = () => {
      if (!this.scrollLoading && this.scrollList.scrollTop + this.scrollList.clientHeight >= this.scrollList.scrollHeight) {
        this.scrollTop = this.scrollList.scrollTop;
        this.scrollLoading = true;
        this.triggerUpdate(this.choices.input.element.value);
      }
    };
    this.scrollList.addEventListener('scroll', this.onScroll);

    this.addFocusBlurEvents(this.focusableElement);
    this.focusableElement.setAttribute('tabIndex', tabIndex);

    this.setInputStyles(this.choices.containerOuter.element);

    // If a search field is provided, then add an event listener to update items on search.
    if (this.component.searchField) {
      // Make sure to clear the search when no value is provided.
      if (this.choices && this.choices.input && this.choices.input.element) {
        this.addEventListener(this.choices.input.element, 'input', event => {
          if (!event.target.value) {
            this.triggerUpdate();
          }
        });
      }
      this.addEventListener(input, 'search', event => this.triggerUpdate(event.detail.value));
      this.addEventListener(input, 'stopSearch', () => this.triggerUpdate());
    }

    this.addEventListener(input, 'showDropdown', () => {
      if (this.dataValue) {
        this.triggerUpdate();
      }
      this.update();
    });
    if (placeholderValue && this.choices._isSelectOneElement) {
      this.addEventListener(input, 'removeItem', () => {
        const items = this.choices._store.activeItems;
        if (!items.length) {
          this.choices._addItem({
            value: placeholderValue,
            label: placeholderValue,
            choiceId: 0,
            groupId: -1,
            customProperties: null,
            placeholder: true,
            keyCode: null
          });
        }
      });
    }

    // Add value options.
    if (this.addValueOptions()) {
      this.restoreValue();
    }

    // Force the disabled state with getters and setters.
    this.disabled = this.disabled;
    this.triggerUpdate();
  }
}
