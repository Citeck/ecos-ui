import React from 'react';
import ReactDOM from 'react-dom';

import BaseComponent from './BaseComponent';
import RawHtmlWrapper from '../../../../components/common/RawHtmlWrapper';

export default class BaseReactComponent extends BaseComponent {
  static schema(...extend) {
    return BaseComponent.schema(
      {
        defaultValue: ''
      },
      ...extend
    );
  }

  build() {
    this.onReactValueChanged = value => {
      this.setPristine(false);
      this.setValue(value, { skipReactWrapperUpdating: true });
    };

    this.react = {};

    this.react.wrapper = new Promise(resolveComponent => {
      this.react.resolve = resolveComponent;
    }).then(component => {
      this.react.wrapper = component;
      this.react.resolve = null;
      return component;
    });
    this.react.innerPromise = new Promise(innerResolve => {
      this.react.innerResolve = innerResolve;
    }).then(comp => {
      this.react.innerResolve = null;
      return comp;
    });

    if (this.viewOnly) {
      return this.viewOnlyBuild();
    }

    this.restoreValue();

    this.createElement();

    const labelAtTheBottom = this.component.labelPosition === 'bottom';
    if (!labelAtTheBottom) {
      this.createLabel(this.element);
    }

    this.react.container = this.ce('div');
    this.element.appendChild(this.react.container);

    if (this.shouldDisable) {
      this.disabled = true;
    }

    this.errorContainer = this.element;
    this.createErrorElement();

    this.renderReactComponent();

    // this.setInputStyles(this.inputsContainer);

    if (labelAtTheBottom) {
      this.createLabel(this.element);
    }

    this.createDescription(this.element);

    this.createInlineEditSaveAndCancelButtons();

    this.attachRefreshOn();
    // this.autofocus();
    this.attachLogic();
  }

  createViewOnlyValue(container) {
    this.react.container = this.ce('dd');
    container.appendChild(this.react.container);
    this.createInlineEditButton(container);
    this.renderReactComponent();
  }

  updateReactComponent(updateFunc) {
    this.react.innerPromise.then(comp => {
      updateFunc(comp);
    });
  }

  setReactProps(props) {
    if (this.react.resolve) {
      this.react.waitingProps = {
        ...(this.react.waitingProps || {}),
        props
      };
      this.react.wrapper.then(w => {
        w.setProps(this.react.waitingProps);
        this.react.waitingProps = {};
      });
    } else {
      // is this checking required?
      if (this.react.wrapper) {
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

  renderReactComponent() {
    if (this.react.resolve) {
      const render = props => {
        this.react.isMounted = false;
        this.react.innerComponent = null;

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
            component={this.getComponentToRender()}
            ref={this.react.resolve}
            props={props}
          />,
          this.react.container
        );
      };

      let props = this.getInitialReactProps();

      if (props.then) {
        props.then(render);
      } else {
        render(props);
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

  get emptyValue() {
    return this.component.multiple ? [] : '';
  }

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
    if (component.setValue) {
      component.setValue(value);
    } else {
      throw new Error('Your component should has setValue method or custom setReactValue implementation');
    }
  }

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
      this.updateReactComponent(component => {
        this.setReactValue(component, this.dataValue);
      });
    }

    return changed;
  }
}
