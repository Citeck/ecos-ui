import React from 'react';
import moment from 'moment';
import DefaultGqlFormatter from './DefaultGqlFormatter';
import { DateEditor } from '../../editors';
import { fromISO8601 } from '../../../../../helpers/util';

const DATE_FORMAT = 'DD.MM.YYYY';
const DATE_TIME_FORMAT = 'DD.MM.YYYY HH:mm';
const EDITOR_DATE_TIME__FORMAT = 'dd.MM.YYYY HH:mm';

export default class DateTimeFormatter extends DefaultGqlFormatter {
  static getEditor(editorProps, value) {
    return <DateEditor {...editorProps} value={value} dateFormat={EDITOR_DATE_TIME__FORMAT} />;
  }

  render() {
    const { cell, params } = this.props;
    const patternDate = params.patternDate || DATE_FORMAT;
    const patternDateTime = params.patternDateTime || DATE_TIME_FORMAT;

    let date = '';

    if (cell) {
      date = fromISO8601(cell);

      const hours = date.getHours();
      const minutes = date.getMinutes();
      const seconds = date.getSeconds();
      const pattern = hours === 0 && minutes === 0 && seconds === 0 ? patternDate : patternDateTime;

      date = moment(cell).format(pattern);
    }

    return <this.PopperWrapper text={date} />;
  }
}
