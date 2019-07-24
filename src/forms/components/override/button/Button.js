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

    if (this.component.removeIndents) {
      this.element.classList.remove('form-group');
    }
  }
}
