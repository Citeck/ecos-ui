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

  static optimizeSchema(comp) {
    return {
      ...comp,
      data: _.omitBy(comp.data, (value, key) => key !== comp.dataSrc)
    };
  }

  get defaultSchema() {
    return SelectComponent.schema();
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
}
