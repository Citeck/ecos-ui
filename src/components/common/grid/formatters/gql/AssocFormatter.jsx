import React, { Fragment } from 'react';
import DefaultGqlFormatter from './DefaultGqlFormatter';
import Records from '../../../../../components/Records';
import { AssocEditor } from '../../editors';

export default class AssocFormatter extends DefaultGqlFormatter {
  static getQueryString(attribute) {
    return `${attribute}?assoc`;
  }

  static getEditor(editorProps, value, row, column) {
    return <AssocEditor {...editorProps} value={value} column={column} />;
  }

  state = {
    displayName: ''
  };

  componentDidMount() {
    let cell = this.props.cell;
    if (cell) {
      Records.get(cell)
        .load('.disp')
        .then(displayName => {
          this.setState({
            displayName
          });
        });
    }
  }

  render() {
    return <Fragment>{this.state.displayName || this.props.cell}</Fragment>;
  }
}
