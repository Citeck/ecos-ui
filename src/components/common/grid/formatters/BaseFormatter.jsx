import React, { Fragment, Component } from 'react';
import { Input } from '../../form';

export default class BaseFormatter extends Component {
  static getFilterValue(cell) {
    return this.prototype.value(cell);
  }

  static getEditor(editorProps, value, row, column, rowIndex, columnIndex) {
    return <Input type={'text'} className={'input_width_full input_narrow'} value={value || ''} onChange={() => {}} />;
  }

  value(cell) {
    return cell || '';
  }

  render() {
    return <Fragment>{this.value(this.props.cell)}</Fragment>;
  }
}
