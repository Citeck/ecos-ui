import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { OrgStructApi } from '../../../../../../api/orgStruct';
import { TAB_BY_LEVELS, TAB_ONLY_SELECTED } from './constants';
import { handleResponse, prepareSelected } from './helpers';

export const SelectModalContext = React.createContext();

export const SelectModalProvider = props => {
  const { orgStructApi } = props;

  const [isSelectModalOpen, toggleSelectModal] = useState(false);
  const [searchText, updateSearchText] = useState('');
  const [currentTab, setCurrentTab] = useState(TAB_BY_LEVELS);
  const [isRootGroupsFetched, setIsRootGroupsFetched] = useState(false);
  const [tabItems, setTabItems] = useState({
    [TAB_BY_LEVELS]: [],
    [TAB_ONLY_SELECTED]: []
  });

  useEffect(() => {
    if (!isRootGroupsFetched && isSelectModalOpen) {
      orgStructApi
        .fetchGroup()
        .then(handleResponse)
        .then(items => {
          setTabItems({
            ...tabItems,
            [TAB_BY_LEVELS]: items.map(newItem => {
              return {
                ...newItem,
                isSelected: tabItems[TAB_ONLY_SELECTED].findIndex(item => item.id === newItem.id) !== -1
              };
            })
          });
        });
      setIsRootGroupsFetched(true);
    }
  }, [isRootGroupsFetched, isSelectModalOpen]);

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
          orgStructApi
            .fetchGroup({
              groupName: '_orgstruct_home_',
              searchText
            })
            .then(handleResponse)
            .then(items => {
              console.log('searchResult', items);
              setTabItems({
                ...tabItems,
                [TAB_BY_LEVELS]: items.map(newItem => {
                  return {
                    ...newItem,
                    isSelected: tabItems[TAB_ONLY_SELECTED].findIndex(item => item.id === newItem.id) !== -1
                  };
                })
              });
            });
        },

        setCurrentTab: tabId => {
          setCurrentTab(tabId);
        },

        onToggleSelectItem: targetItem => {
          const itemIdx = tabItems[TAB_ONLY_SELECTED].findIndex(item => item.id === targetItem.id);

          if (itemIdx === -1) {
            setTabItems({
              ...tabItems,
              [TAB_ONLY_SELECTED]: [...tabItems[TAB_ONLY_SELECTED], prepareSelected(targetItem)],
              [TAB_BY_LEVELS]: tabItems[TAB_BY_LEVELS].map(item => {
                if (item.id === targetItem.id) {
                  return {
                    ...item,
                    isSelected: true
                  };
                }

                return item;
              })
            });
          } else {
            setTabItems({
              ...tabItems,
              [TAB_ONLY_SELECTED]: tabItems[TAB_ONLY_SELECTED].slice(0, itemIdx).concat(tabItems[TAB_ONLY_SELECTED].slice(itemIdx + 1)),
              [TAB_BY_LEVELS]: tabItems[TAB_BY_LEVELS].map(item => {
                if (item.id === targetItem.id) {
                  return {
                    ...item,
                    isSelected: !item.isSelected
                  };
                }

                return item;
              })
            });
          }
        },

        onToggleCollapse: targetItem => {
          const itemIdx = tabItems[currentTab].findIndex(item => item === targetItem);
          if (!targetItem.isLoaded && targetItem.hasChildren) {
            const groupName = targetItem.attributes.shortName;
            orgStructApi
              .fetchGroup({ groupName })
              .then(handleResponse)
              .then(items => {
                return items.map(newItem => ({
                  ...newItem,
                  parentId: targetItem.id,
                  isSelected: tabItems[TAB_ONLY_SELECTED].findIndex(item => item.id === newItem.id) !== -1
                }));
              })
              .then(newItems => {
                setTabItems({
                  ...tabItems,
                  [currentTab]: tabItems[currentTab]
                    .slice(0, itemIdx)
                    .concat([
                      {
                        ...targetItem,
                        isLoaded: true,
                        isOpen: !targetItem.isOpen
                      }
                    ])
                    .concat(tabItems[currentTab].slice(itemIdx + 1))
                    .concat(
                      newItems.filter(newItem => {
                        // exclude duplicates
                        return tabItems[currentTab].findIndex(i => i.id === newItem.id && i.parentId === newItem.parentId) === -1;
                      })
                    )
                });
              });
          } else {
            setTabItems({
              ...tabItems,
              [currentTab]: tabItems[currentTab]
                .slice(0, itemIdx)
                .concat([
                  {
                    ...targetItem,
                    isOpen: !targetItem.isOpen
                  }
                ])
                .concat(tabItems[currentTab].slice(itemIdx + 1))
            });
          }
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
