import React from 'react';
import { createDocumentUrl, isNewVersionPage } from '../../../../../helpers/urls';
import { REMOTE_TITLE_ATTR_NAME } from '../../../../../constants/pageTabs';
import DefaultGqlFormatter from './DefaultGqlFormatter';

export default class CardDetailsLinkFormatter extends DefaultGqlFormatter {
  render() {
    const { row = {}, cell } = this.props;
    const url = createDocumentUrl(row.id);
    const text = this.value(cell);
    let linkProps = {};

    if (isNewVersionPage()) {
      linkProps = {
        target: '_blank',
        rel: 'noopener noreferrer',
        ...{ [REMOTE_TITLE_ATTR_NAME]: true }
      };
    }

    return (
      <this.PopperWrapper text={text}>
        <a href={url} {...linkProps}>
          {text}
        </a>
      </this.PopperWrapper>
    );
  }
}
