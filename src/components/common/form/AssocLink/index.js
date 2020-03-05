import React from 'react';
import classNames from 'classnames';

import PageService from '../../../../services/PageService';

import './style.scss';

export const AssocLink = ({ className, label, asText, link, paramsLink = {} }) => {
  let onClickHandler = null;

  if (!asText && link) {
    onClickHandler = () => {
      PageService.changeUrlLink(link, paramsLink);
    };
  }

  return (
    <span
      onClick={onClickHandler}
      className={classNames('assoc-value', { 'assoc-value_link': !asText, 'assoc-value_text': asText }, className)}
    >
      {label}
    </span>
  );
};
