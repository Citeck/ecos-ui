import React, { useContext } from 'react';
import { Scrollbars } from 'react-custom-scrollbars';

import { t } from '../../../../helpers/util';
import { InfoText, Loader } from '../../../../components/common';
import { OrgstructContext } from '../../../../components/common/Orgstruct/OrgstructContext';

import List from './List';

import './Body.scss';

const Body = ({ reloadList, tabId, toggleToFirstTab }) => {
  const context = useContext(OrgstructContext);
  const { currentTab, tabItems, isSearching } = context;

  const children = tabItems[currentTab].filter(i => !i.parentId);

  const renderView = props => {
    return <div {...props} style={{ ...props.style, marginBottom: '-13px' }} />;
  };

  return (
    <div className="select-orgstruct__body">
      <Scrollbars className="slide-menu-list" renderView={renderView} style={{ position: 'initial' }}>
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
