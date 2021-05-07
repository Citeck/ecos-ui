import React from 'react';
import moment from 'moment';
import DefaultGqlFormatter from './DefaultGqlFormatter';
import { DateEditor } from '../../editors';

const FORMAT = 'DD.MM.YYYY';
const EDITOR_FORMAT = 'dd.MM.YYYY';

export default class DateFormatter extends DefaultGqlFormatter {
  static getEditor(editorProps, value) {
    return <DateEditor {...editorProps} value={value} dateFormat={EDITOR_FORMAT} />;
  }

  render() {
    const { cell, params = {} } = this.props;

    const value = this.value(cell);
    const format = params.format || FORMAT;
    const date = value ? moment(value).format(format) : '';

    return <this.PopperWrapper text={date} />;
  }
}
