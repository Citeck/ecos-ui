import React, { useEffect, useState } from 'react';
import get from 'lodash/get';
import isNumber from 'lodash/isNumber';
import { MenuApi } from '../../api';
import { Badge } from '../common/form';

import './style.scss';

const menuApi = new MenuApi();

function RemoteBadge({ data, isOpen }) {
  const journalId = get(data, 'params.journalId', '');
  const [journalTotalCount, setJournalTotalCount] = useState(0);

  useEffect(() => {
    if (journalId) {
      menuApi.getJournalTotalCount(journalId).then(count => {
        setJournalTotalCount(count);
      });
    }
  }, [journalId]);

  if (isNumber(journalTotalCount) && journalTotalCount > 0) {
    return isOpen ? (
      <Badge text={journalTotalCount.toString()} className="ecos-sidebar-item__badge" state="danger" />
    ) : (
      <div className="ecos-sidebar-item__point" />
    );
  } else {
    return <></>;
  }
}

export default RemoteBadge;
