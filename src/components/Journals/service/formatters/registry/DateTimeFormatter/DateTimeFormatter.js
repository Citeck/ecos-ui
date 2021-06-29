import React from 'react';
import moment from 'moment';

import BaseFormatter from '../BaseFormatter';

const FORMAT = 'DD.MM.YYYY HH:mm';

export default class DateTimeFormatter extends BaseFormatter {
  static TYPE = 'datetime';

  format(props) {
    const { cell, config = {} } = props;
    const { format, relative } = config;

    if (!cell) {
      return '';
    }

    const value = this.getTimeOrValue(cell, config);

    if (!value) {
      return '';
    }

    const title = moment(value).format('LLL');
    const date = relative ? moment(value).fromNow() : moment(value).format(format || FORMAT);

    return <span title={title}>{date}</span>;
  }

  getTimeOrValue(value, config) {
    const { unformattedValueType = '' } = config || {};
    if (unformattedValueType !== 'unformatted-time') {
      return value;
    }

    const unformattedTimeMatcher = /^[0-2][0-9][0-5][0-9][0-5][0-9]$/i;

    if (!unformattedTimeMatcher.test(value)) {
      return value;
    }

    const timeSplitter = /.{1,2}/g;
    const timeArray = value.match(timeSplitter); // [ 'hh', 'mm', 'ss']
    const time = moment();
    time.set({ hour: timeArray[0], minute: timeArray[1], second: timeArray[2] });

    return time;
  }
}
