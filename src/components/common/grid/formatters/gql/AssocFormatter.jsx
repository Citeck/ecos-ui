import React, { Fragment } from 'react';
import { isNodeRef } from '../../../../../helpers/util';
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

  static async getDisplayName(item) {
    if (isNodeRef(item)) {
      return Records.get(item).load('.disp');
    }

    if (typeof item === 'string') {
      return Promise.resolve(item);
    }

    if (item && item.disp) {
      return Promise.resolve(item.disp);
    }

    return Promise.resolve('');
  }

  getId(cell) {
    return cell.assoc || '';
  }

  state = {
    displayName: ''
  };

  componentDidMount() {
    let cell = this.props.cell;

    if (Array.isArray(cell)) {
      return Promise.all(cell.map(AssocFormatter.getDisplayName))
        .then(results => results.join(', '))
        .then(displayName => this.setState({ displayName }));
    }

    AssocFormatter.getDisplayName(cell).then(displayName => this.setState({ displayName }));
  }

  render() {
    return <Fragment>{this.state.displayName}</Fragment>;
  }
}
