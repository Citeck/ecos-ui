import classNames from 'classnames';
import get from 'lodash/get';
import React from 'react';

import { getLinkWithWs, getWorkspaceId } from '@/helpers/urls.js';
import PageService from '@/services/PageService';
import PageTabList from '@/services/pageTabs/PageTabList.js';

import './style.scss';

export const AssocLink = ({ className, label, asText, link, extraData, paramsLink = {} }) => {
  let onClickHandler = null;
  const isHandleClick = !asText && link;

  if (isHandleClick) {
    onClickHandler = e => {
      const workspaceId = get(paramsLink, 'workspaceId');

      const baseParamsLink = {
        openNewTab: true,
        reopen: true,
        closeActiveTab: false
      };

      if (get(paramsLink, 'workspaceId')) {
        const url = getLinkWithWs(link, paramsLink.workspaceId);

        if (e.button === 1) {
          PageService.changeUrlLink(url, { openNewBrowserTab: true });
          return;
        }

        if ((e.type === 'click' || e.type === 'mousedown') && e.button === 0) {
          const needUpdateTabs = !!workspaceId && workspaceId !== getWorkspaceId();

          const params = {
            ...baseParamsLink,
            needUpdateTabs
          };

          if (needUpdateTabs) {
            PageTabList.setLastActiveTabWs();
          }

          if (!paramsLink.openNewBrowserTab) {
            PageService.changeUrlLink(url, params);
          } else {
            PageService.changeUrlLink(url, { openNewBrowserTab: true });
          }

          return;
        }
      }

      e.preventDefault();
      PageService.changeUrlLink(link, { ...baseParamsLink, ...paramsLink });
    };
  }

  if (asText) {
    return (
      <div className="assoc-container" title={label}>
        <span className={classNames('assoc-value', className)}>{label}</span>
        {extraData && <span className="assoc-extra-data">({extraData})</span>}
      </div>
    );
  }

  if (isHandleClick) {
    return (
      <span title={label} onClick={onClickHandler} onMouseDown={onClickHandler} className={classNames('assoc-value', className)}>
        {label}
      </span>
    );
  }

  return (
    <a href={link} title={label} onClick={onClickHandler} className={classNames('assoc-value', className)}>
      {label}
    </a>
  );
};
