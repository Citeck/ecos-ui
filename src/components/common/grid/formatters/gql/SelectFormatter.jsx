import React, { Fragment } from 'react';
import DefaultGqlFormatter from './DefaultGqlFormatter';
import { DropdownEditor } from '../../editors';

export default class SelectFormatter extends DefaultGqlFormatter {
  static getEditor(editorProps, value, row, column) {
    return <DropdownEditor {...editorProps} value={value} createVariants={this.formatExtraData.createVariants} column={column} />;
  }

  render() {
    return <Fragment>{this.value(this.props.cell)}</Fragment>;
  }
}
