import NestedComponent from 'formiojs/components/nested/NestedComponent';
import FormioTabsComponent from 'formiojs/components/tabs/Tabs';

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

  constructor(component, options, data) {
    super(component, options, data);
    this.currentTab = 0;
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

  createElement() {
    this.tabsBar = this.ce('ul', {
      class: 'nav nav-tabs'
    });
    this.tabsContent = this.ce('div', {
      class: 'tab-content'
    });

    this.tabLinks = [];
    this.tabs = [];
    this.component.components.forEach((tab, index) => {
      const tabLink = this.ce(
        'a',
        {
          class: 'nav-link',
          href: `#${tab.key}`
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

      const tabPanel = this.ce('div', {
        role: 'tabpanel',
        class: 'tab-pane',
        id: tab.key
      });
      this.tabsContent.appendChild(tabPanel);
      this.tabs.push(tabPanel);
    });

    if (this.element) {
      this.appendChild(this.element, [this.tabsBar, this.tabsContent]);
      this.element.className = this.className;
      return this.element;
    }

    this.element = this.ce(
      'div',
      {
        id: this.id,
        class: this.className
      },
      [this.tabsBar, this.tabsContent]
    );
    this.element.component = this;

    return this.element;
  }

  /**
   * Set the current tab.
   *
   * @param index
   */
  setTab(index, state) {
    if (this.options.builder) {
      FormioTabsComponent.prototype.setTab.call(this, index, state);
      return;
    }

    if (!this.tabs || !this.component.components || !this.component.components[this.currentTab] || this.currentTab >= this.tabs.length) {
      return;
    }

    this.currentTab = index;

    if (this.tabLinks.length <= index) {
      return;
    }

    this.tabLinks.forEach(tabLink => this.removeClass(tabLink, 'active').removeClass(tabLink.tabLink, 'active'));
    this.tabs.forEach(tab => this.removeClass(tab, 'active'));
    this.addClass(this.tabLinks[index], 'active')
      .addClass(this.tabLinks[index].tabLink, 'active')
      .addClass(this.tabs[index], 'active');
  }

  destroy() {
    const state = super.destroy() || {};
    state.currentTab = this.currentTab;
    return state;
  }

  /**
   * Make sure to include the tab on the component as it is added.
   *
   * @param component
   * @param element
   * @param data
   * @param before
   * @return {BaseComponent}
   */
  addComponent(component, element, data, before, noAdd, state) {
    component.tab = this.currentTab;
    return super.addComponent(component, element, data, before, noAdd, state);
  }

  addComponents(element, data, options, state) {
    if (this.options.builder) {
      FormioTabsComponent.prototype.addComponents.call(this, element, data, options, state);
      return;
    }

    const { currentTab } = state && state.currentTab ? state : this;
    this.setTab(currentTab, state);

    this.components.forEach(c => c.destroy());
    this.components = [];

    for (let i = 0; i < this.tabs.length; i++) {
      this.empty(this.tabs[i]);

      let tab = this.component.components[i];
      if (!tab || !tab.components) {
        continue;
      }

      const tabComponents = tab.components;

      tabComponents.forEach(component => this.addComponent(component, this.tabs[i], this.data, null, null, state));
    }
  }
}
