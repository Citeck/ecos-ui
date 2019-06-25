import FormIOPanelComponent from 'formiojs/components/panel/Panel';

export default class PanelComponent extends FormIOPanelComponent {
  build(state) {
    const hidePanels = this.options.viewAsHtmlConfig && this.options.viewAsHtmlConfig.hidePanels;

    if (hidePanels) {
      this.component.hideLabel = true;
    }

    super.build(state);

    this.element.classList.remove('mb-2');

    if (hidePanels) {
      this.panelBody.classList.add('pt-0', 'pb-0');
    }
  }
}
