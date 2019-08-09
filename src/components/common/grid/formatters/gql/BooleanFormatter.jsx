import React, { Fragment } from 'react';
import DefaultGqlFormatter from './DefaultGqlFormatter';
import { t } from '../../../../../helpers/util';

export default class BooleanFormatter extends DefaultGqlFormatter {
  static getQueryString(attribute) {
    return `${attribute}?bool`;
  }

  render() {
    let cell = this.props.cell;
    cell = cell === true || cell === 'true' ? t('boolean.yes') : t('boolean.no');
    return <Fragment>{cell}</Fragment>;
  }
}
