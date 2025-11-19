import isFunction from 'lodash/isFunction';
import isObject from 'lodash/isObject';
import isString from 'lodash/isString';
import React from 'react';

import { REMOTE_TITLE_ATTR_NAME } from '../../../../../../constants/pageTabs';
import { createDocumentUrl, isUrl } from '../../../../../../helpers/urls';
import BaseFormatter from '../../BaseFormatter';

import PageService from '@/services/PageService';

export default class LinkFormatter extends BaseFormatter {
  static TYPE = 'link';

  format(props) {
    const { row = {}, cell, config = {} } = props;

    let href = isUrl(cell) ? cell : createDocumentUrl(row.id);

    // is computed from config
    if (isString(config.url)) {
      href = config.url;
    }

    if (isFunction(config.getUrl)) {
      href = config.getUrl(row);
    }

    if (isString(config.target) || isObject(config.target)) {
      try {
        const serviceConfig = isObject(config.target) ? config.target : JSON.parse(config.target);

        return (
          <a
            className="ecos-link"
            onClick={() => PageService.changeUrlLink(href, { openNewTab: true, ...serviceConfig })}
            {...{ [REMOTE_TITLE_ATTR_NAME]: true }}
          >
            {cell}
          </a>
        );
      } catch (e) {
        console.warn(
          `LinkFormatter: Unsupported config "${config.target}". Please correct the value so that it can be transformed into an JSON object.`
        );
      }
    }

    return (
      <a href={href} target="_blank" rel="noopener noreferrer" {...{ [REMOTE_TITLE_ATTR_NAME]: true }}>
        {cell}
      </a>
    );
  }

  getAliases() {
    return ['сardDetailsLink'];
  }
}
