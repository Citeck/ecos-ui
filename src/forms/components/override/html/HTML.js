import FormIOHTMLComponent from 'formiojs/components/html/HTML';
import { DocUrls } from '../../../../constants/documentation';

export default class HtmlComponent extends FormIOHTMLComponent {
  static get builderInfo() {
    return {
      ...super.builderInfo,
      documentation: `${DocUrls.COMPONENT}html-element`
    };
  }

  setHTML() {
    this.htmlElement.innerHTML = this.interpolate(this.t(this.component.content));
  }
}
