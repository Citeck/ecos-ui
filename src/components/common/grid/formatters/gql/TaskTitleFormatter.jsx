import React, { Fragment } from 'react';
import DefaultGqlFormatter from './DefaultGqlFormatter';

export default class TaskTitleFormatter extends DefaultGqlFormatter {
  render() {
    let props = this.props;
    let { cell, row } = props;

    return <Fragment>{this.value(row['taskTitle'] || row['cm:title'] || row['cwf:taskTitle'] || cell)}</Fragment>;
  }
}
