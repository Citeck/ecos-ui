import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { OrgStructApi } from '../../../../../../api/orgStruct';
import { TAB_BY_LEVELS, TAB_ALL_USERS, TAB_ONLY_SELECTED } from './constants';
import { itemsByLevels, itemsAllUsers, itemsSelected } from './temp';

export const SelectModalContext = React.createContext();

export const SelectModalProvider = props => {
  const { orgStructApi } = props;

  const [isSelectModalOpen, toggleSelectModal] = useState(false);
  const [searchText, updateSearchText] = useState('');
  const [currentTab, setCurrentTab] = useState(TAB_BY_LEVELS);
  const [tabItems, setTabItems] = useState({
    [TAB_BY_LEVELS]: itemsByLevels,
    [TAB_ALL_USERS]: itemsAllUsers,
    [TAB_ONLY_SELECTED]: itemsSelected
  });

  return (
    <SelectModalContext.Provider
      value={{
        orgStructApi,
        isSelectModalOpen,
        searchText,
        currentTab,
        tabItems,

        toggleSelectModal: () => {
          toggleSelectModal(!isSelectModalOpen);
        },
        onCancelSelect: () => {
          // TODO:
          toggleSelectModal(false);
        },
        updateSearchText: e => {
          updateSearchText(e.target.value);
        },
        onSubmitSearchForm: () => {
          // TODO:
          console.log('searchText', searchText);
        },
        setCurrentTab: tabId => {
          setCurrentTab(tabId);
        },
        addTabItems: (tabId, items) => {
          setTabItems({
            ...tabItems,
            [tabId]: [...tabItems[tabId], ...items]
          });
        }
      }}
    >
      {props.children}
    </SelectModalContext.Provider>
  );
};

SelectModalProvider.displayName = 'SelectOrgstruct.SelectModalProvider';

SelectModalProvider.propTypes = {
  orgStructApi: PropTypes.instanceOf(OrgStructApi)
};
