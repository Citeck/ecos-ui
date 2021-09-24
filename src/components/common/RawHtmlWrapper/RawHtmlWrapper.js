import React, { Component } from 'react';
import get from 'lodash/get';
import isEqual from 'lodash/isEqual';

export default class RawHtmlWrapper extends Component {
  constructor(props) {
    super(props);

    if (!props.component) {
      throw new Error('Component is a mandatory parameter!');
    }

    this.state = {
      props: props.props,
      component: props.component
    };
  }

  componentDidMount() {
    if (this.props.onMounted) {
      this.props.onMounted();
    }
  }

  setProps(props) {
    this.setState(state => ({ props: { ...state.props, ...props } }));
  }

  setComponent(component) {
    this.setState({ component });
  }

  resolveComponent = component => {
    if (this.props.onComponentLoaded) {
      this.props.onComponentLoaded(component);
    }
  };

  shouldComponentUpdate(nextProps, nextState, nextContext) {
    return !isEqual(nextState.props, this.state.props);
  }

  render() {
    let self = this;
    let props = {
      ...this.state.props,
      setWrapperProps: p => this.setProps(p)
    };

    // detect functional component
    const componentRender = get(this, 'state.component.prototype.render');

    if (!componentRender) {
      self.resolveComponent(this);

      return <this.state.component {...props} />;
    }

    return <this.state.component {...props} ref={self.resolveComponent} />;
  }
}
