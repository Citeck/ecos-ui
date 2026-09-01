import classNames from 'classnames';
import get from 'lodash/get';
import React from 'react';

import { getLinkWithWs, getWorkspaceId } from '@/helpers/urls';
import PageService from '@/services/PageService';
import PageTabList from '@/services/pageTabs/PageTabList';

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

  // COREDEV-435: only the rendered name may open the record. Without this modifier the value box
  // stretches over the whole control, so a click into the blank space to the right of a short name
  // navigates away from a record the user never pointed at. The modifier shrinks the box to its
  // text and keeps a four-character floor, so one- and two-letter names stay a hittable target.
  const linkClassName = classNames('assoc-value', 'assoc-value_link', className);

  if (isHandleClick) {
    return (
      <span title={label} onClick={onClickHandler} onMouseDown={onClickHandler} className={linkClassName}>
        {label}
      </span>
    );
  }

  return (
    <a href={link} title={label} onClick={onClickHandler} className={linkClassName}>
      {label}
    </a>
  );
};
