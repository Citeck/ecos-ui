import React, { useContext } from 'react';
import { Scrollbars } from 'react-custom-scrollbars';

import { t } from '../../../../helpers/util';
import { InfoText, Loader } from '../../../../components/common';
import { SelectOrgstructContext } from '../../../../components/common/form/SelectOrgstruct/SelectOrgstructContext';

import List from './List';

import './Body.scss';

const Body = ({ reloadList, tabId, toggleToFirstTab }) => {
  const context = useContext(SelectOrgstructContext);
  const { currentTab, tabItems, isSearching } = context;

  const children = tabItems[currentTab].filter(i => !i.parentId);

  return (
    <div className="select-orgstruct__body">
      <Scrollbars className="slide-menu-list">
        <div className="select-orgstruct__list-wrapper">
          {isSearching && <Loader blur />}
          {!children.length && !isSearching && <InfoText text={t('select-orgstruct.empty-list')} />}
          <List items={children} tabId={tabId} toggleToFirstTab={toggleToFirstTab} />
        </div>
      </Scrollbars>
    </div>
  );
};

export default Body;
