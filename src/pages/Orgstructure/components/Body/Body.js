import React, { useMemo, memo } from 'react';
import { Scrollbars } from 'react-custom-scrollbars';

import { InfoText, Loader } from '../../../../components/common';
import { t } from '../../../../helpers/util';

import List from './List';

import './Body.scss';

const Body = memo(function Body({ currentTab, tabId, toggleToFirstTab, tabItems, isSearching = false }) {
  const filteredData = data => {
    const filteredData = [];
    let foundPerson = false;

    data.forEach(item => {
      if (item.id.startsWith('emodel/person')) {
        foundPerson = true;
      }
      if (!foundPerson || item.id.startsWith('emodel/person')) {
        filteredData.push(item);
      }
    });
    return filteredData;
  };

  const children = useMemo(() => filteredData(tabItems[currentTab]), [tabId, tabItems]);

  const renderView = props => {
    return <div {...props} style={{ ...props.style, marginBottom: '140px' }} />;
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
});

export default Body;
