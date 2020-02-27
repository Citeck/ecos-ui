import FormIORadioComponent from 'formiojs/components/radio/Radio';

export default class RadioComponent extends FormIORadioComponent {
  getView(value) {
    // Cause: https://citeck.atlassian.net/browse/ECOSCOM-3153
    return this.t(super.getView(value));
  }
}
