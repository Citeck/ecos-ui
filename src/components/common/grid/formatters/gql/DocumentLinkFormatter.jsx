import React from 'react';
import DefaultGqlFormatter from './DefaultGqlFormatter';
import { isNewVersionPage } from '../../../../../helpers/urls';
import { URL } from '../../../../../constants';
import { REMOTE_TITLE_ATTR_NAME } from '../../../../../constants/pageTabs';

export default class DocumentLinkFormatter extends DefaultGqlFormatter {
  static getQueryString(attribute) {
    return `.att(n:"${attribute}"){displayName:disp, id}`;
  }

  value(cell) {
    return cell.displayName || '';
  }

  render() {
    let props = this.props;
    let cell = props.cell || {};

    if (isNewVersionPage()) {
      return (
        <a target="_blank" rel="noopener noreferrer" href={`${URL.DASHBOARD}?recordRef=${cell.id}`} {...{ [REMOTE_TITLE_ATTR_NAME]: true }}>
          {this.value(cell)}
        </a>
      );
    }

    return <a href={`/share/page/card-details?nodeRef=${cell.id}`}>{this.value(cell)}</a>;
  }
}
