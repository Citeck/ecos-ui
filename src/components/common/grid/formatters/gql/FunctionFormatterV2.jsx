import React from 'react';
import lodash from 'lodash';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import isFunction from 'lodash/isFunction';
import isString from 'lodash/isString';

import ecosFetch from '../../../../../helpers/ecosFetch';
import { t } from '../../../../../helpers/export/util';
import DefaultGqlFormatter from './DefaultGqlFormatter';

const HTML = 'html';

export default class FunctionFormatterV2 extends DefaultGqlFormatter {
  static getFilterValue(cell, row, params, rowIndex) {
    const result = this.prototype.getResult(this.prototype.value(cell), params, row, rowIndex);

    if (isFunction(get(result, 'then'))) {
      return '';
    }

    return get(FunctionFormatterV2.parseResult(result), 'value');
  }

  static parseResult(result) {
    switch (typeof result) {
      case 'object': {
        const innerText = get(result, 'innerText');

        if (isString(innerText)) {
          return { value: result.innerHTML, type: HTML };
        }

        const type = get(result, 'type');
        const value = get(result, 'value');

        if (isEmpty(type)) {
          return { value: '', type: '' };
        }

        if (type === HTML) {
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
        return { type: '', value: result };
      default:
        return { type: '', value: JSON.stringify(result) };
    }
  }

  state = {
    value: '',
    type: ''
  };

  componentDidMount() {
    const { cell, params, row, rowIndex } = this.props;
    const result = this.getResult(cell, params, row, rowIndex);
    const promise = get(result, 'then');

    const applyResult = result => {
      const data = FunctionFormatterV2.parseResult(result);
      this.setState({
        value: get(data, 'value', ''),
        type: get(data, 'type', '')
      });
    };

    if (isFunction(promise)) {
      result.then(applyResult);
    } else {
      applyResult(result);
    }
  }

  getResult(cell = {}, params = {}, row = {}, rowIndex = 0) {
    const fn = get(params, 'fn');
    const data = this.value(cell);
    const args = [cell, row, {}, data, rowIndex, { lodash, ecosFetch }];

    if (isFunction(fn)) {
      const elCell = document.createElement('div');

      elCell.innerText = data;
      args[0] = elCell;

      const result = fn(...args);
      const then = get(result, 'then');

      if (isFunction(then)) {
        return result;
      }

      return result === undefined ? elCell : result;
    }

    if (isString(fn)) {
      try {
        // eslint-disable-next-line
        const extractedFn = eval(`(function() { return function (cell, row, column, data, rowIndex, utils) { ${fn};}})()`);

        if (isFunction(extractedFn)) {
          return extractedFn(...args);
        }
      } catch (e) {
        return fn;
      }
    }
  }

  render() {
    const { value, type } = this.state;

    if (isEmpty(value)) {
      return null;
    }

    if (type === HTML) {
      return <div dangerouslySetInnerHTML={{ __html: value }} />;
    }

    return value;
  }
}
