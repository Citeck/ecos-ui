import classNames from 'classnames';
import React from 'react';

const CollapseArrow = ({ isToggle, hasChildren }) => {
  if (!hasChildren) {
    return null;
  }

  return (
    <span
      className={classNames('icon select-orgstruct__collapse-handler', {
        'icon-small-right': !isToggle,
        'icon-small-down': isToggle
      })}
    />
  );
};

export default React.memo(CollapseArrow);
