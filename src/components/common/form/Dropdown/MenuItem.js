import React from 'react';
import isFunction from 'lodash/isFunction';

export default class MenuItem extends React.PureComponent {
  onClick = () => {
    const { onClick, item } = this.props;

    isFunction(onClick) && onClick(item);
  };

  render() {
    return <li onClick={this.onClick}>{this.props.children}</li>;
  }
}
