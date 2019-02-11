import BaseComponent from 'formiojs/components/base/Base';

export default class CustomComponent extends BaseComponent {
  static schema(...extend) {
    return BaseComponent.schema(
      {
        input: true, // Determines if this component provides an input,
        key: 'customElementKey', // The data key for this component (how the data is stored in the database).
        placeholder: 'customElementPlaceholder',
        prefix: '__custom_prefix__',
        customClass: 'custom-element-class',
        suffix: '__custom_suffix__',
        multiple: true,
        defaultValue: null,
        protected: false,
        unique: false, // Validate if the value of this component should be unique within the form.
        persistent: true, // If the value of this component should be persisted within the backend api database.
        hidden: false, // Determines if the component should be within the form, but not visible.
        clearOnHide: true, // If the component should be cleared when hidden.
        tableView: true, // If this component should be included as a column within a submission table.
        dataGridLabel: false, // If true, will show label when component is in a datagrid.
        label: '', // The input label provided to this component.
        labelPosition: 'top',
        labelWidth: 30,
        labelMargin: 3,
        description: '',
        errorLabel: '',
        tooltip: '',
        hideLabel: false,
        tabindex: '',
        disabled: false,
        autofocus: false,
        dbIndex: false,
        customDefaultValue: '',
        calculateValue: '',
        allowCalculateOverride: false,
        widget: null,
        refreshOn: '', // This will refresh this component when this field changes.
        clearOnRefresh: false, // Determines if we should clear our value when a refresh occurs.
        validateOn: 'change', // This will perform the validation on either "change" or "blur" of the input element.

        // The validation criteria for this component.
        validate: {
          required: false, // If this component is required.
          custom: '', // Custom JavaScript validation.
          customPrivate: false // If the custom validation should remain private (only the backend will see it and execute it).
        },

        // The simple conditional settings for a component.
        conditional: {
          show: null,
          when: null,
          eq: ''
        },

        type: 'custom',
        inputType: 'file'
      },
      ...extend
    );
  }

  // static get builderInfo() {
  //   return {
  //     title: 'Custom component',
  //     group: 'data',
  //     icon: 'fa fa-user-secret',
  //     weight: 0,
  //     // documentation: 'http://help.form.io/userguide/#hidden',
  //     schema: CustomComponent.schema()
  //   };
  // }

  get defaultSchema() {
    return CustomComponent.schema();
  }

  // elementInfo() {
  //   const info = super.elementInfo();
  //   info.type = 'input';
  //   info.attr.type = 'text';
  //   info.changeEvent = 'change';
  //   return info;
  // }
  //
  // build() {
  //   super.build();
  //   if (this.options.builder) {
  //     // We need to see it in builder mode.
  //     this.append(this.text(this.name));
  //   }
  // }
  //
  // createLabel() {
  //   return;
  // }
  //
  // setValue(value, flags) {
  //   flags = this.getFlags.apply(this, arguments);
  //   this.dataValue = value;
  //   return this.updateValue(flags);
  // }
  //
  // getValue() {
  //   return this.dataValue;
  // }
}
