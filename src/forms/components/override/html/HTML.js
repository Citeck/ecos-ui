import FormIOHTMLComponent from 'formiojs/components/html/HTML';

export default class HtmlComponent extends FormIOHTMLComponent {
  setHTML() {
    this.htmlElement.innerHTML = this.interpolate(this.t(this.component.content));
  }
}
