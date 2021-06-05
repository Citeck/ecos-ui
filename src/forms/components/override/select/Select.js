/* eslint-disable array-callback-return */

import FormIOSelectComponent from 'formiojs/components/select/Select';
import _ from 'lodash';

export default class SelectComponent extends FormIOSelectComponent {
  static schema(...extend) {
    return FormIOSelectComponent.schema(
      {
        unavailableItems: {
          isActive: false
        },
        refreshOnEvent: false,
        selectThreshold: 0.3
      },
      ...extend
    );
  }

  // static get builderInfo() {
  //   return {
  //     title: 'Select',
  //     group: 'sdsf',
  //     icon: 'fa fa-th-list',
  //     weight: 70,
  //     documentation: 'http://help.form.io/userguide/#select',
  //     schema: SelectComponent.schema()
  //   };
  // }

  get defaultSchema() {
    return SelectComponent.schema();
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
          return found ? false : true;
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

  static optimizeSchema(comp) {
    return {
      ...comp,
      data: _.omitBy(comp.data, (value, key) => key !== comp.dataSrc)
    };
  }
}
