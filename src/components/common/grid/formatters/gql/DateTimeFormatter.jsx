import React from 'react';
import moment from 'moment';

import DefaultGqlFormatter from './DefaultGqlFormatter';
import { DateEditor } from '../../editors';

const FORMAT = 'DD.MM.YYYY HH:mm';
const EDITOR_FORMAT = 'dd.MM.YYYY HH:mm';

export default class DateTimeFormatter extends DefaultGqlFormatter {
  static getEditor(editorProps, value) {
    return <DateEditor {...editorProps} value={value} dateFormat={EDITOR_FORMAT} />;
  }

  render() {
    const { cell, params = {} } = this.props;
    const { format, relative, cellProperty } = params;

    let cellValue = cell;
    if (cellProperty) {
      cellValue = cell[cellProperty];
    }

    const value = this.getTimeOrValue(this.value(cellValue), params);
    if (!value) {
      return '';
    }

    const title = moment(value).format('LLL');
    const date = relative ? moment(value).fromNow() : moment(value).format(format || FORMAT);

    return <span title={title}>{date}</span>;
  }

  getTimeOrValue(value, params) {
    const unformattedTimeMatcher = /^[0-2][0-9][0-5][0-9][0-5][0-9]$/i;
    const isUnformattedTime = unformattedTimeMatcher.test(value);
    const { unformattedValueType } = params || {};

    if (!isUnformattedTime || !unformattedValueType || unformattedValueType !== 'unformatted-time') {
      return value;
    }

    const timeSplitter = /.{1,2}/g;
    const timeArray = value.match(timeSplitter); // [ 'hh', 'mm', 'ss']
    const time = moment();

    time.set({ hour: timeArray[0], minute: timeArray[1], second: timeArray[2] });

    return <this.PopperWrapper text={time} />;
  }
}
