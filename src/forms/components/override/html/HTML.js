import FormIOHTMLComponent from 'formiojs/components/html/HTML';
import { t } from '../../../../helpers/export/util';

export default class HtmlComponent extends FormIOHTMLComponent {
  setHTML() {
    console.log('THIS COMPONENT CONTENT', this.component.key, this.component.content);
    this.htmlElement.innerHTML = this.interpolate(t(`form-constructor.html.${this.component.key}`));
  }
}
