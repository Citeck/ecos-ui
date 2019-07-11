import React from 'react';
import DefaultGqlFormatter from './DefaultGqlFormatter';
import { hasInString } from '../../../../../helpers/util';
import { NEW_VERSION_PATH } from '../../../../../helpers/urls';
import { URL } from '../../../../../constants';

export default class CardDetailsLinkFormatter extends DefaultGqlFormatter {
  get isNewVersion() {
    return hasInString(window.location.pathname, NEW_VERSION_PATH);
  }

  render() {
    const { row, cell } = this.props;

    if (this.isNewVersion) {
      return (
        <a target="_blank" rel="noopener noreferrer" href={`${URL.DASHBOARD}?recordRef=${row.id}`}>
          {this.value(cell)}
        </a>
      );
    }

    return <a href={`/share/page/card-details?nodeRef=${row.id}`}>{this.value(cell)}</a>;
  }
}
