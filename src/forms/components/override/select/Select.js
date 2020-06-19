import FormIOSelectComponent from 'formiojs/components/select/Select';
import _ from 'lodash';

export default class SelectComponent extends FormIOSelectComponent {
  setValue(value, flags) {
    flags = this.getFlags.apply(this, arguments);
    const previousValue = this.dataValue;
    if (this.component.multiple && !Array.isArray(value)) {
      value = value ? [value] : [];
    }

    // Clear absent values (Cause: https://citeck.atlassian.net/browse/ECOSUI-169)
    const findValueIndex = valueItem => this.currentItems.findIndex(item => item[this.component.valueProperty] === valueItem);
    if (this.component.multiple) {
      value = value.filter(valueItem => findValueIndex(valueItem) !== -1);
    } else {
      if (findValueIndex(value) === -1) {
        value = this.emptyValue;
      }
    }

    const hasPreviousValue = Array.isArray(previousValue) ? previousValue.length : previousValue;
    const hasValue = Array.isArray(value) ? value.length : value;
    const changed = this.hasChanged(value, previousValue);
    this.dataValue = value;

    // Do not set the value if we are loading... that will happen after it is done.
    if (this.loading) {
      return changed;
    }

    // Determine if we need to perform an initial lazyLoad api call if searchField is provided.
    if (
      this.component.searchField &&
      this.component.lazyLoad &&
      !this.lazyLoadInit &&
      !this.active &&
      !this.selectOptions.length &&
      hasValue
    ) {
      this.loading = true;
      this.lazyLoadInit = true;
      this.triggerUpdate(this.dataValue, true);
      return changed;
    }

    // Add the value options.
    this.addValueOptions();

    if (this.choices) {
      // Now set the value.
      if (hasValue) {
        this.choices.removeActiveItems();
        // Add the currently selected choices if they don't already exist.
        const currentChoices = Array.isArray(this.dataValue) ? this.dataValue : [this.dataValue];
        if (!this.addCurrentChoices(currentChoices, this.selectOptions, true)) {
          this.choices.setChoices(this.selectOptions, 'value', 'label', true);
        }
        this.choices.setChoiceByValue(value);
      } else if (hasPreviousValue) {
        this.choices.removeActiveItems();
      }
    } else {
      if (hasValue) {
        const values = Array.isArray(value) ? value : [value];
        _.each(this.selectOptions, selectOption => {
          _.each(values, val => {
            if (_.isEqual(val, selectOption.value)) {
              selectOption.element.selected = true;
              selectOption.element.setAttribute('selected', 'selected');
              return false;
            }
          });
        });
      } else {
        _.each(this.selectOptions, selectOption => {
          selectOption.element.selected = false;
          selectOption.element.removeAttribute('selected');
        });
      }
    }

    this.updateOnChange(flags, changed);
    return changed;
  }
}
