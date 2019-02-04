import React, { Fragment } from 'react';
import DefaultGqlFormatter from './defaultGqlFormatter';

export default class DateTimeFormatter extends DefaultGqlFormatter {
  _format(value, params) {
    const date = new Date(value);
    const format = params.format || 'dd.MM.yyyy HH:mm:ss';

    return date.toString(format);
  }

  render() {
    let { cell, params } = this.props;

    return <Fragment>{this._format(this.value(cell), params)}</Fragment>;
  }
}
