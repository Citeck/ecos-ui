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

    const value = this.value(cell);
    const format = params.format || FORMAT;
    const date = value ? moment(value).format(format) : '';

    return <Fragment>{date}</Fragment>;
  }
}
