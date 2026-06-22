import React from 'react';
import BaseTimesheet from './BaseTimesheet';
import GrouppedTimesheet from './GrouppedTimesheet';

import './style.scss';

export default function(props) {
  if (props.groupBy) {
    return <GrouppedTimesheet {...props} />;
  }

  return <BaseTimesheet {...props} />;
}
