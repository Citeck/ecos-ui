import React from 'react';
import DefaultGqlFormatter from './DefaultGqlFormatter';
import { isNewVersionPage } from '../../../../../helpers/urls';
import { URL } from '../../../../../constants';
import { OPEN_IN_BACKGROUND, REMOTE_TITLE_ATTR_NAME } from '../../../../../constants/pageTabs';

export default class CardDetailsLinkFormatter extends DefaultGqlFormatter {
  render() {
    const { row, cell } = this.props;

    if (isNewVersionPage()) {
      return (
        <a
          target="_blank"
          rel="noopener noreferrer"
          href={`${URL.DASHBOARD}?recordRef=${row.id}`}
          {...{
            [REMOTE_TITLE_ATTR_NAME]: true,
            // TODO: remove
            [OPEN_IN_BACKGROUND]: true
          }}
        >
          {this.value(cell)}
        </a>
      );
    }

    return <a href={`/share/page/card-details?nodeRef=${row.id}`}>{this.value(cell)}</a>;
  }
}
