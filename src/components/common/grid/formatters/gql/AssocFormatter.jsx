import React, { Fragment } from 'react';
import DefaultGqlFormatter from './DefaultGqlFormatter';
import { AssocEditor } from '../../editors';

export default class AssocFormatter extends DefaultGqlFormatter {
  static getQueryString(attribute) {
    return `.att(n:"${attribute}"){disp,assoc}`;
  }

  static getEditor(editorProps, value, row, column) {
    return <AssocEditor {...editorProps} value={value} column={column} />;
  }

  value(cell) {
    return cell.disp || '';
  }

  getId(cell) {
    return cell.assoc || '';
  }

  render() {
    let props = this.props;
    let cell = props.cell || {};

    return <Fragment>{this.value(cell)}</Fragment>;
  }
}
