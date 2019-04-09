import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { OrgStructApi } from '../../../../../../api/orgStruct';
import { TAB_BY_LEVELS } from './constants';

export const SelectModalContext = React.createContext();

export const SelectModalProvider = props => {
  const { orgStructApi } = props;

  const [isSelectModalOpen, toggleSelectModal] = useState(false);
  const [searchText, updateSearchText] = useState('');
  const [currentTab, setCurrentTab] = useState(TAB_BY_LEVELS);

  return (
    <SelectModalContext.Provider
      value={{
        orgStructApi,
        isSelectModalOpen,
        searchText,
        currentTab,

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
