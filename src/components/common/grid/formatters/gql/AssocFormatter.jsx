import React, { Fragment } from 'react';
import { isNodeRef } from '../../../../../helpers/util';
import DefaultGqlFormatter from './DefaultGqlFormatter';
import Records from '../../../../../components/Records';
import { AssocEditor } from '../../editors';

export default class AssocFormatter extends DefaultGqlFormatter {
  static getQueryString(attribute) {
    return `.atts(n:"${attribute}"){disp,assoc}`;
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

  static getDisplayText(value) {
    if (!value) return value;

    if (Array.isArray(value)) {
      return Promise.all(value.map(AssocFormatter.getDisplayName)).then(results => results.join(', '));
    }

    return AssocFormatter.getDisplayName(value);
  }

  getId(cell) {
    return cell.assoc || '';
  }

  state = {
    displayName: ''
  };

  fetchName = false;

  componentDidMount() {
    const { cell } = this.props;

    this.fetchName = true;
    AssocFormatter.getDisplayText(cell).then(displayName => {
      if (this.fetchName) {
        this.setState({ displayName });
        this.fetchName = false;
      }
    });
  }

  componentWillUnmount() {
    this.fetchName = false;
  }

  render() {
    return <Fragment>{this.state.displayName}</Fragment>;
  }
}
