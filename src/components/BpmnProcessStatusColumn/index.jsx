import React from 'react';

import './style.scss';

export const BpmnProcessStatusColumn = ({ row }) => {
  const { isSuspended, incidentCount } = row;

  let iconClassName = '';
  if (incidentCount === 0) {
    iconClassName = 'fa fa-check';
  }

  if (incidentCount > 0) {
    iconClassName = 'fa fa-close';
  }

  return (
    <div className="status">
      <i className={iconClassName} />
      {isSuspended && <i className="fa fa-pause" />}
    </div>
  );
};
