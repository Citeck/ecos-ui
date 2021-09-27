import React from 'react';

import DefaultGqlFormatter from './DefaultGqlFormatter';

export default class PercentFormatter extends DefaultGqlFormatter {
  render() {
    const props = this.props;
    let { cell } = props;

    if (cell) {
      cell = 100 * cell + '%';
    }

    return <this.PopperWrapper text={this.value(cell)} />;
  }
}
