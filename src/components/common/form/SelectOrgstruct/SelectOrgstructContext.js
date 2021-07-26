import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import isEqual from 'lodash/isEqual';
import debounce from 'lodash/debounce';
import uniqueId from 'lodash/uniqueId';

import { OrgStructApi } from '../../../../api/orgStruct';
import { usePrevious } from '../../../../hooks/usePrevious';
import { ALL_USERS_GROUP_SHORT_NAME, AUTHORITY_TYPE_USER, DataTypes, ROOT_GROUP_NAME, TabTypes } from './constants';
import { handleResponse, prepareSelected } from './helpers';

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
    isIncludedAdminGroup,
    dataType,
    rootGroupName
  } = controlProps;

  const [isSelectModalOpen, toggleSelectModal] = useState(openByDefault);
  const [currentTab, setCurrentTab] = useState(defaultTab || TabTypes.LEVELS);
  const [searchText, updateSearchText] = useState('');
  const [selectedRows, setSelectedRows] = useState([]);
  const [isSelectedFetched, setIsSelectedFetched] = useState(false);
  const [isRootGroupsFetched, setIsRootGroupsFetched] = useState(false);
  const [isAllUsersGroupsFetched, setIsAllUsersGroupFetched] = useState(false);
  const [isAllUsersGroupsExists, setIsAllUsersGroupsExists] = useState(undefined);
  const [targetId, setTargetId] = useState(undefined);
  const [applyAndClose, setApplyAndClose] = useState(false);
  const [tabItems, setTabItems] = useState({
    [TabTypes.LEVELS]: [],
    [TabTypes.USERS]: [],
    [TabTypes.SELECTED]: []
  });
  const prevDefaultValue = usePrevious(defaultValue);

  const onSubmitSearchForm = () => {
    setIsRootGroupsFetched(false);
    setIsAllUsersGroupFetched(false);
  };

  const liveSearchDebounce = debounce(onSubmitSearchForm, 500);

  const setSelectedItem = (item, selectedItems = tabItems[TabTypes.SELECTED], extra = {}) => ({
    ...item,
    ...extra,
    isSelected: selectedItems.some(selected => item.id === selected.id)
  });

  const checkIsAllUsersGroupExists = () => {
    const allowedUsers = allowedAuthorityTypes.includes(AUTHORITY_TYPE_USER);
    setIsAllUsersGroupsExists(allowedUsers);

    if (!allowedUsers && currentTab === TabTypes.USERS) {
      setCurrentTab(TabTypes.LEVELS);
    }
  };

  const onChangeValue = selectedList => {
    const { onChange } = controlProps;
    let valuePromise;

    function getVal(arr = []) {
      return multiple ? arr : arr[0] || '';
    }

    switch (true) {
      case getFullData: {
        valuePromise = Promise.resolve(getVal(selectedList));
        break;
      }
      case dataType === DataTypes.AUTHORITY: {
        valuePromise = Promise.all(selectedList.map(item => item.id && orgStructApi.fetchAuthName(item.id))).then(getVal);
        break;
      }
      default: {
        valuePromise = Promise.resolve(getVal(selectedList.map(item => item.id)));
        break;
      }
    }

    valuePromise.then(value => typeof onChange === 'function' && onChange(value));
  };

  const onSelect = () => {
    onChangeValue(tabItems[TabTypes.SELECTED]);
    setSelectedRows([...tabItems[TabTypes.SELECTED]]);
    toggleSelectModal(false);
  };

  // fetch root group list
  useEffect(() => {
    const trimSearchText = (searchText || '').trim();

    if (!isRootGroupsFetched && isSelectModalOpen && currentTab === TabTypes.LEVELS) {
      orgStructApi
        .fetchGroup({
          query: {
            groupName: rootGroupName,
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
            [TabTypes.LEVELS]: items
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
    if (!isAllUsersGroupsFetched && isSelectModalOpen && currentTab === TabTypes.USERS) {
      OrgStructApi.getUserList(searchText, userSearchExtraFields).then(items => {
        setTabItems({
          ...tabItems,
          [TabTypes.USERS]: items.map(item => setSelectedItem(item))
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
      const promises = initValue.map(item => orgStructApi.fetchAuthority(dataType, item));

      Promise.all(promises)
        .then(handleResponse)
        .then(items => {
          return items.map(item => prepareSelected(item));
        })
        .then(selectedItems => {
          setTabItems({
            ...tabItems,
            [TabTypes.SELECTED]: [...selectedItems],
            [TabTypes.LEVELS]: tabItems[TabTypes.LEVELS].map(item => setSelectedItem(item, selectedItems)),
            [TabTypes.USERS]: tabItems[TabTypes.USERS].map(item => setSelectedItem(item, selectedItems))
          });
          setSelectedRows([...selectedItems]);
        });
    }
  }, [isSelectedFetched]);

  useEffect(() => {
    !targetId && setTargetId(uniqueId('SelectOrgstruct_'));
  }, [targetId]);

  useEffect(() => {
    if (applyAndClose) {
      setApplyAndClose(false);
      onSelect();
    }
  });

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

        setCurrentTab,
        onSelect,
        onSubmitSearchForm,

        renderListItem: item => {
          if (typeof renderListItem === 'function') {
            return renderListItem(item);
          }

          if (item.extraLabel) {
            return (
              <>
                {item.label}
                <span className="select-orgstruct__list-item-label-extra">({item.extraLabel})</span>
              </>
            );
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
            [TabTypes.SELECTED]: [...selectedRows],
            [TabTypes.LEVELS]: tabItems[TabTypes.LEVELS].map(item => setSelectedItem(item, selectedRows)),
            [TabTypes.USERS]: tabItems[TabTypes.USERS].map(item => setSelectedItem(item, selectedRows))
          });

          toggleSelectModal(false);

          if (typeof onCancelSelect === 'function') {
            onCancelSelect();
          }
        },

        deleteSelectedItem: targetId => {
          const selectedFiltered = tabItems[TabTypes.SELECTED].filter(item => item.id !== targetId);
          setTabItems({
            ...tabItems,
            [TabTypes.SELECTED]: selectedFiltered,
            [TabTypes.LEVELS]: tabItems[TabTypes.LEVELS].map(item => {
              if (item.id !== targetId) {
                return item;
              }

              return {
                ...item,
                isSelected: false
              };
            }),
            [TabTypes.USERS]: tabItems[TabTypes.USERS].map(item => {
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
          onChangeValue(selectedFiltered);
        },

        updateSearchText: e => {
          updateSearchText(e.target.value);

          if (liveSearch) {
            liveSearchDebounce();
          }
        },

        onToggleSelectItem: (targetItem, apply) => {
          const itemIdx = tabItems[TabTypes.SELECTED].findIndex(item => item.id === targetItem.id);

          if (itemIdx === -1) {
            setTabItems({
              ...tabItems,
              [TabTypes.SELECTED]: multiple ? [...tabItems[TabTypes.SELECTED], prepareSelected(targetItem)] : [prepareSelected(targetItem)],
              [TabTypes.LEVELS]: tabItems[TabTypes.LEVELS].map(item => {
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
              [TabTypes.USERS]: tabItems[TabTypes.USERS].map(item => {
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
              [TabTypes.SELECTED]: tabItems[TabTypes.SELECTED].slice(0, itemIdx).concat(tabItems[TabTypes.SELECTED].slice(itemIdx + 1)),
              [TabTypes.LEVELS]: tabItems[TabTypes.LEVELS].map(item => {
                if (item.id === targetItem.id) {
                  return {
                    ...item,
                    isSelected: !item.isSelected
                  };
                }

                return item;
              }),
              [TabTypes.USERS]: tabItems[TabTypes.USERS].map(item => {
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

          if (apply) {
            setApplyAndClose(true);
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
              .then(items => items.map(item => setSelectedItem(item, tabItems[TabTypes.SELECTED], { parentId: targetItem.id })))
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
    dataType: PropTypes.string,
    onChange: PropTypes.func,
    onError: PropTypes.func,
    multiple: PropTypes.bool,
    isCompact: PropTypes.bool,
    isIncludedAdminGroup: PropTypes.bool
  }),
  orgStructApi: PropTypes.instanceOf(OrgStructApi)
};
