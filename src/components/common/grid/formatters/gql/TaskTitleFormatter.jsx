import React from 'react';

import DefaultGqlFormatter from './DefaultGqlFormatter';

export default class TaskTitleFormatter extends DefaultGqlFormatter {
  render() {
    const { cell, row } = this.props;
    const text = this.value(row['taskTitle'] || row['cm:title'] || row['cwf:taskTitle'] || cell);

    return <this.PopperWrapper text={text} />;
  }
}
