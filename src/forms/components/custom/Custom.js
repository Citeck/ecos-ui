import BaseComponent from 'formiojs/components/base/Base';

export default class CustomComponent extends BaseComponent {
  static schema(...extend) {
    return BaseComponent.schema(
      {
        type: 'custom',
        inputType: 'text'
      },
      ...extend
    );
  }

  static get builderInfo() {
    return {
      title: 'Custom component',
      group: 'data',
      icon: 'fa fa-user-secret',
      weight: 0,
      // documentation: 'http://help.form.io/userguide/#hidden',
      schema: CustomComponent.schema()
    };
  }

  get defaultSchema() {
    return CustomComponent.schema();
  }

  elementInfo() {
    const info = super.elementInfo();
    info.type = 'input';
    info.attr.type = 'text';
    info.changeEvent = 'change';
    return info;
  }

  build() {
    super.build();
    if (this.options.builder) {
      // We need to see it in builder mode.
      this.append(this.text(this.name));
    }
  }

  createLabel() {
    return;
  }

  setValue(value, flags) {
    flags = this.getFlags.apply(this, arguments);
    this.dataValue = value;
    return this.updateValue(flags);
  }

  getValue() {
    return this.dataValue;
  }
}
