import React from 'react';
import PropTypes from 'prop-types';

import DefaultGqlFormatter from './DefaultGqlFormatter';

class ActionFormatter extends DefaultGqlFormatter {
  static propTypes = {
    className: PropTypes.string
  };

  static defaultProps = {
    className: ''
  };

  state = {};

  componentDidMount() {}

  onClick = () => {};

  render() {
    console.log(this.props);
    return <>Hi</>;
  }
}

export default ActionFormatter;
