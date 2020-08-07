import FormIOPanelComponent from 'formiojs/components/panel/Panel';
import throttle from 'lodash/throttle';

export default class PanelComponent extends FormIOPanelComponent {
  static schema(...extend) {
    return FormIOPanelComponent.schema(
      {
        collapsible: false,
        scrollableContent: false
      },
      ...extend
    );
  }

  get defaultSchema() {
    return PanelComponent.schema();
  }

  build(state) {
    const hidePanels = this.options.viewAsHtmlConfig && this.options.viewAsHtmlConfig.hidePanels;

    if (hidePanels) {
      this.component.hideLabel = true;
    }

    super.build(state);

    this.element.classList.remove('mb-2');

    if (hidePanels) {
      this.panelBody.classList.add('p-0', 'm-0');
    }

    if (this.component.scrollableContent) {
      this.panelBody.classList.add('panel-body_scrollable');

      setTimeout(() => {
        this._calculatePanelContentHeight();
      }, 0);
    }

    this.addEventListeners();
  }

  destroyComponents() {
    this.removeEventListeners();
    return super.destroyComponents();
  }

  addEventListeners() {
    if (this.component.scrollableContent) {
      window.addEventListener('resize', this._calculatePanelContentHeightThrottled);
    }
  }

  removeEventListeners() {
    if (this.component.scrollableContent) {
      window.removeEventListener('resize', this._calculatePanelContentHeightThrottled);
    }
  }

  _calculatePanelContentHeight = () => {
    this.panelBody.style.maxHeight = null;

    const clientHeight = document.documentElement.clientHeight;

    const modal = this.panelBody.closest('.ecos-modal');
    if (modal) {
      const modalLevel = parseInt(modal.dataset.level, 10);

      let panelContentMaxHeight = clientHeight - 220;
      const modalLevelOffset = 60;
      if (modalLevel > 0 && modalLevel < 5) {
        panelContentMaxHeight -= modalLevel * modalLevelOffset - modalLevelOffset;
      }

      const hasTabParent = this.panelBody.closest('.tab-content');
      if (hasTabParent) {
        panelContentMaxHeight -= 62;
      }

      if (panelContentMaxHeight >= 200) {
        this.panelBody.style.maxHeight = `${panelContentMaxHeight}px`;
      }
    }
  };

  _calculatePanelContentHeightThrottled = throttle(this._calculatePanelContentHeight, 300);
}
