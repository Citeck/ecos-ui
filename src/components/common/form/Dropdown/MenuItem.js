import React from 'react';
import classNames from 'classnames';
import isFunction from 'lodash/isFunction';

export default class MenuItem extends React.PureComponent {
  onClick = () => {
    const { onClick, item } = this.props;

    isFunction(onClick) && onClick(item);
  };

  render() {
    const { children, className, selected, id } = this.props;

    return (
      <li id={id} className={classNames({ [className]: className, selected })} onClick={this.onClick}>
        {children}
      </li>
    );
  }
}
