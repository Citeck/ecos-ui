import React, { useState, useMemo } from 'react';
import { t } from '../../../../../../helpers/util';

export const SelectModalContext = React.createContext();

const TAB_BY_LEVELS = 'TAB_BY_LEVELS';
const TAB_ALL_USERS = 'TAB_ALL_USERS';
const TAB_ONLY_SELECTED = 'TAB_ONLY_SELECTED';

function getTabItems() {
  return [
    {
      id: TAB_BY_LEVELS,
      label: t('select-orgstruct.tab.by-levels')
    },
    {
      id: TAB_ALL_USERS,
      label: t('select-orgstruct.tab.all-users')
    },
    {
      id: TAB_ONLY_SELECTED,
      label: t('select-orgstruct.tab.only-selected')
    }
  ];
}

export const SelectModalProvider = props => {
  const [isSelectModalOpen, toggleSelectModal] = useState(false);
  const [searchText, updateSearchText] = useState('');
  const [currentTab, setCurrentTab] = useState(TAB_BY_LEVELS);

  const tabs = useMemo(() => getTabItems(), []);

  return (
    <SelectModalContext.Provider
      value={{
        isSelectModalOpen,
        searchText,
        tabs: tabs.map(item => {
          return {
            ...item,
            isActive: item.id === currentTab,
            onClick: () => {
              setCurrentTab(item.id);
            }
          };
        }),

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
        }
      }}
    >
      {props.children}
    </SelectModalContext.Provider>
  );
};

SelectModalProvider.displayName = 'SelectOrgstruct.SelectModalProvider';

SelectModalProvider.propTypes = {};
