import debounce from 'lodash/debounce';
import get from 'lodash/get';
import isArray from 'lodash/isArray';
import isEmpty from 'lodash/isEmpty';
import isFunction from 'lodash/isFunction';
import PropTypes from 'prop-types';
import React, { useCallback, useContext, useEffect, useState } from 'react';

import { OrgStructApi } from '../../../api/orgStruct';
import { usePrevious } from '../../../hooks';

import { ALL_USERS_GROUP_SHORT_NAME, AUTHORITY_TYPE_USER, DataTypes, ITEMS_PER_PAGE, TabTypes } from './constants';
import {
  handleResponse,
  prepareSelected,
  getAuthRef,
  prepareParentId,
  unionWithPrevious,
  renderUsernameString,
  isHTML,
  getRecordRef,
  stripHTML
} from './helpers';

export const OrgstructContext = React.createContext();

export const useOrgstructContext = () => useContext(OrgstructContext);

export const OrgstructProvider = props => {
  const { orgStructApi, controlProps: controlProps2 } = props;
  const controlProps = {
    ...controlProps2
  };

  const {
    multiple,
    defaultValue,
    allowedAuthorityTypes,
    excludeAuthoritiesByName,
    excludeAuthoritiesByType,
    openByDefault,
    onCancelSelect,
    onSubmit,
    modalTitle,
    getFullData,
    defaultTab,
    liveSearch,
    hideTabSwitcher,
    renderListItem,
    userSearchExtraFields,
    isIncludedAdminGroup,
    dataType,
    rootGroupName,
    parent,
    initSelectedRows,
    allowedGroupTypes
  } = controlProps;

  const [isSelectModalOpen, toggleSelectModal] = useState(openByDefault);
  const [userMask, setUserMask] = useState('');
  const [currentTab, setCurrentTab] = useState(defaultTab || TabTypes.LEVELS);
  const [searchText, updateSearchText] = useState('');
  const [selectedRows, setSelectedRows] = useState(initSelectedRows || []);
  const [isSelectedFetched, setIsSelectedFetched] = useState(true);
  const [isRootGroupsFetched, setIsRootGroupsFetched] = useState(false);
  const [isAllUsersGroupsFetched, setIsAllUsersGroupFetched] = useState(false);
  const [isAllUsersGroupsExists, setIsAllUsersGroupsExists] = useState(undefined);
  const [isSearching, setIsSearching] = useState(false);
  const [applyAndClose, setApplyAndClose] = useState(false);
  const [openedItems, setOpenedItems] = useState({});
  const [tabItems, setTabItems] = useState({
    [TabTypes.LEVELS]: [],
    [TabTypes.USERS]: [],
    [TabTypes.SELECTED]: initSelectedRows ? initSelectedRows : []
  });

  const [pagination, setPagination] = useState({
    page: 1,
    count: ITEMS_PER_PAGE,
    maxCount: 0
  });

  const [groupModal, setGroupModal] = useState(null);
  const [personModal, setPersonModal] = useState(null);

  const [authorityGroups, setAuthorityGroups] = useState(null);

  const onToggleSelectItem = (targetItem, apply) => {
    const isSelectedNow = tabItems[TabTypes.SELECTED].some(item => item.id === targetItem.id);

    const updateSelection = items =>
      items.map(item => {
        if (item.id !== targetItem.id) {
          return multiple ? item : { ...item, isSelected: false };
        }
        return { ...item, isSelected: isSelectedNow ? !item.isSelected : true };
      });

    const newSelected = isSelectedNow
      ? tabItems[TabTypes.SELECTED].filter(item => item.id !== targetItem.id)
      : multiple
        ? [...tabItems[TabTypes.SELECTED], prepareSelected(targetItem)]
        : [prepareSelected(targetItem)];

    setTabItems({
      ...tabItems,
      [TabTypes.SELECTED]: newSelected,
      [TabTypes.LEVELS]: updateSelection(tabItems[TabTypes.LEVELS]),
      [TabTypes.USERS]: updateSelection(tabItems[TabTypes.USERS])
    });

    if (apply) {
      setApplyAndClose(true);
    }
  };

  useEffect(() => {
    if (parent) {
      setAuthorityGroups([{ disp: parent.label, id: parent.id }]);
    }
  }, [parent]);

  const prevDefaultValue = usePrevious(defaultValue);
  const onToggleCollapse = useCallback(
    (targetItem, callback, previousParent) => {
      const itemIdx = tabItems[currentTab].findIndex(item => item.id === targetItem.id);

      if (previousParent) {
        setOpenedItems(prev => ({
          ...prev,
          [targetItem.id]: handleOpenedItems(prev, targetItem.id, previousParent)
        }));
      }

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
            const currentTabValue = tabItems[currentTab];
            const currentItem = {
              ...targetItem,
              hasChildren: newItems.length > 0, // If no children, make not collapsible
              isLoaded: true,
              isOpen: !targetItem.isOpen
            };

            currentTabValue[itemIdx] = currentItem;

            newItems.forEach(newItem => {
              const index = currentTabValue.findIndex(x => x.id === newItem.id);

              if (index === -1) {
                currentTabValue.push(newItem);
              } else {
                currentTabValue[index] = { ...currentTabValue[index], ...newItem };
              }
            });

            setTabItems({
              ...tabItems,
              [currentTab]: currentTabValue
            });
          })
          .then(() => {
            callback && callback();
          });
      } else {
        onUpdateItem({ ...targetItem, isOpen: !targetItem.isOpen });
        callback && callback();
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

  const onUpdateTree = () => {
    setIsRootGroupsFetched(false);
    setIsAllUsersGroupFetched(false);
    setPagination({ ...pagination, page: 1, maxCount: 0 });
  };

  const liveSearchDebounce = debounce(onUpdateTree, 500);

  const handleOpenedItems = (prev, id, parentId) => {
    return isArray(prev[id]) && !isEmpty(prev[id])
      ? prev[id].includes(parentId)
        ? prev[id].filter(item => item !== parentId)
        : [...prev[id], parentId]
      : [parentId];
  };

  const setSelectedItem = (item, selectedItems = tabItems[TabTypes.SELECTED], extra = {}) => {
    return {
      ...item,
      ...extra,
      isSelected: selectedItems.some(selected => item.id === selected.id)
    };
  };

  const checkIsAllUsersGroupExists = () => {
    const allowedUsers = allowedAuthorityTypes.includes(AUTHORITY_TYPE_USER);
    setIsAllUsersGroupsExists(allowedUsers);

    if (!allowedUsers && currentTab === TabTypes.USERS) {
      setCurrentTab(TabTypes.LEVELS);
    }
  };

  const onChangeValue = selectedList => {
    const { onChange } = controlProps;

    const normalize = (arr = []) => {
      if (isEmpty(arr)) return null;
      return multiple ? arr : arr[0] || '';
    };

    const mappedList = selectedList.map(item => {
      if (!item.id) return '';
      if (getFullData) return item;
      return dataType === DataTypes.AUTHORITY ? getAuthRef(item.id) : getRecordRef(item.id);
    });

    const value = normalize(getFullData ? selectedList : mappedList);

    if (isFunction(onChange)) {
      onChange(value, selectedList);
    }
  };

  const onSelect = () => {
    onChangeValue(tabItems[TabTypes.SELECTED]);
    setSelectedRows([...tabItems[TabTypes.SELECTED]]);
    onSubmit && onSubmit(tabItems[TabTypes.SELECTED], authorityGroups);
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

    const excludeAuthoritiesByName2 = [excludeAuthoritiesByName, parent?.attributes.displayName].filter(Boolean).join(', ');

    if (!isRootGroupsFetched && isSelectModalOpen && currentTab === TabTypes.LEVELS) {
      setIsSearching(true);
      orgStructApi
        .fetchGroup({
          query: {
            groupName: rootGroupName,
            searchText: trimSearchText
          },
          excludeAuthoritiesByName: excludeAuthoritiesByName2,
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
  }, [isRootGroupsFetched, isSelectModalOpen, currentTab, searchText]);

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
  // useEffect(() => {
  //   if (isEqual(prevDefaultValue, defaultValue)) {
  //     return;
  //   }

  //   setIsSelectedFetched(false);
  // }, [defaultValue]);

  // set default value
  useEffect(() => {
    if (isSelectedFetched) return;
    setIsSelectedFetched(true);

    let isActive = true;

    const toArray = val => {
      if (!val) return [];
      if (Array.isArray(val)) return multiple ? val : [val[0]];
      return multiple ? [val] : [val];
    };

    const initValue = toArray(defaultValue);

    if (!initValue.length) return;

    Promise.all(initValue.map(item => orgStructApi.fetchAuthority(dataType, item)))
      .then(handleResponse)
      .then(items => items.map(prepareSelected))
      .then(selectedItems => {
        if (!isActive) return;

        setTabItems(prev => ({
          ...prev,
          [TabTypes.SELECTED]: selectedItems,
          [TabTypes.LEVELS]: prev[TabTypes.LEVELS].map(item => setSelectedItem(item, selectedItems)),
          [TabTypes.USERS]: prev[TabTypes.USERS].map(item => setSelectedItem(item, selectedItems))
        }));
        setSelectedRows(selectedItems);
      })
      .catch(error => {
        console.error(error);
      });

    return () => {
      isActive = false;
    };
  }, [isSelectedFetched]);

  useEffect(() => {
    if (applyAndClose) {
      setApplyAndClose(false);
      onSelect();
    }
  }, [applyAndClose]);

  return (
    <OrgstructContext.Provider
      value={{
        orgStructApi,
        controlProps: {
          ...controlProps
        },
        selectedRows,

        isSelectModalOpen,
        searchText,
        currentTab,
        tabItems,
        isAllUsersGroupsExists,
        modalTitle,
        liveSearch,
        hideTabSwitcher,
        isSearching,
        pagination,
        parent,
        allowedGroupTypes,
        excludeAuthoritiesByName,
        excludeAuthoritiesByType,
        isIncludedAdminGroup,

        authorityGroups,
        setAuthorityGroups,

        setCurrentTab,
        onSelect,
        onUpdateTree,

        groupModal,
        setGroupModal,

        personModal,
        setPersonModal,

        renderListItem: item => {
          const authorityType = get(item, 'attributes.authorityType') || '';

          if (authorityType === 'USER' && userMask) {
            const usernameString = renderUsernameString(userMask, { ...(item.attributes || {}) });
            const plainText = stripHTML(usernameString);

            if (isHTML(userMask)) {
              return <div title={plainText} dangerouslySetInnerHTML={{ __html: usernameString }} />;
            }

            return <span title={usernameString}>{usernameString}</span>;
          }

          if (typeof renderListItem === 'function') {
            return renderListItem(item);
          }

          if (item.extraLabel) {
            return (
              <div title={authorityType === 'USER' ? item.label + ` (${item.extraLabel})` : ''}>
                {item.label}
                <span className="select-orgstruct__list-item-label-extra">({item.extraLabel})</span>
              </div>
            );
          }

          return <span title={authorityType === 'USER' ? item.label : ''}>{item.label}</span>;
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

        onToggleSelectItem,

        getItemsByParent: (targetItem, isEditMode = false, hasRootGroupDeleted = false) => {
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

            if (hasRootGroupDeleted) {
              setTabItems({
                ...tabItems,
                [currentTab]: [...tabItems[currentTab].filter(item => item.id !== targetItem.id)]
              });
            }

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
        openedItems,

        onChangePage: ({ page, maxItems }) => {
          setPagination({ ...pagination, page, count: maxItems });
          setIsAllUsersGroupFetched(false);
        },
        initList
      }}
    >
      {props.children}
    </OrgstructContext.Provider>
  );
};

OrgstructProvider.propTypes = {
  controlProps: PropTypes.shape({
    defaultValue: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.string), PropTypes.string]),
    dataType: PropTypes.string,
    onChange: PropTypes.func,
    onError: PropTypes.func,
    multiple: PropTypes.bool,
    isIncludedAdminGroup: PropTypes.bool
  }),
  orgStructApi: PropTypes.instanceOf(OrgStructApi)
};
