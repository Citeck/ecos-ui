import React from 'react';
import DefaultGqlFormatter from './DefaultGqlFormatter';
import { hasInString } from '../../../../../helpers/util';
import { NEW_VERSION_PATH } from '../../../../../helpers/urls';
import { URL } from '../../../../../constants';

export default class DocumentLinkFormatter extends DefaultGqlFormatter {
  static getQueryString(attribute) {
    return `.att(n:"${attribute}"){displayName:disp, id}`;
  }

  get isNewVersion() {
    return hasInString(window.location.pathname, NEW_VERSION_PATH);
  }

  value(cell) {
    return cell.displayName || '';
  }

  render() {
    let props = this.props;
    let cell = props.cell || {};

    if (this.isNewVersion) {
      return (
        <a target="_blank" rel="noopener noreferrer" href={`${URL.DASHBOARD}recordRef=${cell.id}`}>
          {this.value(cell)}
        </a>
      );
    }

    return <a href={`/share/page/card-details?nodeRef=${cell.id}`}>{this.value(cell)}</a>;
  }
}
