import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import isEqual from 'lodash/isEqual';
import debounce from 'lodash/debounce';
import uniqueId from 'lodash/uniqueId';

import { OrgStructApi, ROOT_ORGSTRUCT_GROUP } from '../../../../api/orgStruct';
import { ALL_USERS_GROUP_SHORT_NAME, AUTHORITY_TYPE_USER, TAB_ALL_USERS, TAB_BY_LEVELS, TAB_ONLY_SELECTED } from './constants';
import { handleResponse, prepareSelected } from './helpers';
import { usePrevious } from '../../../../hooks/usePrevious';

export const SelectOrgstructContext = React.createContext();

export const SelectOrgstructProvider = props => {
  const { orgStructApi, controlProps } = props;
  const {
    multiple,
    defaultValue,
    allowedAuthorityTypes,
    excludeAuthoritiesByName,
    excludeAuthoritiesByType,
    openByDefault,
    onCancelSelect,
    modalTitle,
    getFullData,
    defaultTab,
    liveSearch,
    hideTabSwitcher,
    renderListItem,
    userSearchExtraFields,
    isIncludedAdminGroup
  } = controlProps;

  const [isSelectModalOpen, toggleSelectModal] = useState(openByDefault);
  const [currentTab, setCurrentTab] = useState(defaultTab || TAB_BY_LEVELS);
  const [searchText, updateSearchText] = useState('');
  const [selectedRows, setSelectedRows] = useState([]);
  const [isSelectedFetched, setIsSelectedFetched] = useState(false);
  const [isRootGroupsFetched, setIsRootGroupsFetched] = useState(false);
  const [isAllUsersGroupsFetched, setIsAllUsersGroupFetched] = useState(false);
  const [isAllUsersGroupsExists, setIsAllUsersGroupsExists] = useState(undefined);
  const [targetId, setTargetId] = useState(undefined);
  const [tabItems, setTabItems] = useState({
    [TAB_BY_LEVELS]: [],
    [TAB_ALL_USERS]: [],
    [TAB_ONLY_SELECTED]: []
  });
  const prevDefaultValue = usePrevious(defaultValue);

  const onSubmitSearchForm = () => {
    setIsRootGroupsFetched(false);
    setIsAllUsersGroupFetched(false);
  };

  const liveSearchDebounce = debounce(onSubmitSearchForm, 500);

  const setSelectedItem = (item, selectedItems = tabItems[TAB_ONLY_SELECTED], extra = {}) => ({
    ...item,
    ...extra,
    isSelected: selectedItems.some(selected => item.id === selected.id)
  });

  const checkIsAllUsersGroupExists = () => {
    const allowedUsers = allowedAuthorityTypes.includes(AUTHORITY_TYPE_USER);
    setIsAllUsersGroupsExists(allowedUsers);

    if (!allowedUsers && currentTab === TAB_ALL_USERS) {
      setCurrentTab(TAB_BY_LEVELS);
    }
  };

  // fetch root group list
  useEffect(() => {
    const trimSearchText = (searchText || '').trim();

    if (!isRootGroupsFetched && isSelectModalOpen && currentTab === TAB_BY_LEVELS) {
      orgStructApi
        .fetchGroup({
          query: {
            groupName: ROOT_ORGSTRUCT_GROUP,
            searchText: trimSearchText
          },
          excludeAuthoritiesByName,
          excludeAuthoritiesByType,
          isIncludedAdminGroup
        })
        .then(handleResponse)
        .then(items => {
          setTabItems({
            ...tabItems,
            [TAB_BY_LEVELS]: items
              .filter(item => item.attributes.shortName !== ALL_USERS_GROUP_SHORT_NAME)
              .map(item => setSelectedItem(item))
          });

          checkIsAllUsersGroupExists();
          setIsRootGroupsFetched(true);
        });
    }
  }, [isRootGroupsFetched, isSelectModalOpen, currentTab]);

  // fetch "all" group list (all users)
  useEffect(() => {
    if (!isAllUsersGroupsFetched && isSelectModalOpen && currentTab === TAB_ALL_USERS) {
      OrgStructApi.getUserList(searchText, userSearchExtraFields).then(items => {
        setTabItems({
          ...tabItems,
          [TAB_ALL_USERS]: items.map(item => setSelectedItem(item))
        });

        checkIsAllUsersGroupExists();
        setIsAllUsersGroupFetched(true);
      });
    }
  }, [isAllUsersGroupsFetched, isSelectModalOpen, currentTab, searchText, userSearchExtraFields]);

  // reset isSelectedFetched if new previewValue
  useEffect(() => {
    if (isEqual(prevDefaultValue, defaultValue)) {
      return;
    }

    setIsSelectedFetched(false);
  }, [defaultValue]);

  // set default value
  useEffect(() => {
    if (isSelectedFetched) {
      return;
    }

    setIsSelectedFetched(true);

    let initValue;
    const promises = [];

    if (multiple && Array.isArray(defaultValue) && defaultValue.length > 0) {
      initValue = [...defaultValue];
    } else if (!multiple && Array.isArray(defaultValue)) {
      initValue = defaultValue.length > 0 ? [defaultValue[0]] : [];
    } else if (!multiple && !!defaultValue) {
      initValue = [defaultValue];
    } else {
      initValue = [];
    }

    if (Array.isArray(initValue)) {
      for (let i = 0; i < initValue.length; i++) {
        promises.push(orgStructApi.fetchAuthority(initValue[i]));
      }

      Promise.all(promises)
        .then(handleResponse)
        .then(items => {
          return items.map(item => prepareSelected(item));
        })
        .then(selectedItems => {
          setTabItems({
            ...tabItems,
            [TAB_ONLY_SELECTED]: [...selectedItems],
            [TAB_BY_LEVELS]: tabItems[TAB_BY_LEVELS].map(item => setSelectedItem(item, selectedItems)),
            [TAB_ALL_USERS]: tabItems[TAB_ALL_USERS].map(item => setSelectedItem(item, selectedItems))
          });
          setSelectedRows([...selectedItems]);
        });
    }
  }, [isSelectedFetched]);

  useEffect(() => {
    !targetId && setTargetId(uniqueId('SelectOrgstruct_'));
  }, [targetId]);

  return (
    <SelectOrgstructContext.Provider
      value={{
        orgStructApi,
        controlProps: {
          ...controlProps
        },
        selectedRows,
        error: null,

        isSelectModalOpen,
        searchText,
        currentTab,
        tabItems,
        isAllUsersGroupsExists,
        modalTitle,
        liveSearch,
        hideTabSwitcher,
        targetId,

        renderListItem: item => {
          if (typeof renderListItem === 'function') {
            return renderListItem(item);
          }

          return item.label;
        },

        toggleSelectModal: () => {
          toggleSelectModal(!isSelectModalOpen);

          if (isSelectModalOpen) {
            if (typeof onCancelSelect === 'function') {
              onCancelSelect();
            }
          }
        },

        onCancelSelect: () => {
          setTabItems({
            ...tabItems,
            [TAB_ONLY_SELECTED]: [...selectedRows],
            [TAB_BY_LEVELS]: tabItems[TAB_BY_LEVELS].map(item => setSelectedItem(item, selectedRows)),
            [TAB_ALL_USERS]: tabItems[TAB_ALL_USERS].map(item => setSelectedItem(item, selectedRows))
          });

          toggleSelectModal(false);

          if (typeof onCancelSelect === 'function') {
            onCancelSelect();
          }
        },

        deleteSelectedItem: targetId => {
          const selectedFiltered = tabItems[TAB_ONLY_SELECTED].filter(item => item.id !== targetId);
          setTabItems({
            ...tabItems,
            [TAB_ONLY_SELECTED]: selectedFiltered,
            [TAB_BY_LEVELS]: tabItems[TAB_BY_LEVELS].map(item => {
              if (item.id !== targetId) {
                return item;
              }

              return {
                ...item,
                isSelected: false
              };
            }),
            [TAB_ALL_USERS]: tabItems[TAB_ALL_USERS].map(item => {
              if (item.id !== targetId) {
                return item;
              }

              return {
                ...item,
                isSelected: false
              };
            })
          });

          setSelectedRows(selectedRows.filter(item => item.id !== targetId));

          const { onChange } = controlProps;
          if (typeof onChange === 'function') {
            let newValue;
            if (multiple) {
              newValue = selectedFiltered.map(item => item.id);
            } else {
              newValue = selectedFiltered.length > 0 ? selectedFiltered[0]['id'] : '';
            }

            onChange(newValue);
          }
        },

        updateSearchText: e => {
          updateSearchText(e.target.value);

          if (liveSearch) {
            liveSearchDebounce();
          }
        },

        onSelect: () => {
          const { onChange } = controlProps;

          let newValue;
          if (multiple) {
            newValue = tabItems[TAB_ONLY_SELECTED].map(item => (getFullData ? item : item.id));
          } else {
            newValue =
              tabItems[TAB_ONLY_SELECTED].length > 0
                ? getFullData
                  ? tabItems[TAB_ONLY_SELECTED][0]
                  : tabItems[TAB_ONLY_SELECTED][0]['id']
                : '';
          }

          typeof onChange === 'function' && onChange(newValue);

          setSelectedRows([...tabItems[TAB_ONLY_SELECTED]]);

          toggleSelectModal(false);
        },

        onSubmitSearchForm,

        setCurrentTab: tabId => {
          setCurrentTab(tabId);
        },

        onToggleSelectItem: targetItem => {
          const itemIdx = tabItems[TAB_ONLY_SELECTED].findIndex(item => item.id === targetItem.id);

          if (itemIdx === -1) {
            setTabItems({
              ...tabItems,
              [TAB_ONLY_SELECTED]: multiple ? [...tabItems[TAB_ONLY_SELECTED], prepareSelected(targetItem)] : [prepareSelected(targetItem)],
              [TAB_BY_LEVELS]: tabItems[TAB_BY_LEVELS].map(item => {
                if (item.id === targetItem.id) {
                  return {
                    ...item,
                    isSelected: true
                  };
                }

                if (!multiple) {
                  return {
                    ...item,
                    isSelected: false
                  };
                }

                return item;
              }),
              [TAB_ALL_USERS]: tabItems[TAB_ALL_USERS].map(item => {
                if (item.id === targetItem.id) {
                  return {
                    ...item,
                    isSelected: true
                  };
                }

                if (!multiple) {
                  return {
                    ...item,
                    isSelected: false
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
              }),
              [TAB_ALL_USERS]: tabItems[TAB_ALL_USERS].map(item => {
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
              .fetchGroup({
                query: { groupName },
                excludeAuthoritiesByName,
                excludeAuthoritiesByType,
                isIncludedAdminGroup
              })
              .then(handleResponse)
              .then(items => items.map(item => setSelectedItem(item, tabItems[TAB_ONLY_SELECTED], { parentId: targetItem.id })))
              .then(newItems => {
                setTabItems({
                  ...tabItems,
                  [currentTab]: tabItems[currentTab]
                    .slice(0, itemIdx)
                    .concat([
                      {
                        ...targetItem,
                        hasChildren: newItems.length > 0, // If no children, make not collapsible
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
    </SelectOrgstructContext.Provider>
  );
};

SelectOrgstructProvider.propTypes = {
  controlProps: PropTypes.shape({
    defaultValue: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.string), PropTypes.string]),
    onChange: PropTypes.func,
    onError: PropTypes.func,
    multiple: PropTypes.bool,
    isCompact: PropTypes.bool,
    isIncludedAdminGroup: PropTypes.bool
  }),
  orgStructApi: PropTypes.instanceOf(OrgStructApi)
};
