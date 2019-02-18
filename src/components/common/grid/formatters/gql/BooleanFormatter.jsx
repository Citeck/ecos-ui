import React, { Fragment } from 'react';
import DefaultGqlFormatter from './DefaultGqlFormatter';

export default class BooleanFormatter extends DefaultGqlFormatter {
  static getQueryString(attribute) {
    return `${attribute}?bool`;
  }

  render() {
    let cell = this.props.cell;
    cell = cell === true ? 'Да' : cell === false ? 'Нет' : '';
    return <Fragment>{cell}</Fragment>;
  }
}
