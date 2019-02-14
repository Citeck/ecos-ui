import React, { Fragment } from 'react';
import moment from 'moment';
import DefaultGqlFormatter from './DefaultGqlFormatter';

export default class DateTimeFormatter extends DefaultGqlFormatter {
  _format(value, params) {
    const format = params.format || 'DD.MM.YYYY HH:mm:ss';
    return value ? moment(value).format(format) : '';
  }

  render() {
    let { cell, params } = this.props;
    return <Fragment>{this._format(this.value(cell), params)}</Fragment>;
  }
}
