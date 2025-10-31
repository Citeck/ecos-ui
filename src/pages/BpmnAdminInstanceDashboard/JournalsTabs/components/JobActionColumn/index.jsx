import React, { useState } from 'react';

import get from 'lodash/get';

import Records from '../../../../../components/Records';
import { JOURNALS_TABS_BLOCK_CLASS } from '../../../constants';
import { Loader } from '../../../../../components/common';

import './style.scss';

export const JobActionColumn = ({ row }) => {
  const [isLoading, setLoading] = useState(false);
  const [suspended, setSuspended] = useState(get(row, 'state.suspended'));

  const suspendJob = () => {
    setLoading(true);

    const job = Records.get(row.id);
    job.att('action', 'SUSPEND');
    job.save().then(() => {
      setLoading(false);
      setSuspended(true);
    });
  };

  const activateJob = () => {
    setLoading(true);

    const job = Records.get(row.id);
    job.att('action', 'ACTIVATE');
    job.save().then(() => {
      setLoading(false);
      setSuspended(false);
    });
  };

  let iconClassName = '';

  if (suspended) {
    iconClassName = 'fa fa-play';
  }

  if (!suspended) {
    iconClassName = 'fa fa-pause';
  }

  const handleCLick = () => {
    if (isLoading) {
      return;
    }

    if (suspended) {
      activateJob();
    } else {
      suspendJob();
    }
  };

  return (
    <div className={`${JOURNALS_TABS_BLOCK_CLASS}__clickable-text job-action`} onClick={handleCLick}>
      {isLoading && <Loader type="points" />}
      {!isLoading && <i className={iconClassName} />}
    </div>
  );
};
