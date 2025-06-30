import React, { useContext } from 'react';
import { Scrollbars } from 'react-custom-scrollbars';

import { t } from '../../../../../helpers/util';
import InfoText from '../../../InfoText';
import Loader from '../../../Loader';
import { OrgstructContext } from '../../OrgstructContext';

import List from './List';

import './Body.scss';

const Body = () => {
  const context = useContext(OrgstructContext);
  const { currentTab, tabItems, isSearching } = context;

  const children = tabItems[currentTab].filter(i => !i.parentId);

  return (
    <div className="select-orgstruct__body">
      <Scrollbars className="slide-menu-list" autoHide autoHeight autoHeightMin={0} autoHeightMax={400} style={{ position: 'initial' }}>
        <div className="select-orgstruct__list-wrapper">
          {isSearching && <Loader blur />}
          {!children.length && !isSearching && <InfoText text={t('select-orgstruct.empty-list')} />}
          <List items={children} />
        </div>
      </Scrollbars>
    </div>
  );
};

export default Body;
