import React from 'react';

import BaseFormatter from '../BaseFormatter';
import Popper from '../../../Popper';

export default class DefaultGqlFormatter extends BaseFormatter {
  static getQueryString(attribute) {
    if (!attribute) {
      return attribute;
    }

    if (attribute[0] === '?' || attribute[0] === '.') {
      return attribute;
    }

    return `${attribute}?disp`;
  }

  render() {
    const value = this.value(this.props.cell);

    return (
      <Popper showAsNeeded text={value} icon="icon-question" contentComponent={this.renderTooltipContent()}>
        {value}
      </Popper>
    );
  }
}
