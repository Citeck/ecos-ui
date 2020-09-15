import React from 'react';
import classNames from 'classnames';

import { Icon } from '../../../common';

const Badge = props => {
  const { type, target, forwardedRef, onClick } = props;

  return (
    <div
      id={target}
      ref={forwardedRef}
      className={classNames('ecos-docs__badge', {
        'ecos-docs__badge_files-need': !type.countDocuments && type.mandatory,
        'ecos-docs__badge_files-can': !type.countDocuments && !type.mandatory
      })}
      onClick={onClick}
    >
      <Icon
        className={classNames('ecos-docs__badge-icon', {
          'icon-small-check': type.countDocuments,
          'icon-small-close': !type.countDocuments
        })}
      />
      <div className="ecos-docs__badge-counter">{type.countDocuments}</div>
    </div>
  );
};

export default Badge;
