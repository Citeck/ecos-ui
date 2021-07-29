import NestedComponent from 'formiojs/components/nested/NestedComponent';
import lodashGet from 'lodash/get';
import throttle from 'lodash/throttle';

import { IGNORE_TABS_HANDLER_ATTR_NAME, SCROLL_STEP } from '../../../../constants/pageTabs';
import { animateScrollTo } from '../../../../helpers/util';

const SCROLLABLE_CLASS = 'formio-component-tabs_scrollable';

//Override default tabs component to fix validation in inner fields
export default class TabsComponent extends NestedComponent {
  static schema(...extend) {
    return NestedComponent.schema(
      {
        label: 'Tabs',
        type: 'tabs',
        input: false,
        key: 'tabs',
        persistent: false,
        scrollableContent: false,
        components: [
          {
            label: 'Tab 1',
            key: 'tab1',
            components: []
          }
        ]
      },
      ...extend
    );
  }

  static get builderInfo() {
    return {
      title: 'Tabs',
      group: 'layout',
      icon: 'fa fa-folder-o',
      weight: 50,
      documentation: 'http://help.form.io/userguide/#tabs',
      schema: TabsComponent.schema()
    };
  }

  #tabs = new Map();

  constructor(component, options, data) {
    super(component, options, data);

    this.currentTab = lodashGet(component, 'currentTab', 0) || lodashGet(options, 'currentTab', 0) || 0;
    this.validityTabs = [];
  }

  get defaultSchema() {
    return TabsComponent.schema();
  }

  get schema() {
    const schema = super.schema;

    schema.components = this.component.components.map((tab, index) => {
      if (index === this.currentTab) {
        tab.components = this.getComponents().map(component => component.schema);
      }

      return tab;
    });

    return schema;
  }

  checkConditions(data) {
    let result = super.checkConditions(data);

    if (this.options.builder || this.options.flatten || !this.visible) {
      return result;
    }

    let self = this;

    if (!this.tabsVisibilityUpdateSync) {
      self.updateTabsVisibility();
      this.tabsVisibilityUpdateSync = 1;
    } else {
      let visibilityUpdateSync = ++this.tabsVisibilityUpdateSync;

      setTimeout(() => {
        if (self.tabsVisibilityUpdateSync === visibilityUpdateSync) {
          self.updateTabsVisibility();
        }
      }, 100);
    }

    return result;
  }

  updateTabsVisibility() {
    let tabsVisibility = new Array(this.tabs.length).fill(false);
    let tabsDisability = new Array(this.tabs.length).fill(false);
    const visibleTabs = new Set();
    for (let component of this.getComponents()) {
      let tabIdx = lodashGet(component, 'component.tab', -1);
      if (tabIdx >= 0 && component.visible) {
        tabsVisibility[tabIdx] = true;
        visibleTabs.add(tabIdx);
      }
    }

    // Cause: https://citeck.atlassian.net/browse/ECOSCOM-2847. Disable tab, if it is the only one
    if (visibleTabs.size === 1) {
      const iterator = visibleTabs.values();
      tabsDisability[iterator.next().value] = true;
    }

    if (!tabsVisibility[this.currentTab]) {
      for (let i = 0; i < tabsVisibility.length; i++) {
        if (tabsVisibility[i]) {
          this.setTab(i);
          break;
        }
      }
    }

    let currentVisibility = this._visibleTabs || [];

    let firstVisibleIdx = -1;
    let lastVisibleIdx = -1;

    this.tabLinks.forEach((tabLink, i) => {
      let isVisible = tabsVisibility[i];
      if (isVisible) {
        if (firstVisibleIdx === -1) {
          firstVisibleIdx = i;
        }
        lastVisibleIdx = i;
      }
      if (currentVisibility[i] !== isVisible) {
        if (isVisible) {
          this.removeClass(tabLink, 'hidden');
        } else {
          this.addClass(tabLink, 'hidden');
        }
      }

      let shouldBeDisabled = tabsDisability[i];
      const isAlreadyDisabled = tabLink.classList.contains('disabled');
      if (isAlreadyDisabled !== shouldBeDisabled) {
        if (shouldBeDisabled) {
          this.addClass(tabLink, 'disabled');
        } else {
          this.removeClass(tabLink, 'disabled');
        }
      }
    });

    this._updateFirstVisibleTabClass(firstVisibleIdx);
    this._updateLastVisibleTabClass(lastVisibleIdx);

    this._visibleTabs = tabsVisibility;

    this.detectScroll();
  }

  _updateFirstVisibleTabClass(idx) {
    this._updateFirstOrLastTabClass('currentFirstVisibleTabIdx', idx, 'first-visible-tab');
  }

  _updateLastVisibleTabClass(idx) {
    this._updateFirstOrLastTabClass('currentLastVisibleTabIdx', idx, 'last-visible-tab');
  }

  _updateFirstOrLastTabClass(currentIdxField, newIdx, className) {
    if (this[currentIdxField] !== newIdx) {
      if (this[currentIdxField] > -1) {
        this.removeClass(this.tabLinks[this[currentIdxField]], className);
      }
      if (newIdx > -1) {
        this.addClass(this.tabLinks[newIdx], className);
      }
      this[currentIdxField] = newIdx;
    }
  }

  build(state, showLabel) {
    if (this.options.flatten) {
      this.element = super.createElement();
      this.component.components.forEach(tab => {
        let body;
        const panel = this.ce(
          'div',
          {
            id: this.id,
            class: 'mb-2 card border panel panel-default'
          },
          [
            this.ce(
              'div',
              {
                class: 'card-header bg-default panel-heading'
              },
              this.ce(
                'h4',
                {
                  class: 'mb-0 card-title panel-title'
                },
                tab.label
              )
            ),
            (body = this.ce('div', {
              class: 'card-body panel-body'
            }))
          ]
        );
        tab.components.forEach(component =>
          this.addComponent(component, body, this.data, null, null, this.getComponentState(component, state))
        );
        this.element.appendChild(panel);
      });
    } else {
      super.build(state, showLabel);
    }

    if (this.component.scrollableContent) {
      setTimeout(() => {
        this._calculateTabsContentHeight();
      }, 0);
    }
  }

  _calculateTabsContentHeight = () => {
    this.tabsContent.style.maxHeight = null;

    const clientHeight = document.documentElement.clientHeight;

    const modal = this.tabsContent.closest('.ecos-modal');
    if (modal) {
      const modalLevel = parseInt(modal.dataset.level, 10);

      let tabsContentMaxHeight = clientHeight - 280;
      const modalLevelOffset = 60;
      if (modalLevel > 0 && modalLevel < 5) {
        tabsContentMaxHeight -= modalLevel * modalLevelOffset - modalLevelOffset;
      }

      if (tabsContentMaxHeight >= 200) {
        this.tabsContent.style.maxHeight = `${tabsContentMaxHeight}px`;
      }
    }
  };

  destroyComponents() {
    this.removeEventListeners();
    return super.destroyComponents();
  }

  createElement() {
    this.tabsBarWrapper = this.ce('div', {
      class: 'formio-component-tabs-wrapper'
    });
    this.tabsBarScrollWrapper = this.ce('div', {
      class: 'formio-component-tabs-scroll-wrapper'
    });
    this.tabsBarLeftButton = this.ce('div', {
      class: 'formio-component-tabs-left-button'
    });
    this.tabsBarRightButton = this.ce('div', {
      class: 'formio-component-tabs-right-button'
    });

    this.tabsBar = this.ce('ul', {
      class: 'nav nav-tabs'
    });

    let classNames = ['tab-content'];
    if (this.component.scrollableContent) {
      classNames.push('tab-content_scrollable');
    }

    this.tabsContent = this.ce('div', {
      class: classNames.join(' ')
    });

    this.tabLinks = [];
    this.tabs = [];
    this.component.components.forEach((tab, index) => {
      const tabLink = this.ce(
        'a',
        {
          class: 'nav-link',
          href: `#${tab.key}`,
          [IGNORE_TABS_HANDLER_ATTR_NAME]: true
        },
        tab.label
      );
      this.addEventListener(tabLink, 'click', event => {
        event.preventDefault();
        this.setTab(index);
      });
      const tabElement = this.ce(
        'li',
        {
          class: 'nav-item',
          role: 'presentation'
        },
        tabLink
      );
      tabElement.tabLink = tabLink;
      this.tabsBar.appendChild(tabElement);
      this.tabLinks.push(tabElement);
      this.tabsBarScrollWrapper.appendChild(this.tabsBar);
      this.tabsBarWrapper.appendChild(this.tabsBarLeftButton);
      this.tabsBarWrapper.appendChild(this.tabsBarScrollWrapper);
      this.tabsBarWrapper.appendChild(this.tabsBarRightButton);

      const tabPanel = this.ce('div', {
        role: 'tabpanel',
        class: 'tab-pane',
        id: tab.key
      });
      this.tabsContent.appendChild(tabPanel);
      this.tabs.push(tabPanel);
    });

    if (this.tabLinks.length > 0) {
      this._updateFirstVisibleTabClass(0);
      this._updateLastVisibleTabClass(this.tabLinks.length - 1);
    }

    if (this.element) {
      this.appendChild(this.element, [this.tabsBarWrapper, this.tabsContent]);
      this.element.className = this.className;
      return this.element;
    }

    this.element = this.ce(
      'div',
      {
        id: this.id,
        class: this.className
      },
      [this.tabsBarWrapper, this.tabsContent]
    );
    this.element.component = this;

    this.addEventListeners();

    return this.element;
  }

  addEventListeners() {
    let checkTimes = 0;
    this.detectScrollInterval = setInterval(() => {
      if (checkTimes > 10 || this.element.classList.contains(SCROLLABLE_CLASS)) {
        return clearInterval(this.detectScrollInterval);
      }
      this.detectScroll();
      checkTimes++;
    }, 500);

    document.addEventListener('visibilitychange', this.onVisibilityChange);
    window.addEventListener('resize', this.detectScrollThrottled);

    if (this.component.scrollableContent) {
      window.addEventListener('resize', this._calculateTabsContentHeightThrottled);
    }
  }

  removeEventListeners() {
    clearInterval(this.detectScrollInterval);

    this.tabsBarLeftButton.removeEventListener('click', this.onLeftButtonClick);
    this.tabsBarRightButton.removeEventListener('click', this.onRightButtonClick);

    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    window.removeEventListener('resize', this.detectScrollThrottled);

    if (this.component.scrollableContent) {
      window.removeEventListener('resize', this._calculateTabsContentHeightThrottled);
    }
  }

  detectScroll = () => {
    const containerWidth = this.tabsBar.getBoundingClientRect()['width'];
    const scrollWidth = this.tabsBar.scrollWidth;

    if (scrollWidth - containerWidth > 1) {
      if (this.element.classList.contains(SCROLLABLE_CLASS)) {
        return null;
      }

      this.element.classList.add(SCROLLABLE_CLASS);
      this.tabsBarLeftButton.addEventListener('click', this.onLeftButtonClick);
      this.tabsBarRightButton.addEventListener('click', this.onRightButtonClick);
    } else {
      this.element.classList.remove(SCROLLABLE_CLASS);
    }
  };

  detectScrollThrottled = throttle(this.detectScroll, 300);
  _calculateTabsContentHeightThrottled = throttle(this._calculateTabsContentHeight, 300);

  onLeftButtonClick = () => {
    animateScrollTo(this.tabsBar, { scrollLeft: this.tabsBar.scrollLeft - SCROLL_STEP });
  };

  onRightButtonClick = () => {
    animateScrollTo(this.tabsBar, { scrollLeft: this.tabsBar.scrollLeft + SCROLL_STEP });
  };

  onVisibilityChange = () => {
    if (!document.hidden) {
      this.detectScroll();
    }
  };

  /**
   * Set the current tab.
   *
   * @param index
   */
  setTab(index, state) {
    if (!this.tabs || !this.component.components || !this.component.components[this.currentTab] || this.currentTab >= this.tabs.length) {
      return;
    }

    this.currentTab = index;

    if (this.options.builder) {
      // Get the current tab.
      const tab = this.component.components[index];
      this.empty(this.tabs[index]);
      this.components.map(comp => comp.destroy());
      this.components = [];
      const components = this.hook('addComponents', tab.components, this);
      components.forEach(component => this.addComponent(component, this.tabs[index], this.data, null, null, state));
      this.restoreValue();
    }

    if (this.tabLinks.length <= index) {
      return;
    }

    this.tabLinks.forEach(tabLink => this.removeClass(tabLink, 'active').removeClass(tabLink.tabLink, 'active'));
    this.tabs.forEach(tab => this.removeClass(tab, 'active'));
    this.addClass(this.tabLinks[index], 'active')
      .addClass(this.tabLinks[index].tabLink, 'active')
      .addClass(this.tabs[index], 'active');

    this.checkNeedUpdate(index);
  }

  checkNeedUpdate(index) {
    const tab = this.#tabs.get(index);
    const setUpdateStatus = (component, status) => {
      if (Array.isArray(component.components)) {
        component.components.forEach(c => setUpdateStatus(c, status));
      }

      if (component._needUpdate !== undefined) {
        component._needUpdate = status;
        status && component.checkConditions();
      }
    };

    [...this.#tabs.values()].forEach(t => setUpdateStatus(t, false));

    if (tab) {
      setUpdateStatus(tab, true);
    }
  }

  destroy() {
    const state = super.destroy() || {};

    state.currentTab = this.currentTab;

    this.#tabs.clear();

    return state;
  }

  addComponent(...data) {
    const component = super.addComponent(...data);
    const tabId = lodashGet(component, 'component.tab');

    if (tabId !== undefined) {
      this.#tabs.set(tabId, component);
    }
  }

  /**
   * Only add the components for the active tab.
   */
  addComponents(element, data, options, state) {
    const { currentTab } = state && state.currentTab ? state : this;
    this.setTab(currentTab, state);

    if (!this.options.builder && !this.options.flatten) {
      this.components.forEach(c => c.destroy());
      this.components = [];

      for (let i = 0; i < this.tabs.length; i++) {
        this.empty(this.tabs[i]);

        const tab = this.component.components[i];
        if (!tab || !tab.components) {
          continue;
        }

        const tabComponents = tab.components;

        tabComponents.forEach(component => {
          component.tab = i;
          this.addComponent(component, this.tabs[i], this.data, null, null, state);
        });
      }
    }
  }
}
