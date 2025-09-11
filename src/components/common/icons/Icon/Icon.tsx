import classNames from 'classnames';
import isFunction from 'lodash/isFunction';
import React, { Component } from 'react';

import './Icon.scss';

interface IconProps extends React.HTMLProps<HTMLElement> {
  className?: string;
}

export default class Icon extends Component<IconProps> {
  static defaultProps = {
    className: ''
  };

  render() {
    const { className, ...props } = this.props;
    const cssClasses = classNames('icon', className, {
      icon_btn: isFunction(props.onClick)
    });

    return <i {...props} className={cssClasses} />;
  }
}
