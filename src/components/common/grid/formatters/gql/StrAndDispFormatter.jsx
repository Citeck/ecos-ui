import React from 'react';
import get from 'lodash/get';

import DefaultGqlFormatter from './DefaultGqlFormatter';

export default class StrAndDispFormatter extends DefaultGqlFormatter {
  static getQueryString(attribute) {
    return `.att(n:"${attribute}"){str,disp}`;
  }

  static getFilterValue(cell) {
    cell = get(cell, '[0]') || cell;
    return get(cell, 'disp', '');
  }

  value() {
    let cell = this.props.cell || {};
    return get(cell, '[0].disp') || cell.disp || '';
  }

  render() {
    return <>{this.value()}</>;
  }
}
