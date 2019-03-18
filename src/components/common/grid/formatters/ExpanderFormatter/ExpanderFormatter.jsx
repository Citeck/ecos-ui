import React, { Component } from 'react';
import classNames from 'classnames';

import './ExpanderFormatter.scss';

export default class ExpanderFormatter extends Component {
  _onClick = () => {
    this.props.onClick(this.props.rowIndex);
  };

  render() {
    return <i className={classNames('grid-expander', this.props.expand ? 'icon-down' : 'icon-right')} onClick={this._onClick} />;
  }
}
