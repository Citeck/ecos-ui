import React, { Fragment } from 'react';
import isString from 'lodash/isString';
import DefaultGqlFormatter from './DefaultGqlFormatter';
import Records from '../../../../../components/Records';
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

  state = {
    displayName: ''
  };

  componentDidMount() {
    let cell = this.props.cell;

    if (isString(cell)) {
      Records.get(cell)
        .load('.disp')
        .then(displayName => this.setState({ displayName }));
    } else {
      this.setState({ displayName: this.value(cell || {}) });
    }
  }

  render() {
    return <Fragment>{this.state.displayName}</Fragment>;
  }
}
