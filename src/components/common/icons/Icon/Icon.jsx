import React, { Component } from 'react';
import classNames from 'classnames';

import './Icon.scss';
import PropTypes from 'prop-types';

export default class Icon extends Component {
  static propTypes = {
    className: PropTypes.string
  };

  static defaultProps = {
    className: ''
  };

  render() {
    const { className, ...props } = this.props;
    const cssClasses = classNames('icon', className);

    return <i {...props} className={cssClasses} />;
  }
}
