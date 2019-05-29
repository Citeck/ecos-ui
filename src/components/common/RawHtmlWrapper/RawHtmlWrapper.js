import isEqual from 'lodash/isEqual';
import React, { Component } from 'react';

export default class RawHtmlWrapper extends Component {
  constructor(props) {
    super(props);

    if (!props.component) {
      throw new Error('Component is a mandatory parameter!');
    }

    this.state = {
      props: props.props
    };
  }

  componentDidMount() {
    if (this.props.onMounted) {
      this.props.onMounted();
    }
  }

  setProps(props) {
    this.setState({
      props: {
        ...this.state.props,
        ...props
      }
    });
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
    return <this.props.component {...self.state.props} ref={self.resolveComponent} />;
  }
}
