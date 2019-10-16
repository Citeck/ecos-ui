import React, { Fragment } from 'react';
import DefaultGqlFormatter from './DefaultGqlFormatter';
import { DropdownEditor } from '../../editors';

export default class SelectFormatter extends DefaultGqlFormatter {
  static getQueryString(attribute) {
    return `.att(n:"${attribute}"){disp,str}`;
  }

  static getEditor(editorProps, value, row, column) {
    return <DropdownEditor {...editorProps} value={value} createVariants={this.formatExtraData.createVariants} column={column} row={row} />;
  }

  value(cell) {
    if (typeof cell === 'string') {
      return cell;
    }
    return cell.disp || '';
  }

  getId(cell) {
    return cell.str || '';
  }

  render() {
    return <Fragment>{this.value(this.props.cell || {})}</Fragment>;
  }
}
