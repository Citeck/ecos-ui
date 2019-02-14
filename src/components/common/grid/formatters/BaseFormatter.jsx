import React, { Fragment, Component } from 'react';

export default class BaseFormatter extends Component {
  static getFilterValue(cell) {
    return this.prototype.value(cell);
  }

  value(cell) {
    return cell || '';
  }

  render() {
    return <Fragment>{this.value(this.props.cell)}</Fragment>;
  }
}
