import React, { useMemo, memo, useCallback } from 'react';
import { Scrollbars } from 'react-custom-scrollbars';

import List from './List';

import { InfoText, Loader } from '@/components/common';
import { t } from '@/helpers/util';

import './Body.scss';

const Body = ({ currentTab, tabId, toggleToFirstTab, tabItems, isSearching = false }) => {
  const filteredData = useCallback(
    data => {
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
    },
    [tabItems]
  );

  const children = useMemo(() => filteredData(tabItems[currentTab]), [tabItems, currentTab]);

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
};

export default React.memo(Body);
