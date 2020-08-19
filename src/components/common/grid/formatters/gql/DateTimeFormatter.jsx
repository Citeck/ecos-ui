import React, { Fragment } from 'react';
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
    let { cell, params } = this.props;

    const value = this.getTimeOrValue(this.value(cell), params);
    const format = params.format || FORMAT;
    const date = value ? moment(value).format(format) : '';

    return <Fragment>{date}</Fragment>;
  }

  getTimeOrValue(value, params) {
    const unformattedTimeMatcher = /^[0-2][0-9][0-5][0-9][0-5][0-9]$/i;
    const isUnformattedTime = unformattedTimeMatcher.test(value);
    const { unformatedValueType } = params || {};
    if (!isUnformattedTime || !unformatedValueType || unformatedValueType !== 'unformatted-time') {
      return value;
    }

    const timeSplitter = /.{1,2}/g;
    const timeArray = value.match(timeSplitter); // [ 'hh', 'mm', 'ss']
    var time = moment();
    time.set({ hour: timeArray[0], minute: timeArray[1], second: timeArray[2] });
    return time;
  }
}
