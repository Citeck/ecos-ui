import FormIOHTMLComponent from 'formiojs/components/html/HTML';
import { t } from '../../../../helpers/export/util';

export default class HtmlComponent extends FormIOHTMLComponent {
  setHTML() {
    if (!t(`form-constructor.html.${this.component.key}`).includes(this.component.key)) {
      this.htmlElement.innerHTML = this.interpolate(t(`form-constructor.html.${this.component.key}`));
    } else {
      this.htmlElement.innerHTML = this.interpolate(this.t(this.component.content));
    }
  }
}
