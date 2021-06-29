import React from 'react';
import classNames from 'classnames';

import PageService from '../../../../services/PageService';

import './style.scss';

export const AssocLink = ({ className, label, asText, link, extraData, paramsLink = {} }) => {
  let onClickHandler = null;

  if (!asText && link) {
    onClickHandler = e => {
      e.preventDefault();
      PageService.changeUrlLink(link, { openInBackground: !paramsLink.openNewBrowserTab, ...paramsLink });
    };
  }

  if (asText) {
    return (
      <div className="assoc-container">
        <span className={classNames('assoc-value', className)}>{label}</span>
        {extraData && <span className="assoc-extra-data">({extraData})</span>}
      </div>
    );
  }

  return (
    <a href={link} title={label} onClick={onClickHandler} className={classNames('assoc-value', className)}>
      {label}
    </a>
  );
};
