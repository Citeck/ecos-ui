import React from 'react';
import get from 'lodash/get';
import isString from 'lodash/isString';

import DefaultGqlFormatter from './DefaultGqlFormatter';
import AssocFormatter from './AssocFormatter';

export default class FileFormatter extends DefaultGqlFormatter {
  render() {
    const { cell, ...props } = this.props;
    const data = isString(cell) ? cell : get(cell, '[0].data.nodeRef') || get(cell, 'data.nodeRef');

    if (!data) {
      return null;
    }

    return <AssocFormatter {...props} cell={data} />;
  }
}
