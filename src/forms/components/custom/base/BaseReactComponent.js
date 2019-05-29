import BaseComponent from './BaseComponent';
import ReactDOM from 'react-dom';
import React from 'react';
import RawHtmlWrapper from '../../../../components/common/RawHtmlWrapper';

export default class BaseReactComponent extends BaseComponent {
  build() {
    this.onReactValueChanged = value => {
      this.setValue(value, { skipReactWrapperUpdating: true });
    };

    this.react = {};

    if (this.viewOnly) {
      return this.viewOnlyBuild();
    }

    this.react.wrapper = new Promise(resolveComponent => {
      this.react.resolve = resolveComponent;
    }).then(component => {
      this.react.wrapper = component;
      this.react.resolve = null;
      return component;
    });

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

    // this.attachLogic();
  }

  createViewOnlyValue(container) {
    this.react.container = this.ce('dd');
    container.appendChild(this.react.container);
    this.renderReactComponent();
  }

  updateReactComponent(updateFunc) {
    if (this.react.resolve) {
      this.react.wrapper.then(w => {
        updateFunc(w.getComponent());
      });
    } else {
      updateFunc(this.react.wrapper.getComponent());
    }
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
      this.react.wrapper.setProps(props);
    }
  }

  viewOnlyBuild() {}

  getComponentToRender() {
    throw new Error('Component to render is not specified!');
  }

  getInitialReactProps() {
    return {};
  }

  renderReactComponent() {
    if (this.react.resolve) {
      const render = props => {
        ReactDOM.render(
          <RawHtmlWrapper component={this.getComponentToRender()} ref={this.react.resolve} props={props} />,
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
  }

  get emptyValue() {
    return this.component.multiple ? [] : null;
  }

  getValue() {
    return this.dataValue;
  }

  setReactValue(component, value) {
    if (component.setValue) {
      component.setValue(value);
    } else {
      throw new Error('Your component should has setValue method or custom updateReactValue implementation');
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
    if (value === undefined || value === null) {
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
