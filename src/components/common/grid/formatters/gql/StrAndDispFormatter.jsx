import React, { Fragment } from 'react';
import DefaultGqlFormatter from './DefaultGqlFormatter';

export default class StrAndDispFormatter extends DefaultGqlFormatter {
  static getQueryString(attribute) {
    return `.att(n:"${attribute}"){str,disp}`;
  }

  value(cell) {
    return cell.disp || '';
  }

  render() {
    let props = this.props;
    let cell = props.cell || {};

    return <Fragment>{this.value(cell)}</Fragment>;
  }
}
