import React, { useContext } from 'react';
import { Scrollbars } from 'react-custom-scrollbars';

import InfoText from '../../../InfoText';
import Loader from '../../../Loader';
import { OrgstructContext } from '../../OrgstructContext';

import List from './List';

import { TabTypes } from '@/components/common/Orgstruct/constants';
import { handleResponse } from '@/components/common/form/SelectOrgstruct/helpers';
import { SourcesId } from '@/constants';
import { getCurrentUser, getCurrentUserName, t } from '@/helpers/util';

import './Body.scss';

const Body = () => {
  const context = useContext(OrgstructContext);
  const {
    currentTab,
    tabItems,
    isSearching,
    searchText,
    tabItems: { [TabTypes.SELECTED]: selectedItems = [] }
  } = context;

  const currentUserNodeRef = `${SourcesId.PERSON}@${getCurrentUserName()}`;
  const selectedItemsId = selectedItems.map(item => item.id);
  const orgstructCurrentUser = handleResponse({
    ...getCurrentUser(),
    nodeRef: currentUserNodeRef,
    isSkipUserMask: true,
    fullName: t('me')
  })[0];

  if (selectedItemsId.includes(currentUserNodeRef)) {
    orgstructCurrentUser.isSelected = true;
  }

  const children = tabItems[currentTab].filter(i => !i.parentId);

  return (
    <div className="select-orgstruct__body">
      <Scrollbars className="slide-menu-list" autoHide autoHeight autoHeightMin={0} autoHeightMax={400} style={{ position: 'initial' }}>
        <div className="select-orgstruct__list-wrapper">
          {isSearching && <Loader blur />}
          {!children.length && !isSearching && <InfoText text={t('select-orgstruct.empty-list')} />}
          <List items={!!searchText || !children.length ? children : [orgstructCurrentUser, ...children]} />
        </div>
      </Scrollbars>
    </div>
  );
};

export default Body;
