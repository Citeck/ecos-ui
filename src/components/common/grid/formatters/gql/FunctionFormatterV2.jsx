import React from 'react';
import lodash from 'lodash';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';

import ecosFetch from '../../../../../helpers/ecosFetch';
import { t } from '../../../../../helpers/export/util';
import DefaultGqlFormatter from './DefaultGqlFormatter';

export default class FunctionFormatterV2 extends DefaultGqlFormatter {
  static getFilterValue(cell, row, params, rowIndex) {
    const result = this.prototype.getResult(this.prototype.value(cell), params, row, rowIndex);

    if (typeof get(result, 'then') === 'function') {
      return '';
    }

    return get(FunctionFormatterV2.parseResult(result), 'value');
  }

  static parseResult(result) {
    switch (typeof result) {
      case 'object': {
        const innerText = get(result, 'innerText');

        if (typeof innerText === 'string') {
          return { value: result.innerHTML, type: 'html' };
        }

        const type = get(result, 'type');
        const value = get(result, 'value');

        if (isEmpty(type)) {
          return { value: '', type: '' };
        }

        if (type === 'html') {
          return { type, value };
        }

        return { type, value: JSON.stringify(result) };
      }
      case 'boolean':
        return {
          type: '',
          value: result ? t('predicate.boolean-true') : t('predicate.boolean-false')
        };
      case 'string':
        return { value: result, type: '' };
      default:
        return { type: '', value: '' };
    }
  }

  constructor(props) {
    super(props);

    const result = this.getResult(props.cell, props.params, props.row, props.rowIndex);
    const promise = get(result, 'then');

    if (typeof promise === 'function') {
      result.then(result => {
        const data = FunctionFormatterV2.parseResult(result);

        this.setState({
          value: get(data, 'value', ''),
          type: get(data, 'type', '')
        });
      });
    }
    const data = FunctionFormatterV2.parseResult(result);

    this.state = {
      value: get(data, 'value', ''),
      type: get(data, 'type', '')
    };
  }

  getResult(cell = {}, params = {}, row = {}, rowIndex = 0) {
    const fn = get(params, 'fn');
    const data = this.value(cell);
    const args = [cell, row, {}, data, rowIndex, { lodash, ecosFetch }];

    if (typeof fn === 'function') {
      const elCell = document.createElement('div');

      elCell.innerText = data;
      args[0] = elCell;

      const result = fn(...args);
      const then = get(result, 'then');

      if (typeof then === 'function') {
        return result;
      }

      return result === undefined ? elCell : result;
    }

    if (typeof fn === 'string') {
      try {
        // eslint-disable-next-line
        const extractedFn = eval(`(function() { return function (cell, row, column, data, rowIndex, utils) { ${fn};}})()`);

        if (typeof extractedFn === 'function') {
          return extractedFn(...args);
        }
      } catch (e) {
        console.error(`FunctionFormatterV2 error: ${e.message}`);

        return fn;
      }
    }
  }

  render() {
    const { value, type } = this.state;

    if (isEmpty(value)) {
      return null;
    }

    if (type === 'html') {
      return <div dangerouslySetInnerHTML={{ __html: value }} />;
    }

    return value;
  }
}
