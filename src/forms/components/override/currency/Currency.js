import FormIOCurrencyComponent from 'formiojs/components/currency/Currency';
import { overrideTriggerChange } from '../misc';

export default class CurrencyComponent extends FormIOCurrencyComponent {
  constructor(...args) {
    super(...args);
    console.log(...args);

    overrideTriggerChange.call(this);
  }
}
