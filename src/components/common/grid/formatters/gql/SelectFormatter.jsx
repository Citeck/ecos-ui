import React from 'react';

import Records from '../../../../../components/Records';
import { DropdownEditor } from '../../editors';
import DefaultGqlFormatter from './DefaultGqlFormatter';

export default class SelectFormatter extends DefaultGqlFormatter {
  static getQueryString(attribute) {
    return `.att(n:"${attribute}"){disp,str}`;
  }

  static getEditor(editorProps, value, row, column) {
    return <DropdownEditor {...editorProps} value={value} createVariants={this.formatExtraData.createVariants} column={column} row={row} />;
  }

  state = {
    displayValue: ''
  };

  _alive = true;

  componentDidMount() {
    this.calculateDisplayValue().then(displayValue => this && this._alive && this.setState({ displayValue }));
  }

  componentWillUnmount() {
    this._alive = false;
  }

  calculateDisplayValue() {
    const { cell, row, params = {} } = this.props;
    const { column = {} } = params;

    return new Promise(resolve => {
      const fallback = () => {
        if (typeof cell === 'string') {
          resolve(cell);
        } else if (cell && cell.disp) {
          resolve(cell.disp);
        } else {
          resolve('');
        }
      };

      if (row.id && column.attribute) {
        return Records.get(row.id)
          .load(`#${column.attribute}?options`)
          .then(options => {
            return options.find(item => item.value === cell);
          })
          .then(option => {
            if (!option) {
              return fallback();
            }

            resolve(option.label);
          })
          .catch(fallback);
      }

      return fallback();
    });
  }

  getId(cell) {
    return cell.str || '';
  }

  render() {
    return <>{this.state.displayValue}</>;
  }
}
