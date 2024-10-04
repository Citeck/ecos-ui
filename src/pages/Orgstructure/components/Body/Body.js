import React, { useContext, useState } from 'react';
import { Scrollbars } from 'react-custom-scrollbars';

import { t } from '../../../../helpers/util';
import { InfoText, Loader } from '../../../../components/common';
import { OrgstructContext } from '../../../../components/common/Orgstruct/OrgstructContext';

import List from './List';

import './Body.scss';

const Body = ({ reloadList, tabId, toggleToFirstTab }) => {
  const [isSafari, setSafari] = useState(false);
  const context = useContext(OrgstructContext);
  const { currentTab, tabItems, isSearching } = context;

  const children = tabItems[currentTab].filter(i => !i.parentId);

  const renderView = props => {
    return <div {...props} style={{ ...props.style, marginBottom: '-13px' }} />;
  };

  if (/Safari/.test(navigator.userAgent) && !/Chrome|CriOS|YaBrowser|OPR|Edg/.test(navigator.userAgent) && !isSafari) {
    setSafari(true);
  }

  return (
    <div className="select-orgstruct__body">
      <Scrollbars className="slide-menu-list" renderView={renderView} style={{ ...(isSafari && { position: 'initial' }) }}>
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
