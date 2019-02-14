import React, { Fragment } from 'react';
import DefaultGqlFormatter from './defaultGqlFormatter';

export default class DateTimeFormatter extends DefaultGqlFormatter {
  _format(value, params) {
    const date = window.Alfresco.util.fromISO8601(value);

    const format = params.format || 'dd.MM.yyyy HH:mm:ss';

    console.log(date.toString(format));

    return value;
  }

  render() {
    let { cell, params } = this.props;
    return <Fragment>{this._format(this.value(cell), params)}</Fragment>;
  }
}
