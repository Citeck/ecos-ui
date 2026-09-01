import { KEYS_UNUSED_FIELDS } from '@citeck/constants/forms';
import { IGNORE_TABS_HANDLER_ATTR_NAME, SCROLL_STEP } from '@citeck/constants/pageTabs';
import NestedComponent from 'formiojs/components/nested/NestedComponent';
import lodashGet from 'lodash/get';
import isEqual from 'lodash/isEqual';
import isObject from 'lodash/isObject';
import throttle from 'lodash/throttle';

import { t } from '../../../../helpers/export/util';
import { animateScrollTo, getMLValue } from '../../../../helpers/util';

import { buildErrorsMessage, TAB_ERROR_ICON_CLASS, TAB_ERRORS_CLASS, TAB_INVALID_CLASS } from './tabErrors';

const SCROLLABLE_CLASS = 'formio-component-tabs_scrollable';
/** The bar is scrolled all the way to the left / to the right — the arrow on that side has no use. */
const SCROLL_AT_START_CLASS = 'formio-component-tabs_scroll-at-start';
const SCROLL_AT_END_CLASS = 'formio-component-tabs_scroll-at-end';

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
        ],
        clearOnRefresh: true
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

  /**
   * Components of the form, by the index of the tab that holds them.
   *
   * A plain property rather than a `#private` field on purpose: a form is not the only owner of its
   * components — the app hands component trees to `cloneDeep`, and a lodash clone keeps the
   * prototype (so every method still resolves) while private fields, being per-instance and outside
   * the property model, are NOT copied. Reading a private field on such a copy throws
   * "Cannot read private member ... from an object whose class did not declare it" and takes the
   * whole call down with it — which is exactly what `showErrors` -> `_activateFirstInvalidTab` ->
   * `setTab` ran into (COREDEV-431), leaving the error alert of the form behind on top of the
   * per-tab lists. Read it through {@link _getTabsMap}, never directly.
   */
  _tabsByIndex = new Map();

  constructor(component, options, data) {
    super(component, options, data);

    this.currentTab = lodashGet(component, 'currentTab', 0) || lodashGet(options, 'currentTab', 0) || 0;
    this.validityTabs = [];

    // COREDEV-431: per-tab error lists rendered inside the tab panes, keyed by tab index
    this._tabErrorAlerts = {};
    // the lists only appear once the form has actually reported errors (i.e. on submit);
    // before that only the tab indicator reacts to validation
    this._tabErrorsShown = false;
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
    // The bar scrolls by wheel and touch too, not only through the arrows, so which arrow is of
    // any use has to follow the bar itself. Attached here because `createElement` rebuilds it.
    this.tabsBar.addEventListener('scroll', this.onTabsBarScroll);

    let classNames = ['tab-content'];
    if (this.component.scrollableContent) {
      classNames.push('tab-content_scrollable');
    }

    this.tabsContent = this.ce('div', {
      class: classNames.join(' ')
    });

    this.tabLinks = [];
    this.tabs = [];
    // panes are re-created below, so the remembered alert nodes are detached now
    this._tabErrorAlerts = {};
    this.component.components.forEach((tab, index) => {
      if (tab.ignored) {
        return;
      }

      const tabLabel = isEqual(t(`form-constructor.tabs.${tab.key}`), `form-constructor.tabs.${tab.key}`)
        ? getMLValue(tab.label)
        : t(`form-constructor.tabs.${tab.key}`);

      if (lodashGet(tab, 'components')) {
        tab.components.forEach(el => {
          if (this.checkTranslation('label', 'content', el)) {
            el.label = t(`form-constructor.tabs-content.${el.key}`);
          }

          if (this.checkTranslation('placeholder', 'placeholder', el)) {
            el.placeholder = t(`form-constructor.tabs-placeholder.${el.key}`);
          }

          if (this.checkTranslation('tooltip', 'tooltip', el)) {
            el.tooltip = t(`form-constructor.tabs-tooltip.${el.key}`);
          }

          if (this.checkTranslation('description', 'description', el)) {
            el.description = t(`form-constructor.tabs-description.${el.key}`);
          }

          if (el.components) {
            el.components.forEach(item => {
              if (!isObject(item.label)) {
                if (this.checkTranslation('label', 'content', item)) {
                  item.label = t(`form-constructor.tabs-content.${item.key}`);
                }
              }
            });
          }
        });
      }

      const tabLink = this.ce(
        'a',
        {
          class: 'nav-link',
          href: `#${tab.key}`,
          [IGNORE_TABS_HANDLER_ATTR_NAME]: true
        },
        tabLabel
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

    this.tabsBar && this.tabsBar.removeEventListener('scroll', this.onTabsBarScroll);
    this.tabsBarLeftButton.removeEventListener('click', this.onLeftButtonClick);
    this.tabsBarRightButton.removeEventListener('click', this.onRightButtonClick);

    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    window.removeEventListener('resize', this.detectScrollThrottled);

    if (this.component.scrollableContent) {
      window.removeEventListener('resize', this._calculateTabsContentHeightThrottled);
    }
  }

  checkTranslation = (propName, keyName, el) => {
    return !isEqual(t(`form-constructor.tabs-${keyName}.${el.key}`), `form-constructor.tabs-${keyName}.${el.key}`) && `el.${propName}`;
  };

  detectScroll = () => {
    const containerWidth = this.tabsBar.getBoundingClientRect()['width'];
    const scrollWidth = this.tabsBar.scrollWidth;

    if (scrollWidth - containerWidth > 1) {
      if (!this.element.classList.contains(SCROLLABLE_CLASS)) {
        this.element.classList.add(SCROLLABLE_CLASS);
        this.tabsBarLeftButton.addEventListener('click', this.onLeftButtonClick);
        this.tabsBarRightButton.addEventListener('click', this.onRightButtonClick);
      }
    } else {
      this.element.classList.remove(SCROLLABLE_CLASS);
    }

    this.updateScrollButtons();
  };

  /**
   * Which of the two arrows is worth showing. An arrow at the end it already points to would be a
   * control that does nothing — the CSS drops it, and the fade that belongs to it, by these classes.
   *
   * Cause: https://citeck.atlassian.net/browse/COREDEV-431
   */
  updateScrollButtons = () => {
    if (!this.element || !this.tabsBar) {
      return;
    }

    const bar = this.tabsBar;
    // `scrollLeft` is fractional on a scaled display and the far end is never reached exactly
    const maxScrollLeft = bar.scrollWidth - bar.clientWidth;

    this.element.classList.toggle(SCROLL_AT_START_CLASS, bar.scrollLeft <= 1);
    this.element.classList.toggle(SCROLL_AT_END_CLASS, bar.scrollLeft >= maxScrollLeft - 1);
  };

  onTabsBarScroll = () => this.updateScrollButtons();

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
    this.addClass(this.tabLinks[index], 'active').addClass(this.tabLinks[index].tabLink, 'active').addClass(this.tabs[index], 'active');

    this.checkNeedUpdate(index);
  }

  /**
   * COREDEV-431.
   *
   * Renders the errors that belong to this tabs component inside its own tabs (both the marker on
   * the tab label and the error list at the top of the tab pane) and returns the errors that could
   * not be attributed to any tab, so the caller can keep showing those the old way.
   *
   * @param {Array} errors
   * @param {Object} [options]
   * @param {boolean} [options.switchToInvalidTab] jump to the first tab holding errors. Only for a
   *   failed submit the user is waiting for (`Webform.onSubmissionError`): formio re-runs
   *   `showErrors` on EVERY change once the form has been submitted (`Webform.onChange` /
   *   `Webform.checkData`), and inline editing calls it after a per-field save — switching there
   *   would throw the user off the tab they are working on.
   * @returns {Array} errors not belonging to any tab of this component
   */
  showTabErrors(errors = [], { switchToInvalidTab = false } = {}) {
    this._tabErrorsShown = true;

    const remaining = this._applyTabErrors(errors, true);

    if (switchToInvalidTab) {
      this._activateFirstInvalidTab();
    }

    return remaining;
  }

  /**
   * Re-syncs the markers and the error lists with the current state of the fields. Called on every
   * validation pass, so an indicator appears/disappears while the user edits, not only on submit.
   */
  refreshTabErrors() {
    // Whether the lists are on screen is asked of the PANES, not only of this object's own flag:
    // the same tabs of the same form can be driven by more than one component instance (see
    // `_tabsByIndex`), and the one that renders the lists on submit is not always the one that
    // validates afterwards. Reading the flag alone left the other instance clearing the marker of a
    // tab while its list stayed behind — the list of a field the user had just filled in
    // (COREDEV-431).
    const withLists = this._tabErrorsShown || this._hasRenderedTabErrors();

    this._applyTabErrors(withLists ? this.errors : [], withLists);
  }

  /**
   * Is an error list rendered in any pane of this component — by whichever instance put it there?
   *
   * @returns {boolean}
   */
  _hasRenderedTabErrors() {
    return (this.tabs || []).some(tabPanel => !!this._getRenderedTabErrors(tabPanel));
  }

  /**
   * The error list rendered in a pane, if any. Looked up in the DOM rather than in
   * `_tabErrorAlerts`, so that a list another instance of this component rendered into the same
   * pane is still found — and updated or removed — instead of being left there forever.
   *
   * @param {Element} [tabPanel]
   * @returns {Element|null}
   */
  _getRenderedTabErrors(tabPanel) {
    if (!tabPanel || !tabPanel.children) {
      return null;
    }

    return Array.from(tabPanel.children).find(node => node.classList && node.classList.contains(TAB_ERRORS_CLASS)) || null;
  }

  checkValidity(data, dirty, rowData) {
    const result = super.checkValidity(data, dirty, rowData);

    this.refreshTabErrors();

    return result;
  }

  _applyTabErrors(errors, withLists) {
    if (!this._canClaimErrors()) {
      return errors || [];
    }

    const errorList = this._dropErrorsOfNestedTabs(errors || []);
    // the map is a walk over every component of the form — only worth building when there is
    // something to attribute (a validation pass with no errors is the common case)
    const maps = errorList.length ? this._getTabIndexMaps() : null;
    const errorsByTab = new Map();
    const remaining = [];

    errorList.forEach(error => {
      const index = this._getErrorTabIndex(error, maps);

      if (index < 0 || index >= this.tabs.length) {
        remaining.push(error);
        return;
      }

      const tabErrors = errorsByTab.get(index) || [];
      tabErrors.push(error);
      errorsByTab.set(index, tabErrors);
    });

    // The marker is computed from the components themselves rather than from the errors passed in:
    // that keeps a tab holding nested tabs marked even though the inner tabs component claimed the
    // error list, and lets the marker react to editing when no list is shown yet.
    const invalidTabs = this._getTabsWithComponentErrors();
    errorsByTab.forEach((_tabErrors, index) => invalidTabs.add(index));

    this._renderTabErrors(errorsByTab, invalidTabs, withLists);
    this._invalidTabs = invalidTabs;

    return remaining;
  }

  /**
   * Whether this component shows errors on its own tabs at all: a builder preview and a flattened
   * form have no tabs to put them on, and hand every error back to the caller instead.
   *
   * @returns {boolean}
   */
  _canClaimErrors() {
    return !this.options.builder && !this.options.flatten && Array.isArray(this.tabs) && !!this.tabs.length;
  }

  /**
   * Would this component put the error on one of its own tabs?
   *
   * @param {Object} error
   * @param {Object} [maps] result of `_getTabIndexMaps`, to build it once for a whole error list
   * @returns {boolean}
   */
  claimsError(error, maps) {
    if (!this._canClaimErrors()) {
      return false;
    }

    const index = this._getErrorTabIndex(error, maps || this._getTabIndexMaps());

    return index >= 0 && index < this.tabs.length;
  }

  /**
   * Drops the errors a tabs component nested in this one shows itself.
   *
   * A component of an inner tabs component belongs to a tab of this one too — through the tab that
   * holds the whole inner component — so without this the error would be listed twice: once in the
   * pane of the inner tab it really lives on, and once more in the pane of the outer tab. On the
   * `Webform.showErrors` path this cannot happen (errors are handed out innermost first, and what
   * an inner component claimed never reaches the outer one), but `refreshTabErrors` runs off
   * `this.errors` — the deep aggregate — on every `checkValidity`, with no such order to lean on.
   *
   * @param {Array} errors
   * @returns {Array}
   */
  _dropErrorsOfNestedTabs(errors) {
    if (!errors.length || typeof this.everyComponent !== 'function') {
      return errors;
    }

    const nested = [];

    this.everyComponent(component => {
      if (component !== this && component && typeof component.claimsError === 'function' && component._canClaimErrors()) {
        nested.push([component, component._getTabIndexMaps()]);
      }
    });

    if (!nested.length) {
      return errors;
    }

    return errors.filter(error => !nested.some(([component, maps]) => component.claimsError(error, maps)));
  }

  /**
   * Tabs of this component that currently hold at least one invalid field, at any nesting depth.
   *
   * @returns {Set<number>}
   */
  _getTabsWithComponentErrors() {
    const result = new Set();

    this.getComponents().forEach(component => {
      const tabIndex = lodashGet(component, 'component.tab', -1);

      if (!(tabIndex >= 0)) {
        return;
      }

      if ((component.errors || []).length) {
        result.add(tabIndex);
      }
    });

    return result;
  }

  /**
   * Maps every component living inside a tab — at any nesting depth — to that tab's index.
   *
   * `addComponents` writes `tab` into the schema of the direct children of the tabs component only,
   * so anything deeper (a field in a panel, a column, a data grid) inherits the index of its
   * top-level ancestor here.
   *
   * @returns {{ bySchema: Map, byKey: Map }}
   */
  _getTabIndexMaps() {
    const bySchema = new Map();
    const byKey = new Map();

    const register = (component, tabIndex) => {
      const schema = lodashGet(component, 'component');

      if (!schema) {
        return;
      }

      bySchema.set(schema, tabIndex);

      if (schema.key && !byKey.has(schema.key)) {
        byKey.set(schema.key, tabIndex);
      }
    };

    this.getComponents().forEach(component => {
      const tabIndex = lodashGet(component, 'component.tab', -1);

      if (!(tabIndex >= 0)) {
        return;
      }

      register(component, tabIndex);

      if (typeof component.everyComponent === 'function') {
        component.everyComponent(child => register(child, tabIndex));
      }
    });

    return { bySchema, byKey };
  }

  /**
   * Which tab does an error belong to?
   *
   * A validation error carries the *schema object* of its component (see `Base.setCustomValidity`),
   * so identity lookup is the reliable path. Errors coming from outside the form (server side,
   * custom errors) only have a key or a path — those fall back to the key map.
   *
   * @returns {number} tab index or -1
   */
  _getErrorTabIndex(error, maps) {
    if (!error) {
      return -1;
    }

    const component = error.component;

    if (component && typeof component === 'object') {
      if (maps.bySchema.has(component)) {
        return maps.bySchema.get(component);
      }

      if (component.key && maps.byKey.has(component.key)) {
        return maps.byKey.get(component.key);
      }
    }

    const paths = [typeof component === 'string' ? component : null, error.path].filter(path => typeof path === 'string' && path);

    for (const path of paths) {
      if (maps.byKey.has(path)) {
        return maps.byKey.get(path);
      }

      const lastSegment = path.split('.').pop();

      if (maps.byKey.has(lastSegment)) {
        return maps.byKey.get(lastSegment);
      }
    }

    return -1;
  }

  _renderTabErrors(errorsByTab, invalidTabs, withLists) {
    this._tabErrorAlerts = this._tabErrorAlerts || {};

    this.tabs.forEach((tabPanel, index) => {
      const tabItem = this.tabLinks[index];
      const tabLink = tabItem && tabItem.tabLink;
      const isInvalid = invalidTabs.has(index);

      if (tabItem) {
        if (isInvalid) {
          this.addClass(tabItem, TAB_INVALID_CLASS);
        } else {
          this.removeClass(tabItem, TAB_INVALID_CLASS);
        }
      }

      if (tabLink) {
        let icon = tabLink.querySelector(`.${TAB_ERROR_ICON_CLASS}`);

        if (isInvalid && !icon) {
          icon = this.ce('span', {
            class: `${TAB_ERROR_ICON_CLASS} icon-alert`,
            'aria-hidden': 'true'
          });
          tabLink.insertBefore(icon, tabLink.firstChild);
        } else if (!isInvalid && icon && icon.parentNode) {
          icon.parentNode.removeChild(icon);
        }
      }

      const tabErrors = errorsByTab.get(index) || [];
      const html = !withLists || !tabErrors.length || !tabPanel ? null : buildErrorsMessage(this.t('error'), tabErrors);
      const rendered = this._getRenderedTabErrors(tabPanel);
      let previous = this._tabErrorAlerts[index];

      // The pane, not this object's memory, says what is on screen: another instance of this
      // component may have rendered the list (see `refreshTabErrors`), and a list nobody claims is
      // a list nobody ever takes away. Adopt whatever is in the pane.
      if (!previous || previous.node !== rendered) {
        previous = rendered ? { node: rendered, html: rendered.innerHTML } : null;
      }

      // This runs on every validation pass, i.e. on every keystroke once the form has been
      // submitted. Re-creating an identical node would drop a selection inside the list, and
      // the errors of a tab the user is not even on do not change from one keystroke to the next.
      if (previous && previous.html === html && previous.node.parentNode) {
        return;
      }

      if (previous && previous.node.parentNode) {
        previous.node.parentNode.removeChild(previous.node);
      }

      delete this._tabErrorAlerts[index];

      if (!html) {
        return;
      }

      const alert = this.ce('div', {
        class: `alert alert-danger ${TAB_ERRORS_CLASS}`,
        role: 'alert'
      });
      alert.innerHTML = html;

      tabPanel.insertBefore(alert, tabPanel.firstChild);
      this._tabErrorAlerts[index] = { node: alert, html };
    });
  }

  /**
   * Errors are no longer duplicated at the top of the form, so a user submitting from a valid tab
   * would otherwise get no feedback at all — switch to the first tab that actually has errors.
   */
  _activateFirstInvalidTab() {
    const invalidTabs = this._invalidTabs;

    if (!invalidTabs || !invalidTabs.size || invalidTabs.has(this.currentTab)) {
      return;
    }

    const target = Array.from(invalidTabs)
      .sort((a, b) => a - b)
      .find(index => {
        const tabItem = this.tabLinks[index];
        return !!tabItem && !tabItem.classList.contains('hidden');
      });

    if (target !== undefined) {
      this.setTab(target);
    }
  }

  /**
   * The tab -> component map, created on demand so that even a copy of this component that never
   * ran the constructor (see {@link _tabsByIndex}) works instead of throwing.
   *
   * @returns {Map}
   */
  _getTabsMap() {
    if (!(this._tabsByIndex instanceof Map)) {
      this._tabsByIndex = new Map();
    }

    return this._tabsByIndex;
  }

  checkNeedUpdate(index) {
    const tabs = this._getTabsMap();
    const tab = tabs.get(index);
    const setUpdateStatus = (component, status) => {
      if (Array.isArray(component.components)) {
        component.components.forEach(c => setUpdateStatus(c, status));
      }

      if (component._needUpdate !== undefined) {
        component._needUpdate = status;
        status && component.checkConditions();
      }
    };

    [...tabs.values()].forEach(t => setUpdateStatus(t, false));

    if (tab) {
      setUpdateStatus(tab, true);
    }
  }

  destroy() {
    const state = super.destroy() || {};

    state.currentTab = this.currentTab;

    this._getTabsMap().clear();

    return state;
  }

  addComponent(...data) {
    const component = super.addComponent(...data);
    const tabId = lodashGet(component, 'component.tab');

    if (tabId !== undefined) {
      this._getTabsMap().set(tabId, component);
    }

    return component;
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

          // Cause: https://jira.citeck.ru/browse/ECOSUI-3009
          if (!KEYS_UNUSED_FIELDS.includes(component.key)) {
            this.addComponent(component, this.tabs[i], this.data, null, null, state);
          }
        });
      }
    }
  }
}
