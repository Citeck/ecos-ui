import Formio from 'formiojs/Formio';
import _ from 'lodash';

import Choices from '../../../choices';
import { requestAnimationFrame } from '../../override/misc';
import BaseComponent from '../base/BaseComponent';

import { createDocumentUrl } from '@/helpers/urls.js';
import { getMLValue, isNodeRef } from '@/helpers/util.js';

export default class SelectComponent extends BaseComponent {
  static schema(...extend) {
    return BaseComponent.schema(
      {
        type: 'ecosSelect',
        label: 'Select',
        key: 'ecosSelect',
        data: {
          values: [],
          json: '',
          url: '',
          resource: '',
          custom: ''
        },
        limit: 100,
        dataSrc: 'url',
        valueProperty: 'value',
        filter: '',
        searchEnabled: true,
        searchField: '',
        minSearch: 0,
        readOnlyValue: false,
        authenticate: false,
        template: '<span>{{ item.label }}</span>',
        selectFields: '',
        searchThreshold: 0.3,
        fuseOptions: {},
        customOptions: {},
        refreshEventName: '',
        dataPreProcessingCode: '',
        unavailableItems: {
          isActive: false,
          code: ''
        },
        lazyLoad: false,
        selectValues: '',
        disableLimit: false,
        sort: '',
        refreshOnEvent: false,
        selectThreshold: 0.3,
        refreshOn: [],
        isSelectedValueAsText: false
      },
      ...extend
    );
  }

  static get builderInfo() {
    return {
      title: 'ECOS Select',
      group: 'basic',
      icon: 'fa fa-th-list',
      weight: 70,
      documentation: 'http://help.form.io/userguide/#select',
      schema: SelectComponent.schema()
    };
  }

  _hasItemsBeenAlreadyLoadedOnce = false;

  // Check if there is data of such nesting
  checkEnclosureData(data, path = '', splitter = '.') {
    let flag = false;

    if (!!path) {
      const roads = path.split(splitter);
      let currentData = data;

      roads.forEach(road => {
        if (Array.isArray(currentData)) {
          if (currentData.length === 0) {
            return false;
          }
          currentData = currentData[0];
        }

        if (currentData[road] === undefined) {
          flag = false;
          return;
        }

        currentData = currentData[road];
      });

      if (currentData !== undefined) {
        flag = true;
      }
    }

    return flag;
  }

  checkConditions(data) {
    let result = super.checkConditions(data);
    const refreshOn = this.component.refreshOn;

    switch (true) {
      case result && !this._hasItemsBeenAlreadyLoadedOnce: {
        this.triggerUpdate();
        break;
      }
      case result && _.isArray(refreshOn) && refreshOn.length > 0 && !_.isUndefined(this.component.forceReload): {
        const find = refreshOn.filter(item => this.checkEnclosureData(data, item));

        if (find && find.length) {
          this.triggerUpdate();
        }

        break;
      }
      default:
        return result;
    }

    return result;
  }

  build() {
    super.build();

    if (this.component.refreshEventName) {
      this.on(
        this.component.refreshEventName,
        () => {
          this.triggerUpdate();
        },
        true
      );
    }
  }

  createViewOnlyValue(container) {
    if (this.component.dataSrc === 'url') {
      this.updateItems('', !this.active, () => {
        super.updateViewOnlyValue();
      });
    }

    super.createViewOnlyValue(container);
  }

  constructor(component, options, data) {
    super(component, options, data);

    // Trigger an update.
    this.triggerUpdate = _.debounce(this.updateItems.bind(this), 100, {
      leading: true,
      trailing: true
    });

    // Keep track of the select options.
    this.selectOptions = [];

    // Keep track of the last batch of items loaded.
    this.currentItems = [];
    this.loadedItems = 0;
    this.isScrollLoading = false;
    this.scrollTop = 0;

    // If this component has been activated.
    this.activated = false;

    // Determine when the items have been loaded.
    this.itemsLoaded = new Promise(resolve => {
      this.itemsLoadedResolve = resolve;
    });
  }

  get dataReady() {
    return this.itemsLoaded;
  }

  get defaultSchema() {
    return SelectComponent.schema();
  }

  get emptyValue() {
    return this.component.multiple ? [] : '';
  }

  get unavailableItems() {
    const { code: items, isActive } = _.get(this.component, 'unavailableItems', {});

    if (!isActive) {
      return [];
    }

    return this.evaluate(items, {}, 'value', true);
  }

  elementInfo() {
    const info = super.elementInfo();
    info.type = 'select';
    info.changeEvent = 'change';
    return info;
  }

  createWrapper() {
    return false;
  }

  getLabel(data) {
    if (!data) {
      return '';
    }

    // If they wish to show the value in read only mode, then just return the itemValue here.
    if (this.options.readOnly && this.component.readOnlyValue) {
      return this.itemValue(data);
    }

    const label = _.isObject(data.label) ? getMLValue(data.label) : this.t(data.label || data);

    // Perform a fast interpretation if we should not use the template.
    if (data && !this.component.template) {
      return label;
    }

    if (typeof data === 'string') {
      return label;
    }

    const template = this.component.template ? this.interpolate(this.component.template, { item: { ...data, label } }) : label;

    if (template) {
      const str = template.replace(/<\/?[^>]+(>|$)/g, '');
      return template.replace(str, this.t(str));
    } else {
      return JSON.stringify(data);
    }
  }

  itemTemplate(data) {
    const label = this.getLabel(data);

    if (this.viewOnly && !this.component.isSelectedValueAsText && (data.recordRef || isNodeRef(data.value))) {
      return `<a href='${createDocumentUrl(data.recordRef || data.value)}'>${label}</a>`;
    }

    return label;
  }

  /**
   * @param {*} data
   * @param {Boolean} forceUseValue default false; if true, return 'value' property of the data
   * @return {*}
   */
  itemValue(data, forceUseValue = false) {
    if (_.isObject(data)) {
      if (this.component.valueProperty) {
        return _.get(data, this.component.valueProperty);
      }

      if (forceUseValue) {
        return data.value;
      }
    }

    return data;
  }

  createInput(container) {
    this.selectContainer = container;
    this.selectInput = super.createInput(container);
  }

  /**
   * Adds an option to the select dropdown
   * @param value
   * @param label
   * @param attr
   */
  addOption(value, label, attr) {
    const option = {
      value: value,
      label: label,
      disabled: this.unavailableItems.includes(value),
      // TODO: unable to add multiple custom properties
      customProperties: this.unavailableItems.includes(value)
    };

    if (value) {
      this.selectOptions.push(option);
    }

    if (this.choices) {
      return;
    }

    option.element = document.createElement('option');

    if (this.dataValue === option.value) {
      option.element.setAttribute('selected', 'selected');
      option.element.selected = 'selected';
    }
    option.element.innerHTML = label;
    if (attr) {
      _.each(attr, (value, key) => {
        option.element.setAttribute(key, value);
      });
    }

    if (this.selectInput) {
      this.selectInput.appendChild(option.element);
    }
  }

  addValueOptions(items) {
    items = items || [];
    if (!this.selectOptions.length) {
      if (this.choices) {
        // Add the currently selected choices if they don't already exist.
        const currentChoices = Array.isArray(this.dataValue) ? this.dataValue : [this.dataValue];
        return this.addCurrentChoices(currentChoices, items);
      } else if (!this.component.multiple) {
        this.addPlaceholder(this.selectInput);
      }
    }
    return false;
  }

  /**
   * Return if the list is loading from scroll. or not.
   *
   * @return {boolean|*}
   */
  get scrollLoading() {
    return this.isScrollLoading;
  }

  /**
   * Sets the scroll loading state.
   *
   * @param isScrolling
   * @return {undefined|boolean}
   */
  set scrollLoading(isScrolling) {
    // Only continue if they are different.
    if (this.isScrollLoading === isScrolling) {
      return;
    }
    if (isScrolling) {
      this.choices.setChoices(
        [
          ...this.selectOptions,
          {
            value: '',
            label: 'Loading...',
            disabled: true
          }
        ],
        'value',
        'label',
        true
      );
    } else {
      const loadingItem = this.scrollList.querySelector('.choices__item--disabled');
      if (loadingItem) {
        // Remove the loading text.
        this.scrollList.removeChild(loadingItem);
      }
    }

    requestAnimationFrame(() => this.scrollList.scrollTo(0, this.scrollTop));

    this.isScrollLoading = isScrolling;
    return isScrolling;
  }

  stopInfiniteScroll() {
    // Remove the infinite scroll listener.
    this.scrollLoading = false;
    if (this.scrollList) {
      this.scrollList.removeEventListener('scroll', this.onScroll);
    }
  }

  /* eslint-disable max-statements */
  setItems(items, fromSearch) {
    // If the items is a string, then parse as JSON.
    if (typeof items == 'string') {
      try {
        items = JSON.parse(items);
      } catch (err) {
        console.warn(err.message);
        items = [];
      }
    }

    function isItemsContainElement(items, element) {
      return _.find(items, item => {
        if (_.isEmpty(item)) {
          return false;
        }

        if (_.isString(item)) {
          return item === element;
        }

        if (_.isArray(element) && !_.isEmpty(element)) {
          return element.includes(_.get(item, 'value'));
        }

        return _.get(item, 'value') === element;
      });
    }

    if (
      this.options.editInFormBuilder &&
      this.dataValue &&
      this.component.key === 'defaultValue' &&
      !isItemsContainElement(items, this.dataValue)
    ) {
      items = [...items];
      items.push({ label: this.dataValue, value: this.dataValue });
    }

    // Helps to remove unnecessary updates, get rid of looping
    if (_.isEmpty(items) && _.isEmpty(this.currentItems)) {
      // If the component has no refresh attributes but has some dataValue and the select is empty,
      // it needs to be set to the value of the select.
      if (_.get(this.choices, 'input.element') && this.dataValue !== this.choices.input.element.value) {
        const refreshOn = this.component.refreshOn;
        if (refreshOn && _.isArray(refreshOn) && refreshOn.length === 0) {
          this.triggerUpdate(this.dataValue);
        }
      }

      return;
    }

    const isFound = isItemsContainElement(items, this.dataValue);

    // Reset the selected value if it is not in the list
    if (this.dataValue && !isFound) {
      this.setValue('');
    }

    // Allow js processing (needed for form builder)
    if (this.component.onSetItems && typeof this.component.onSetItems === 'function') {
      const newItems = this.component.onSetItems(this, items);
      if (newItems) {
        items = newItems;
      }
    }

    if (!this.choices && this.selectInput) {
      if (this.loading) {
        this.removeChildFrom(this.selectInput, this.selectContainer);
      }

      this.selectInput.innerHTML = '';
    }

    // If they provided select values, then we need to get them instead.
    if (this.component.selectValues) {
      items = _.get(items, this.component.selectValues);
    }

    if (this.scrollLoading) {
      // Check if the first two items are equal, and if so, then we can assume that this is the same list
      // and we should skip over the loading.
      if (
        this.currentItems.length &&
        items.length &&
        _.isEqual(this.currentItems[0], items[0]) &&
        _.isEqual(this.currentItems[1], items[1])
      ) {
        this.stopInfiniteScroll();
        this.loading = false;
        return;
      }

      // If we have gone beyond our limit, then stop.
      if (items.limit && items.length < items.limit) {
        this.stopInfiniteScroll();
      }

      // Increment the loadedItems.
      this.loadedItems += items.length;
    } else {
      this.selectOptions = [];
      this.loadedItems = items.length;
    }

    this.currentItems = items;

    // Add the value options.
    if (!fromSearch) {
      this.addValueOptions(items);
    }

    if (this.component.widget === 'html5' && !this.component.placeholder) {
      this.addOption(null, '');
    }

    // Iterate through each of the items.
    _.each(items, item => {
      this.addOption(this.itemValue(item), this.itemTemplate(item));
    });

    if (this.choices) {
      this.choices.setChoices(this.selectOptions, 'value', 'label', true);
    } else if (this.loading) {
      // Re-attach select input.
      this.appendTo(this.selectInput, this.selectContainer);
    }

    // We are no longer loading.
    this.scrollLoading = false;
    this.loading = false;

    // If a value is provided, then select it.
    if (this.dataValue) {
      this.setValue(this.dataValue, true);
    } else {
      // If a default value is provided then select it.
      const defaultValue = this.defaultValue;
      if (defaultValue) {
        this.setValue(defaultValue);
      }
    }

    // Say we are done loading the items.
    this.itemsLoadedResolve();
  }
  /* eslint-enable max-statements */

  loadItems(url, search, headers, options, method, body, callback) {
    options = options || {};

    // See if they have not met the minimum search requirements.
    const minSearch = parseInt(this.component.minSearch, 10);
    if (this.component.searchField && minSearch > 0 && (!search || search.length < minSearch)) {
      // Set empty items.
      typeof callback === 'function' && callback();

      return this.setItems([]);
    }

    // Ensure we have a method and remove any body if method is get
    method = method || 'GET';
    if (method.toUpperCase() === 'GET') {
      body = null;
    }

    const limit = this.component.limit || 100;
    const skip = this.loadedItems || 0;
    const query =
      this.component.dataSrc === 'url'
        ? {}
        : {
            limit: limit,
            skip: skip
          };

    // Allow for url interpolation.
    url = this.interpolate(url, {
      formioBase: Formio.getBaseUrl(),
      search,
      limit,
      skip,
      page: Math.abs(Math.floor(skip / limit))
    });

    // Add search capability.
    if (this.component.searchField && search) {
      if (Array.isArray(search)) {
        query[`${this.component.searchField}__in`] = search.join(',');
      } else {
        query[`${this.component.searchField}__regex`] = search;
      }
    }

    // If they wish to return only some fields.
    if (this.component.selectFields) {
      query.select = this.component.selectFields;
    }

    // Add sort capability
    if (this.component.sort) {
      query.sort = this.component.sort;
    }

    if (!_.isEmpty(query)) {
      // Add the query string.
      url += (!url.includes('?') ? '?' : '&') + Formio.serialize(query, item => this.interpolate(item));
    }

    this.loading = true;

    const processItems = items => {
      if (this.component.dataPreProcessingCode) {
        return this.evaluate(this.component.dataPreProcessingCode, { queryResult: items }, 'values', true);
      }

      return items;
    };

    let resolveItems = items => {
      this.loading = false;
      const scrollTop = !this.scrollLoading && this.currentItems.length === 0;
      this.setItems(items, !!search);

      typeof callback === 'function' && callback();

      if (scrollTop && this.choices) {
        this.choices.choiceList.scrollToTop();
      }
    };

    let rejectItems = err => {
      this.stopInfiniteScroll();
      this.loading = false;
      this.itemsLoadedResolve();

      typeof callback === 'function' && callback();

      this.emit('componentError', {
        component: this.component,
        message: err.toString()
      });
      console.warn(`Unable to load resources for ${this.key}`);
    };

    let filter = this.component.filter;
    if (this.component.data.url === '/citeck/ecos/records/query' && !filter) {
      this.getRecord()
        .load('#' + this.getAttributeToEdit() + '?options')
        .then(processItems)
        .then(resolveItems)
        .catch(rejectItems);
      return;
    }

    // Add filter capability
    if (filter) {
      //customization: add filter encoding

      let filterValue = this.interpolate(filter);
      let encodedFilter = '';
      let args = filterValue.split('&');

      for (let i = 0; i < args.length; i++) {
        let argument = args[i];
        let j = i;
        while (++j < args.length && argument[argument.length - 1] === '\\') {
          argument += args[j];
          i = j;
        }
        if (encodedFilter.length > 0) {
          encodedFilter += '&';
        }
        let keyValue = argument.split('=');
        encodedFilter += keyValue[0] + '=' + encodeURIComponent(keyValue[1]);
      }

      url += (!url.includes('?') ? '?' : '&') + encodedFilter;
    }

    // Make the request.
    options.header = headers;
    Formio.makeRequest(this.options.formio, 'select', url, method, body, options).then(processItems).then(resolveItems).catch(rejectItems);
  }

  /**
   * Get the request headers for this select dropdown.
   */
  get requestHeaders() {
    // Create the headers object.
    const headers = new Formio.Headers();

    // Add custom headers to the url.
    if (this.component.data && this.component.data.headers) {
      try {
        _.each(this.component.data.headers, header => {
          if (header.key) {
            headers.set(header.key, this.interpolate(header.value));
          }
        });
      } catch (err) {
        console.warn(err.message);
      }
    }

    return headers;
  }

  getCustomItems() {
    return this.evaluate(
      this.component.data.custom,
      {
        values: []
      },
      'values'
    );
  }

  updateCustomItems() {
    this.setItems(this.getCustomItems() || []);
  }

  /* eslint-disable max-statements */
  updateItems(searchInput, forceUpdate, callback) {
    if (!this.component.data) {
      console.warn(`Select component ${this.key} does not have data configuration.`);
      this.itemsLoadedResolve();
      return;
    }

    // Only load the data if it is visible.
    if (!this.visible) {
      this.itemsLoadedResolve();
      return;
    }

    this._hasItemsBeenAlreadyLoadedOnce = true;

    switch (this.component.dataSrc) {
      case 'values':
        this.component.valueProperty = 'value';
        this.setItems(this.component.data.values);
        break;
      case 'json':
        this.setItems(this.component.data.json);
        break;
      case 'custom':
        this.updateCustomItems();
        break;
      case 'resource': {
        // If there is no resource, or we are lazyLoading, wait until active.
        if (!this.component.data.resource || (!forceUpdate && !this.active)) {
          return;
        }
        let resourceUrl = this.options.formio ? this.options.formio.formsUrl : `${Formio.getProjectUrl()}/form`;
        resourceUrl += `/${this.component.data.resource}/submission`;

        try {
          this.loadItems(resourceUrl, searchInput, this.requestHeaders);
        } catch (err) {
          console.warn(`Unable to load resources for ${this.key}`);
        }
        break;
      }
      case 'url': {
        if (!forceUpdate && !this.active) {
          // If we are lazyLoading, wait until activated.
          return;
        }
        let url = this.component.data.url;
        let method;
        let body;

        if (url.substr(0, 1) === '/') {
          let baseUrl = Formio.getProjectUrl();
          if (!baseUrl) {
            baseUrl = Formio.getBaseUrl();
          }
          url = baseUrl + this.component.data.url;
        }

        if (!this.component.data.method) {
          method = 'GET';
        } else {
          method = this.component.data.method;
          if (method.toUpperCase() === 'POST') {
            body = this.component.data.body;
          } else {
            body = null;
          }
        }
        const options = this.component.authenticate ? {} : { noToken: true };
        this.loadItems(url, searchInput, this.requestHeaders, options, method, body, callback);
        break;
      }
      default:
        console.warn('unknown src', this.component.dataSrc);
    }
  }
  /* eslint-enable max-statements */

  addPlaceholder(input) {
    if (!this.component.placeholder || !input) {
      return;
    }
    const placeholder = document.createElement('option');
    placeholder.setAttribute('placeholder', true);
    placeholder.appendChild(this.text(this.component.placeholder));
    input.appendChild(placeholder);
  }

  calculateValue(data, flag) {
    const changed = super.calculateValue(data, flag);

    // cause: https://citeck.atlassian.net/browse/ECOSUI-1584
    if (changed && !_.isEqual(this.calculatedValue, this.dataValue)) {
      if (_.isNil(this.calculatedValue)) {
        this.setValue('');
      }
    }

    return changed;
  }

  /**
   * Activate this select control.
   */
  activate() {
    if (this.active) {
      return;
    }
    this.activated = true;
    if (this.choices) {
      this.choices.setChoices(
        [
          {
            value: '',
            label: `<i class="${this.iconClass('refresh')}" style="font-size:1.3em;"></i>`
          }
        ],
        'value',
        'label',
        true
      );
    } else {
      this.addOption('', this.t('loading...'));
    }
    this.triggerUpdate();
  }

  get active() {
    return !this.component.lazyLoad || this.activated;
  }

  /* eslint-disable max-statements */
  addInput(input, container) {
    super.addInput(input, container);
    if (this.component.multiple) {
      input.setAttribute('multiple', true);
    }

    if (this.component.widget === 'html5') {
      this.triggerUpdate();
      this.focusableElement = input;
      this.addEventListener(input, 'focus', () => this.update());
      this.addEventListener(input, 'keydown', event => {
        const { keyCode } = event;

        if ([8, 46].includes(keyCode)) {
          this.setValue(null);
        }
      });
      return;
    }

    const useSearch = this.component.hasOwnProperty('searchEnabled') ? this.component.searchEnabled : true;
    const placeholderValue = this.t(this.component.placeholder);
    let customOptions = this.component.customOptions || {};
    if (typeof customOptions == 'string') {
      try {
        customOptions = JSON.parse(customOptions);
      } catch (err) {
        console.warn(err.message);
        customOptions = {};
      }
    }

    const choicesOptions = {
      removeItemButton: this.component.disabled ? false : _.get(this.component, 'removeItemButton', true),
      itemSelectText: '',
      classNames: {
        containerOuter: 'choices form-group formio-choices',
        containerInner: 'form-control'
      },
      addItemText: false,
      placeholder: !!this.component.placeholder,
      placeholderValue: placeholderValue,
      noResultsText: this.t('No results found'),
      noChoicesText: this.t('No choices to choose from'),
      searchPlaceholderValue: this.t('Type to search'),
      shouldSort: false,
      position: this.component.dropdown || 'auto',
      searchEnabled: useSearch,
      searchChoices: !this.component.searchField,
      fuseOptions: Object.assign(
        {
          include: 'score',
          threshold: _.get(this, 'component.searchThreshold', 0.3)
        },
        _.get(this, 'component.fuseOptions', {})
      ),
      itemComparer: _.isEqual,
      callbackOnCreateTemplates: template => {
        return {
          choice: (classNames, data, itemSelectText) => {
            // label is wrapped in template
            const labelInTemplate = data.label;
            const htmlElement = document.createElement('div');
            htmlElement.innerHTML = labelInTemplate;
            const pureLabel = htmlElement.innerText;

            return template(`
              <div title="${pureLabel}" class="${classNames.item} ${classNames.itemChoice} ${
                data.disabled ? classNames.itemDisabled : classNames.itemSelectable
              }" data-select-text="${itemSelectText}" data-choice ${
                data.disabled ? 'data-choice-disabled aria-disabled="true"' : 'data-choice-selectable'
              } data-id="${data.id}" data-value="${data.value}" ${data.groupId > 0 ? 'role="treeitem"' : 'role="option"'}>
                ${data.label}
              </div>
            `);
          }
        };
      },
      ...customOptions
    };

    const tabIndex = input.tabIndex;
    this.addPlaceholder(input);
    input.setAttribute('dir', this.i18next.dir());
    this.choices = new Choices(input, choicesOptions);

    if (this.component.multiple) {
      this.focusableElement = this.choices.input.element;
    } else {
      this.focusableElement = this.choices.containerInner.element;
      this.choices.containerOuter.element.setAttribute('tabIndex', '-1');
      if (useSearch) {
        this.addEventListener(this.choices.containerOuter.element, 'focus', () => this.focusableElement.focus());
      }
    }

    this.scrollList = this.choices.choiceList.element;
    this.onScroll = () => {
      if (!this.scrollLoading && this.scrollList.scrollTop + this.scrollList.clientHeight >= this.scrollList.scrollHeight) {
        this.scrollTop = this.scrollList.scrollTop;
        this.scrollLoading = true;
        this.triggerUpdate(this.choices.input.element.value);
      }
    };
    this.scrollList.addEventListener('scroll', this.onScroll);

    this.addFocusBlurEvents(this.focusableElement);
    this.focusableElement.setAttribute('tabIndex', tabIndex);

    this.setInputStyles(this.choices.containerOuter.element);

    // If a search field is provided, then add an event listener to update items on search.
    if (this.component.searchField) {
      // Make sure to clear the search when no value is provided.
      if (this.choices && this.choices.input && this.choices.input.element) {
        this.addEventListener(this.choices.input.element, 'input', event => {
          if (!event.target.value) {
            this.triggerUpdate();
          }
        });
      }
      this.addEventListener(input, 'search', event => this.triggerUpdate(event.detail.value));
      this.addEventListener(input, 'stopSearch', () => this.triggerUpdate());
    }

    this.addEventListener(input, 'showDropdown', () => {
      if (this.dataValue) {
        this.triggerUpdate();
      }
      this.update();
    });

    if (placeholderValue && this.choices._isSelectOneElement) {
      this.addEventListener(input, 'removeItem', () => {
        const items = this.choices._store.activeItems;

        if (!items.length) {
          this.choices._addItem({
            value: placeholderValue,
            label: placeholderValue,
            choiceId: 0,
            groupId: -1,
            customProperties: null,
            placeholder: true,
            keyCode: null
          });
        }
      });
    }

    if (this.component.multiple) {
      let selected;
      const inputPlaceholder = this.choices.containerInner.element.querySelector('input[type=text]');
      inputPlaceholder.style.opacity = '0.7';
      inputPlaceholder.style.minWidth = 'fit-content';

      this.choices.passedElement.element.addEventListener(
        'addItem',
        () => {
          selected = this.choices.passedElement.element.selectedOptions.length;
          if (selected) {
            inputPlaceholder.removeAttribute('placeholder');
          }
        },
        false
      );

      this.choices.passedElement.element.addEventListener(
        'removeItem',
        () => {
          selected = this.choices.passedElement.element.selectedOptions.length;
          if (!selected) {
            inputPlaceholder.setAttribute('placeholder', placeholderValue);
          }
        },
        false
      );
    }

    // Add value options.
    if (this.addValueOptions()) {
      this.restoreValue();
    }

    this.addEventListener(input, 'change', () => {
      if (_.get(this.choices, '_store.activeItems', []).length === 0) {
        this.deleteValue();
        this.refresh('');
      }
    });

    // Force the disabled state with getters and setters.
    // eslint-disable-next-line no-self-assign
    this.disabled = this.disabled;
    this.triggerUpdate();
  }

  /* eslint-enable max-statements */

  update() {
    if (this.component.dataSrc === 'custom') {
      this.updateCustomItems();
    }

    // Activate the control.
    this.activate();
  }

  set disabled(disabled) {
    super.disabled = disabled;
    if (!this.choices) {
      return;
    }
    if (disabled) {
      this.setDisabled(this.choices.containerInner.element, true);
      this.focusableElement.removeAttribute('tabIndex');
      this.choices.disable();
    } else {
      this.setDisabled(this.choices.containerInner.element, false);
      this.focusableElement.setAttribute('tabIndex', this.component.tabindex || 0);
      this.choices.enable();
    }
  }

  show(show) {
    // If we go from hidden to visible, trigger a refresh.
    const triggerUpdate = show && this._visible !== show;
    show = super.show(show);
    if (triggerUpdate) {
      this.triggerUpdate();
    }
    return show;
  }

  /**
   *
   * @param {Array} values
   * @param {Array} items
   * @param {String} keyValue
   * @returns {Boolean}
   */
  addCurrentChoices(values, items, keyValue) {
    if (!values) {
      return false;
    }
    const notFoundValuesToAdd = [];
    const added = values.reduce((defaultAdded, value) => {
      if (!value) {
        return defaultAdded;
      }
      let found = false;

      // Make sure that `items` and `this.selectOptions` points
      // to the same reference. Because `this.selectOptions` is
      // internal property and all items are populated by
      // `this.addOption` method, we assume that items has
      // 'label' and 'value' properties. This assumption allows
      // us to read correct value from the item.
      const isSelectOptions = items === this.selectOptions;
      if (items && items.length) {
        _.each(items, choice => {
          if (choice._id && value._id && choice._id === value._id) {
            found = true;
            return false;
          }
          const itemValue = keyValue ? choice.value : this.itemValue(choice, isSelectOptions);
          found |= _.isEqual(itemValue, value);
          return found ? false : true;
        });
      }

      // Add the default option if no item is found.
      if (!found) {
        notFoundValuesToAdd.push({
          value: this.itemValue(value),
          label: this.itemTemplate(value)
        });
        return true;
      }
      return found || defaultAdded;
    }, false);

    return added;
  }

  getView(data) {
    return this.component.multiple && Array.isArray(data) ? data.map(this.asString.bind(this)).join(', ') : this.asString(data);
  }

  getValue() {
    if (this.viewOnly || this.loading || !this.selectOptions.length) {
      return this.dataValue;
    }
    let value = '';
    if (this.choices) {
      value = this.choices.getValue(true);

      // Make sure we don't get the placeholder
      if (!this.component.multiple && this.component.placeholder && value === this.t(this.component.placeholder)) {
        value = '';
      }
    } else {
      const values = [];
      _.each(this.selectOptions, selectOption => {
        if (selectOption.element && selectOption.element.selected) {
          values.push(selectOption.value);
        }
      });
      value = this.component.multiple ? values : values.shift();
    }
    // Choices will return undefined if nothing is selected. We really want '' to be empty.
    if (value === undefined || value === null) {
      value = '';
    }
    return value;
  }

  redraw() {
    super.redraw();
    this.triggerUpdate();
  }

  setValue(value, flags) {
    if (_.isUndefined(value)) {
      return false;
    }

    if (value === null) {
      value = this.emptyValue;
    }

    flags = this.getFlags.apply(this, arguments);
    const previousValue = this.dataValue;
    if (this.component.multiple && !Array.isArray(value)) {
      value = value ? [value] : [];
    }
    const hasPreviousValue = Array.isArray(previousValue) ? previousValue.length : previousValue;
    const hasValue = Array.isArray(value) ? value.length : value;
    const changed = this.hasChanged(value, previousValue);
    this.dataValue = value;

    // Do not set the value if we are loading... that will happen after it is done.
    if (this.loading) {
      return changed;
    }

    // Determine if we need to perform an initial lazyLoad api call if searchField is provided.
    if (
      this.component.searchField &&
      this.component.lazyLoad &&
      !this.lazyLoadInit &&
      !this.active &&
      !this.selectOptions.length &&
      hasValue
    ) {
      this.loading = true;
      this.lazyLoadInit = true;
      this.triggerUpdate(this.dataValue, true);
      return changed;
    }

    // Add the value options.
    this.addValueOptions();

    if (this.choices) {
      // Now set the value.
      if (hasValue) {
        this.choices.removeActiveItems();
        // Add the currently selected choices if they don't already exist.
        const currentChoices = Array.isArray(this.dataValue) ? this.dataValue : [this.dataValue];
        if (!this.addCurrentChoices(currentChoices, this.selectOptions, true)) {
          this.choices.setChoices(this.selectOptions, 'value', 'label', true);
        }
        if (Array.isArray(this.selectOptions) && this.selectOptions.length > 0) {
          // TODO check it
          this.choices.setChoiceByValue(value);
        }
      } else if (hasPreviousValue) {
        this.choices.removeActiveItems();
      }
    } else {
      if (hasValue) {
        const values = Array.isArray(value) ? value : [value];
        _.each(this.selectOptions, selectOption => {
          _.each(values, val => {
            if (_.isEqual(val, selectOption.value)) {
              selectOption.element.selected = true;
              selectOption.element.setAttribute('selected', 'selected');
              return false;
            }
          });
        });
      } else {
        _.each(this.selectOptions, selectOption => {
          if (selectOption.element) {
            selectOption.element.selected = false;
            selectOption.element.removeAttribute('selected');
          }
        });
      }
    }

    this.updateOnChange(flags, changed);
    return changed;
  }

  /**
   * Deletes the value of the component.
   */
  deleteValue() {
    this.setValue('', {
      noUpdateEvent: true
    });
    _.unset(this.data, this.key);
  }

  /**
   * Check if a component is eligible for multiple validation
   *
   * @return {boolean}
   */
  validateMultiple() {
    // Select component will contain one input when flagged as multiple.
    return false;
  }

  /**
   * Output this select dropdown as a string value.
   * @return {*}
   */
  asString(value) {
    value = value || this.getValue();

    if (['values', 'custom', 'url'].includes(this.component.dataSrc)) {
      let items;
      let valueProperty;

      switch (this.component.dataSrc) {
        case 'values':
          items = this.component.data.values;
          valueProperty = 'value';
          break;
        case 'custom':
          items = this.getCustomItems();
          valueProperty = this.component.valueProperty;
          break;
        case 'url':
        default:
          items = this.currentItems;
          valueProperty = this.component.valueProperty;
          break;
      }

      value =
        this.component.multiple && Array.isArray(value)
          ? _.filter(items, item => value.includes(item[valueProperty]))
          : valueProperty
            ? _.find(items, [valueProperty, value])
            : value;
    }

    if (_.isString(value)) {
      return value;
    }

    if (Array.isArray(value)) {
      const items = [];
      value.forEach(item => items.push(this.itemTemplate(item)));
      return items.length > 0 ? items.join('<br />') : '-';
    }

    return !_.isNil(value) ? this.itemTemplate(value) : '-';
  }

  setupValueElement(element) {
    if (this.component.unreadable) {
      this.setUnreadableLabel(element);
      return;
    }

    element.innerHTML = this.asString();
  }

  destroy() {
    if (this.choices) {
      this.choices.destroyed = true;
      this.choices.destroy();
      this.choices = null;
    }

    return super.destroy();
  }

  focus() {
    this.focusableElement.focus();
  }

  attachRefreshEvent(refreshData) {
    this.on(
      'change',
      () => {
        if (this.component.allowCalculateOverride && this.calculatedValue !== this.dataValue) {
          return;
        }

        if (!this.hasOwnProperty('refreshOnValue')) {
          return;
        }

        this.refresh(refreshData === 'data' ? this.data : this.data[refreshData], refreshData);
      },
      true
    );

    this.on(
      'componentChange',
      event => {
        if (refreshData !== 'data' && event && event.component && event.component.key === refreshData && this.inContext(event.instance)) {
          this.refresh(event.value, refreshData); // Cause https://citeck.atlassian.net/browse/ECOSCOM-2465
        }
      },
      true
    );
  }

  isElementOrParentsHidden() {
    let current = this;

    while (!!current) {
      if (_.get(current, 'element.hidden') === true) {
        return true;
      }
      current = _.get(current, 'parent', null);
    }

    return false;
  }

  refresh(value, refreshOnKey) {
    // Cause https://citeck.atlassian.net/browse/ECOSCOM-2465
    if (this.hasOwnProperty('refreshOnValue')) {
      this.refreshOnChanged = !_.isEqual(value, this.refreshOnValue[refreshOnKey]);
      this.refreshOnValue[refreshOnKey] = value;
    } else {
      this.refreshOnChanged = true;
      this.refreshOnValue = {
        [refreshOnKey]: value
      };
    }

    if (this.refreshOnChanged && !this.isElementOrParentsHidden()) {
      if (this.component.clearOnRefresh) {
        this.setValue(null);
      }

      this.triggerRedraw();
    }
  }

  static optimizeSchema(comp) {
    return {
      ...comp,
      data: _.omitBy(comp.data, (value, key) => key !== comp.dataSrc && key !== 'headers')
    };
  }
}
