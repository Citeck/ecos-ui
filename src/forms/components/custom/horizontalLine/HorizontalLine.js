import BaseComponent from '../base/BaseComponent';

export default class HorizontalLine extends BaseComponent {
  static schema(...extend) {
    return BaseComponent.schema(
      {
        label: 'Horizontal Line',
        key: 'horizontalLine',
        type: 'horizontalLine',
        mask: false,
        inputType: 'horizontalLine',
        useNegativeIndents: true
      },
      ...extend
    );
  }

  static get builderInfo() {
    return {
      title: 'Horizontal Line',
      icon: 'fa fa-minus',
      group: 'layout',
      weight: 0,
      schema: HorizontalLine.schema()
    };
  }

  get defaultSchema() {
    return HorizontalLine.schema();
  }

  build() {
    if (this.viewOnly) {
      return this.viewOnlyBuild();
    }

    this.createElement();

    const classNames = ['formio-component-horizontalLine__line'];
    if (this.component.useNegativeIndents) {
      classNames.push('formio-component-horizontalLine__line_negative-indents');
    }

    this.lineElement = this.ce('div', {
      class: classNames.join(' ')
    });

    if (this.options.builder) {
      // We need to see it in builder mode.
      this.lineElement.appendChild(this.text(this.name + ' (' + this.key + ')'));
    }

    this.element.appendChild(this.lineElement);

    this.attachLogic();
  }

  viewOnlyBuild() {} // hide control for viewOnly mode

  createLabel() {}
}
