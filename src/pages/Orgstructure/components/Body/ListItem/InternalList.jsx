import classNames from 'classnames';
import React from 'react';
import './ListItem.scss';

import defaultAvatar from './Vector.png';
const Avatar = ({ person }) => {
  return <img src={person?.attributes?.photo || defaultAvatar} alt="avatar" className="orgstructure-page__avatar" />;
};

const InternalList = ({ infoLabel, nestingLevel, isPerson }) => {
  if (!infoLabel.extraLabel) {
    return <span className="orgstructure-page__list-item-label">{infoLabel.label}</span>;
  }

  return (
    <div
      className={classNames('orgstructure-page__list-item-label-with-extra', {
        'orgstructure-page__list-item-label-with-extra_fullwidth': nestingLevel === 0
      })}
    >
      {<Avatar person={infoLabel} />}
      <span className="orgstructure-page__list-item-label">{infoLabel.label}</span>
      <span className="select-orgstruct__list-item-label-extra">({infoLabel.extraLabel})</span>
    </div>
  );
};

export default React.memo(InternalList);
