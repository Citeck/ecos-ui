import React, { Fragment } from 'react';
import moment from 'moment';
import DefaultGqlFormatter from './DefaultGqlFormatter';

export default class DateTimeFormatter extends DefaultGqlFormatter {
  render() {
    const { cell, params } = this.props;
    const patternDate = params.patternDate || 'DD.MM.YYYY';
    const patternDateTime = params.patternDateTime || 'DD.MM.YYYY HH:mm';

    let date = '';

    if (cell) {
      date = window.Alfresco.util.fromISO8601(cell);

      const hours = date.getHours();
      const minutes = date.getMinutes();
      const seconds = date.getSeconds();
      const pattern = hours === 0 && minutes === 0 && seconds === 0 ? patternDate : patternDateTime;

      date = moment(cell).format(pattern);
    }

    return <Fragment>{date}</Fragment>;
  }
}
