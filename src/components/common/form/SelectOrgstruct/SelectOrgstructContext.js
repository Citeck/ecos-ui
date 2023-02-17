import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import isEqual from 'lodash/isEqual';
import isFunction from 'lodash/isFunction';
import debounce from 'lodash/debounce';
import uniqueId from 'lodash/uniqueId';
import isEmpty from 'lodash/isEmpty';
import get from 'lodash/get';

import { OrgStructApi } from '../../../../api/orgStruct';
import { usePrevious } from '../../../../hooks';
import { ALL_USERS_GROUP_SHORT_NAME, AUTHORITY_TYPE_USER, DataTypes, ITEMS_PER_PAGE, TabTypes } from './constants';
import { handleResponse, prepareSelected, getAuthRef, prepareParentId, unionWithPrevious, renderUsernameString, isHTML } from './helpers';

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
  const [userMask, setUserMask] = useState('');
  const [currentTab, setCurrentTab] = useState(defaultTab || TabTypes.LEVELS);
  const [searchText, updateSearchText] = useState('');
  const [selectedRows, setSelectedRows] = useState([]);
  const [isSelectedFetched, setIsSelectedFetched] = useState(false);
  const [isRootGroupsFetched, setIsRootGroupsFetched] = useState(false);
  const [isAllUsersGroupsFetched, setIsAllUsersGroupFetched] = useState(false);
  const [isAllUsersGroupsExists, setIsAllUsersGroupsExists] = useState(undefined);
  const [isSearching, setIsSearching] = useState(false);
  const [targetId, setTargetId] = useState(undefined);
  const [applyAndClose, setApplyAndClose] = useState(false);
  const [tabItems, setTabItems] = useState({
    [TabTypes.LEVELS]: [],
    [TabTypes.USERS]: [],
    [TabTypes.SELECTED]: []
  });
  const [pagination, setPagination] = useState({
    page: 1,
    count: ITEMS_PER_PAGE,
    maxCount: 0
  });
  const prevDefaultValue = usePrevious(defaultValue);
  const onToggleCollapse = useCallback(
    targetItem => {
      const itemIdx = tabItems[currentTab].findIndex(item => item.id === targetItem.id);

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
        onUpdateItem({ ...targetItem, isOpen: !targetItem.isOpen });
      }
    },
    [tabItems, currentTab, setTabItems]
  );

  const onUpdateItem = targetItem => {
    const itemIdx = tabItems[currentTab].findIndex(item => item.id === targetItem.id);

    setTabItems({
      ...tabItems,
      [currentTab]: tabItems[currentTab]
        .slice(0, itemIdx)
        .concat([{ ...targetItem }])
        .concat(tabItems[currentTab].slice(itemIdx + 1))
    });
  };

  const onSubmitSearchForm = () => {
    setIsRootGroupsFetched(false);
    setIsAllUsersGroupFetched(false);
    setPagination({ ...pagination, page: 1, maxCount: 0 });
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
    let value;

    function getVal(arr = []) {
      if (isEmpty(arr)) {
        return null;
      }

      return multiple ? arr : arr[0] || '';
    }

    switch (true) {
      case getFullData: {
        value = getVal(selectedList);
        break;
      }
      case dataType === DataTypes.AUTHORITY: {
        value = getVal(selectedList.map(item => (item.id ? getAuthRef(item.id) : '')));
        break;
      }
      default: {
        value = getVal(selectedList.map(item => item.id));
        break;
      }
    }

    isFunction(onChange) && onChange(value, selectedList);
  };

  const onSelect = () => {
    onChangeValue(tabItems[TabTypes.SELECTED]);
    setSelectedRows([...tabItems[TabTypes.SELECTED]]);
    toggleSelectModal(false);
  };

  const initList = () => {
    const trimSearchText = (searchText || '').trim();
    let livePromise = true;

    setIsSearching(true);
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
        if (!livePromise) {
          return;
        }

        setTabItems({
          ...tabItems,
          [TabTypes.LEVELS]: items
            .filter(item => item.attributes.shortName !== ALL_USERS_GROUP_SHORT_NAME)
            .map(item => setSelectedItem(item))
        });
        checkIsAllUsersGroupExists();
        setIsRootGroupsFetched(true);
        setIsSearching(false);
      });

    return () => (livePromise = false);
  };

  useEffect(() => {
    OrgStructApi.fetchUsernameMask().then(mask => {
      setUserMask(mask);
    });
  });

  // fetch root group list
  useEffect(() => {
    const trimSearchText = (searchText || '').trim();
    let livePromise = true;

    if (!isRootGroupsFetched && isSelectModalOpen && currentTab === TabTypes.LEVELS) {
      setIsSearching(true);
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
          if (!livePromise) {
            return;
          }

          setTabItems({
            ...tabItems,
            [TabTypes.LEVELS]: items
              .filter(item => item.attributes.shortName !== ALL_USERS_GROUP_SHORT_NAME)
              .map(item => setSelectedItem(item))
          });
          checkIsAllUsersGroupExists();
          setIsRootGroupsFetched(true);
          setIsSearching(false);
        });
    }

    return () => (livePromise = false);
  }, [isRootGroupsFetched, isSelectModalOpen, currentTab]);

  // fetch "all" group list (all users)
  useEffect(() => {
    let livePromise = true;

    if (!isAllUsersGroupsFetched && isSelectModalOpen && currentTab === TabTypes.USERS) {
      setIsSearching(true);
      OrgStructApi.getUserList(searchText, userSearchExtraFields, { page: pagination.page - 1, maxItems: pagination.count }).then(
        ({ items, totalCount }) => {
          if (!livePromise) {
            return;
          }

          setTabItems({
            ...tabItems,
            [TabTypes.USERS]: items.map(item => setSelectedItem(item))
          });
          checkIsAllUsersGroupExists();
          setIsAllUsersGroupFetched(true);
          setPagination({ ...pagination, maxCount: totalCount });
          setIsSearching(false);
        }
      );
    }

    return () => (livePromise = false);
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
    let livePromise = true;

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
        .then(items => items.map(prepareSelected))
        .then(selectedItems => {
          if (!livePromise) {
            return;
          }
          setTabItems(prev => ({
            ...prev,
            [TabTypes.SELECTED]: [...selectedItems],
            [TabTypes.LEVELS]: [...prev[TabTypes.LEVELS]].map(item => setSelectedItem(item, selectedItems)),
            [TabTypes.USERS]: [...prev[TabTypes.USERS]].map(item => setSelectedItem(item, selectedItems))
          }));
          setSelectedRows([...selectedItems]);

          livePromise = false;
        })
        .catch(_ => _);
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
        isSearching,
        pagination,

        setCurrentTab,
        onSelect,
        onSubmitSearchForm,

        renderListItem: item => {
          if (get(item, 'attributes.authorityType') === 'USER' && userMask) {
            const usernameString = renderUsernameString(userMask, { ...(item.attributes || {}) });

            if (isHTML(userMask)) {
              return <div dangerouslySetInnerHTML={{ __html: usernameString }} />;
            }

            return usernameString;
          }

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
            isFunction(onCancelSelect) && onCancelSelect();
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

        resetSearchText: e => {
          updateSearchText('');
          liveSearchDebounce();
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

        getItemsByParent: (targetItem, isEditMode = false) => {
          const isUser = targetItem.attributes.authorityType === AUTHORITY_TYPE_USER;
          const parent = tabItems[currentTab].find(i => i.id === targetItem.parentId);

          if (isUser) {
            targetItem = { ...parent };
          }

          if ((!targetItem.hasChildren && targetItem.isOpen) || !targetItem.isLoaded || !targetItem.isOpen) {
            const updatedTargetItem = {
              ...targetItem,
              hasChildren: true,
              isOpen: false,
              isLoaded: false
            };

            onUpdateItem(updatedTargetItem);

            window.setTimeout(() => {
              onToggleCollapse(updatedTargetItem);
            }, 0);

            return;
          }

          if (isEditMode) {
            targetItem = { ...parent };
          }

          const groupName = targetItem.attributes.shortName;

          orgStructApi
            .fetchGroup({
              query: { groupName },
              excludeAuthoritiesByName,
              excludeAuthoritiesByType,
              isIncludedAdminGroup
            })
            .then(handleResponse)
            .then(result => result.map(item => prepareParentId(item, targetItem.id)))
            .then(result => unionWithPrevious(result, tabItems[currentTab]))
            .then(newItems => {
              setTabItems({
                ...tabItems,
                [currentTab]: [...tabItems[currentTab].filter(item => item.parentId !== targetItem.id), ...newItems]
              });
            });
        },

        onToggleCollapse,

        onChangePage: ({ page, maxItems }) => {
          setPagination({ ...pagination, page, count: maxItems });
          setIsAllUsersGroupFetched(false);
        },
        initList
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
