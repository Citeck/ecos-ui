import React, { useEffect, useState } from 'react';
import classNames from 'classnames';
import get from 'lodash/get';

import { MenuApi } from '../../api/menu';
import { Badge } from '../common/form';
import SidebarService from '../../services/sidebar';

import './style.scss';

const menuApi = new MenuApi();

function RemoteBadge({ data, isOpen }) {
  const journalId = get(data, 'params.journalId', '');
  const [journalTotalCount, setJournalTotalCount] = useState('');
  const getJournalCount = () => {
    if (journalId) {
      menuApi.getJournalTotalCount(journalId).then(count => {
        setJournalTotalCount(count ? count.toString() : '');
      });
    }
  };

  useEffect(() => {
    SidebarService.addEmitter(SidebarService.UPDATE_EVENT, getJournalCount);

    return () => {
      SidebarService.removeEmitter(SidebarService.UPDATE_EVENT, getJournalCount);
    };
  }, []);

  useEffect(() => {
    getJournalCount();
  }, [journalId]);

  return (
    <>
      <Badge
        text={journalTotalCount}
        className={classNames('ecos-sidebar-item__badge', { 'ecos-sidebar-item__badge_hide': !isOpen })}
        state="danger"
        size="medium"
      />
      <div className={classNames('ecos-sidebar-item__point', { 'ecos-sidebar-item__point_hide': isOpen || !journalTotalCount })} />
    </>
  );
}

export default React.memo(RemoteBadge);
