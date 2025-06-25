import FormIOPanelComponent from 'formiojs/components/panel/Panel';
import get from 'lodash/get';
import throttle from 'lodash/throttle';
import React from 'react';
import { createRoot } from 'react-dom/client';

import { TEMPLATE_REGEX } from '../../custom/selectJournal/constants';

import ChevronDown from './ChevronDown';
import ChevronRight from './ChevronRight';

import EcosFormUtils from '@/components/EcosForm/EcosFormUtils';
import { t } from '@/helpers/export/util';
import { getMLValue } from '@/helpers/util';

export default class PanelComponent extends FormIOPanelComponent {
  #clearOnHideInProcess = false;

  static schema(...extend) {
    return FormIOPanelComponent.schema(
      {
        title: '',
        label: 'Panel',
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
    const hidePanels = get(this, 'options.viewAsHtmlConfig.hidePanels', false);
    this.component.hideLabel = hidePanels;

    super.build(state);

    this.element.classList.remove('mb-2');

    if (hidePanels) {
      this.panelBody.classList.add('p-0', 'm-0');
    } else {
      this.panelBody.classList.remove('p-0', 'm-0');
    }

    if (this.panelTitle) {
      if (!t(`form-constructor.panel.${this.component.key}`).includes(this.component.key)) {
        this.panelTitle.innerHTML = '';
        if (this.component.collapsible) {
          this.collapseIcon = this.getCollapseIcon();
          this.panelTitle.appendChild(this.collapseIcon);
        }

        this.panelTitle.appendChild(this.text(' '));
        this.panelTitle.appendChild(this.text(t(`form-constructor.panel.${this.component.key}`)));
      }
      if (this.component.validate && this.component.validate.required) {
        this.panelTitle.classList.add('field-required');
      } else {
        this.panelTitle.classList.remove('field-required');
      }

      const templateString = getMLValue(this.component.title);
      const matches = templateString.match(TEMPLATE_REGEX);

      if (matches) {
        if (!hidePanels) {
          this.panelTitle.innerHTML = '';

          if (this.component.collapsible) {
            this.collapseIcon = this.getCollapseIcon();
            this.panelTitle.appendChild(this.collapseIcon);
          }

          this.panelTitle.appendChild(this.text(' '));
          this.panelTitle.appendChild(this.text(EcosFormUtils.renderByTemplate(templateString, this.data)));
        }
      }
    }

    if (this.component.scrollableContent) {
      this.panelBody.classList.add('panel-body_scrollable');

      setTimeout(() => {
        this._calculatePanelContentHeight();
      }, 0);
    }

    this.addEventListeners();
  }

  getCollapseIcon() {
    const container = document.createElement('i');
    createRoot(container).render(this.collapsed ? <ChevronRight /> : <ChevronDown />);
    return container;
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

  _checkContainer = component => {
    for (let item of get(component, 'components')) {
      item.deleteValue();

      if (item.components) {
        this._checkContainer(item);
      }
    }
  };

  clearOnHide(show) {
    // clearOnHide defaults to true for old forms (without the value set) so only trigger if the value is false.
    if (this.component.clearOnHide && !this.options.readOnly && !show && !this.#clearOnHideInProcess) {
      this.#clearOnHideInProcess = true;

      for (let component of get(this, 'components')) {
        if (get(component, 'components')) {
          this._checkContainer(component);
        } else {
          component.deleteValue();
        }
      }
    }

    this.#clearOnHideInProcess = false;
  }
}
