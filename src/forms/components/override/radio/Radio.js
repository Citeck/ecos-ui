import FormIORadioComponent from 'formiojs/components/radio/Radio';

export default class RadioComponent extends FormIORadioComponent {
  static schema(...extend) {
    return FormIORadioComponent.schema(
      {
        optionsLabelPosition: 'right',
        inline: false
      },
      ...extend
    );
  }

  get defaultSchema() {
    return RadioComponent.schema();
  }

  getView(value) {
    // Cause: https://citeck.atlassian.net/browse/ECOSCOM-3153
    return this.t(super.getView(value));
  }
}
