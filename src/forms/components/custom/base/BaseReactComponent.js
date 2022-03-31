import React from 'react';
import ReactDOM from 'react-dom';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import get from 'lodash/get';
import pick from 'lodash/pick';

import RawHtmlWrapper from '../../../../components/common/RawHtmlWrapper';
import UnreadableLabel from '../../UnreadableLabel';
import BaseComponent from './BaseComponent';

export default class BaseReactComponent extends BaseComponent {
  static schema(...extend) {
    return BaseComponent.schema(
      {
        defaultValue: ''
      },
      ...extend
    );
  }

  react = {};
  #viewOnlyPrev = {};
  #refreshOnValuePrev = {};

  get isShowElement() {
    if (this.options.builder) {
      return true;
    }

    return !Boolean(this.component.hidden) && this.checkConditions();
  }

  get htmlAttributes() {
    return {
      ...pick(get(this, 'info.attr', {}), ['id', 'name', 'type']),
      disabled: this.disabled
    };
  }

  get emptyValue() {
    return this.component.multiple ? [] : '';
  }

  build() {
    if (
      !isEqual(this.#viewOnlyPrev, this.viewOnly) ||
      (!isEmpty(this.refreshOnValue) && !isEqual(this.#refreshOnValuePrev, this.refreshOnValue))
    ) {
      super.clear();
      this.react = {};
      this.#viewOnlyPrev = this.viewOnly;
      this.#refreshOnValuePrev = this.refreshOnValue;
    }

    const firstBuild = isEmpty(this.react);

    this.react.wrapper = new Promise(resolveComponent => (this.react.resolve = resolveComponent)).then(component => {
      this.react.wrapper = component;
      this.react.resolve = null;

      return component;
    });

    this.react.innerPromise = new Promise(innerResolve => (this.react.innerResolve = innerResolve)).then(component => {
      this.react.innerResolve = null;

      return component;
    });

    if (this.viewOnly) {
      return this.viewOnlyBuild();
    }

    this.restoreValue();
    this.createElement();

    const labelAtTheBottom = this.component.labelPosition === 'bottom';
    if (!labelAtTheBottom && firstBuild) {
      this.createLabel(this.element);
    }

    if (this.shouldDisable) {
      this.disabled = true;
    }

    this.embedReactContainer(this.element, 'div');
    this.renderReactComponent(firstBuild);

    if (firstBuild) {
      this.errorContainer = this.element;
      this.createErrorElement();

      if (labelAtTheBottom) {
        this.createLabel(this.element);
      }

      this.createDescription(this.element);
      this.createInlineEditSaveAndCancelButtons();
      this.attachRefreshOn();
      this.attachLogic();
    } else {
      this.updateDescription();
    }

    this.showElement(this.isShowElement);

    if (!this.isShowElement && this.component.clearOnHide) {
      this.dataValue = this.emptyValue;
    }
  }

  // Cause: https://citeck.atlassian.net/browse/ECOSUI-1506
  updateDescription() {
    if (!this.description) {
      this.createDescription(this.element);
      return;
    }

    // Cause: https://citeck.atlassian.net/browse/ECOSUI-1558
    this.description.innerHTML = this.t(this.component.description);
  }

  embedReactContainer(container, tag) {
    if (!this.react.container) {
      this.react.container = this.ce(tag);
      container.appendChild(this.react.container);
    }
  }

  createViewOnlyValue(container) {
    this.embedReactContainer(container, 'dd');
    this.createInlineEditButton(container);
    this.renderReactComponent();
  }

  updateReactComponent(updateFunc) {
    this.react.innerPromise.then(comp => {
      if (typeof updateFunc === 'function') {
        updateFunc(comp);
      }
    });
  }

  replaceReactComponent(component) {
    this.react.wrapper.setComponent(component);
  }

  setReactProps(props) {
    if (!isEmpty(this.react.resolve)) {
      this.react.waitingProps = { ...(this.react.waitingProps || {}), ...props };

      !isEmpty(this.react.wrapper) &&
        this.react.wrapper.then(w => {
          w.setProps(this.react.waitingProps);
          this.react.waitingProps = {};
        });
    } else {
      // is this checking required?
      if (!isEmpty(this.react.wrapper)) {
        this.react.wrapper.setProps(props);
      }
    }
  }

  getComponentToRender() {
    throw new Error('Component to render is not specified!');
  }

  getInitialReactProps() {
    return {};
  }

  renderReactComponent(firstBuild = true) {
    const component = this.component.unreadable ? UnreadableLabel : this.getComponentToRender();

    if (this.react.resolve) {
      const doRender = (props = {}) => {
        const updateLoadingState = () => {
          if (this.react.isMounted && this.react.innerComponent && this.react.innerResolve) {
            this.react.innerResolve(this.react.innerComponent);
          }
        };

        ReactDOM.render(
          <RawHtmlWrapper
            onMounted={() => {
              this.react.isMounted = true;
              updateLoadingState();
            }}
            onComponentLoaded={comp => {
              this.react.innerComponent = comp;
              updateLoadingState();
            }}
            component={component}
            ref={this.react.resolve}
            props={props}
          />,
          this.react.container
        );

        if (!firstBuild && !isEqual(this.react.innerComponent.props, props)) {
          this.setReactProps(props);
        }
      };

      let props = this.getInitialReactProps();

      if (props.then) {
        props.then(doRender);
      } else {
        doRender(props);
      }
    }
  }

  destroy() {
    if (this.react.container) {
      ReactDOM.unmountComponentAtNode(this.react.container);
      this.react.wrapper = null;
    }

    return super.destroy();
  }

  clear() {}

  /**
   * Check if a component is eligible for multiple validation (Cause: https://citeck.atlassian.net/browse/ECOSCOM-2489)
   *
   * @return {boolean}
   */
  validateMultiple() {
    return false;
  }

  getValue() {
    return this.dataValue;
  }

  setReactValue(component, value) {
    if (this.component.unreadable) {
      return;
    }

    if (component.setValue) {
      component.setValue(value);
    } else {
      throw new Error('Your component should has setValue method or custom setReactValue implementation');
    }
  }

  onReactValueChanged = (value, addFlags = {}) => {
    if (isEqual(value, this.dataValue)) {
      return;
    }

    this.setPristine(false);
    this.updateValue({ skipReactWrapperUpdating: true, ...addFlags }, value);
  };

  setValue(value, flags) {
    flags = this.getFlags.apply(this, arguments);
    this.updateValue(flags, value);
  }

  updateValue(flags, value) {
    if (!this.hasInput) {
      return false;
    }

    flags = flags || {};
    let newValue = value;

    /*if (!this.visible && this.component.clearOnHide) {
      newValue = this.dataValue;
    } else */
    if (value === undefined) {
      newValue = this.getValue(flags);
    }

    let changed = newValue !== undefined ? this.hasChanged(newValue, this.dataValue) : false;
    this.dataValue = newValue;

    if (this.viewOnly) {
      this.updateViewOnlyValue(newValue);
    }

    this.updateOnChange(flags, changed);

    if (!flags.skipReactWrapperUpdating && changed) {
      this.updateReactComponent(component => this.setReactValue(component, this.dataValue));
    }

    return changed;
  }
}
