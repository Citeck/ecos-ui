import React, { useEffect, useState } from 'react';
import get from 'lodash/get';
import { MenuApi } from '../../api';

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

  if (journalTotalCount > 0) {
    return isOpen ? <div className="ecos-sidebar-item__badge">{journalTotalCount}</div> : <div className="ecos-sidebar-item__point" />;
  } else {
    return <React.Fragment />;
  }
}

export default RemoteBadge;
