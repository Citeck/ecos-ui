import FormIOButtonComponent from 'formiojs/components/button/Button';

export default class ButtonComponent extends FormIOButtonComponent {
  static schema(...extend) {
    return FormIOButtonComponent.schema(
      {
        removeIndents: false
      },
      ...extend
    );
  }

  get defaultSchema() {
    return ButtonComponent.schema();
  }

  build() {
    super.build();

    if (this.component.removeIndents && this.parent) {
      const parentEl = this.parent.element;

      if (!parentEl.classList.contains('col-12-manual')) {
        this.element.classList.remove('form-group');
        this.buttonElement.classList.add('btn_without-indents');
      }
    }

    const options = this.options;

    if (options.useNarrowButtons) {
      this.buttonElement.classList.add('btn_narrow');
    }
  }
}
