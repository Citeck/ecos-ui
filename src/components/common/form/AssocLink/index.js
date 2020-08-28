import React from 'react';
import classNames from 'classnames';

import PageService from '../../../../services/PageService';

import './style.scss';

export const AssocLink = ({ className, label, asText, link, paramsLink = {} }) => {
  let onClickHandler = null;

  if (!asText && link) {
    onClickHandler = e => {
      e.preventDefault();
      PageService.changeUrlLink(link, { openInBackground: !paramsLink.openNewBrowserTab, ...paramsLink });
    };
  }

  if (asText) {
    return <span className={classNames('assoc-value', className)}>{label}</span>;
  }

  return (
    <a href={link} title={label} onClick={onClickHandler} className={classNames('assoc-value', className)}>
      {label}
    </a>
  );
};
