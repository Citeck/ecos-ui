import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

import { OrgStructApi, ROOT_ORGSTRUCT_GROUP } from '../../../../api/orgStruct';
import { TAB_BY_LEVELS, TAB_ALL_USERS, TAB_ONLY_SELECTED, ALL_USERS_GROUP_SHORT_NAME, AUTHORITY_TYPE_USER } from './constants';
import { handleResponse, prepareSelected } from './helpers';

export const SelectOrgstructContext = React.createContext();

export const SelectOrgstructProvider = props => {
  const { orgStructApi, controlProps } = props;
  const {
    multiple,
    defaultValue,
    allUsersGroup,
    allowedAuthorityTypes,
    openByDefault,
    onCancelSelect,
    modalTitle,
    getFullData,
    defaultTab = TAB_BY_LEVELS,
    liveSearch
  } = controlProps;
  const allUsersGroupShortName = allUsersGroup || ALL_USERS_GROUP_SHORT_NAME;

  const [isSelectModalOpen, toggleSelectModal] = useState(openByDefault);
  const [currentTab, setCurrentTab] = useState(defaultTab);
  const [isRootGroupsFetched, setIsRootGroupsFetched] = useState(false);
  const [searchText, updateSearchText] = useState('');
  const [selectedRows, setSelectedRows] = useState([]);
  const [tabItems, setTabItems] = useState({
    [TAB_BY_LEVELS]: [],
    [TAB_ALL_USERS]: [],
    [TAB_ONLY_SELECTED]: []
  });

  const [isAllUsersGroupsExists, setIsAllUsersGroupsExists] = useState(false);
  const [isAllUsersGroupsFetched, setIsAllUsersGroupFetched] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const onSubmitSearchForm = (search = searchText) => {
    // TODO: https://citeck.atlassian.net/browse/ECOSCOM-2129
    const trimSearchText = search.trim();

    orgStructApi
      .fetchGroup({
        groupName: ROOT_ORGSTRUCT_GROUP,
        searchText: trimSearchText
      })
      .then(handleResponse)
      .then(items => {
        const allUsersFiltered = trimSearchText
          ? allUsers.filter(item => {
              return item.label.toUpperCase().indexOf(trimSearchText.toUpperCase()) !== -1;
            })
          : allUsers.map(newItem => {
              return {
                ...newItem,
                isSelected: tabItems[TAB_ONLY_SELECTED].findIndex(item => item.id === newItem.id) !== -1
              };
            });

        setTabItems({
          ...tabItems,
          [TAB_BY_LEVELS]: items
            .filter(item => item.attributes.shortName !== allUsersGroupShortName)
            .map(newItem => {
              return {
                ...newItem,
                isSelected: tabItems[TAB_ONLY_SELECTED].findIndex(item => item.id === newItem.id) !== -1
              };
            }),
          [TAB_ALL_USERS]: allUsersFiltered
        });
      });
  };

  // fetch root group list
  useEffect(() => {
    if (!isRootGroupsFetched && isSelectModalOpen) {
      orgStructApi
        .fetchGroup()
        .then(handleResponse)
        .then(items => {
          setTabItems({
            ...tabItems,
            [TAB_BY_LEVELS]: items
              .filter(item => item.attributes.shortName !== allUsersGroupShortName)
              .map(newItem => {
                return {
                  ...newItem,
                  isSelected: tabItems[TAB_ONLY_SELECTED].findIndex(item => item.id === newItem.id) !== -1
                };
              })
          });

          const allUsersGroupIdx = items.findIndex(item => item.attributes.shortName === allUsersGroupShortName);

          const allowedUsers = allowedAuthorityTypes.indexOf(AUTHORITY_TYPE_USER) !== -1;
          setIsAllUsersGroupsExists(allowedUsers && allUsersGroupIdx !== -1);
          setIsRootGroupsFetched(true);
        });
    }
  }, [isRootGroupsFetched, isSelectModalOpen]);

  // fetch "all" group list (all users)
  useEffect(() => {
    if (!isAllUsersGroupsFetched && currentTab === TAB_ALL_USERS) {
      orgStructApi
        .fetchGroup({
          groupName: allUsersGroupShortName
        })
        .then(handleResponse)
        .then(items => {
          const allUsersList = items.map(newItem => {
            return {
              ...newItem,
              isSelected: tabItems[TAB_ONLY_SELECTED].findIndex(item => item.id === newItem.id) !== -1
            };
          });

          let allUsersListFiltered = [...allUsersList];
          const trimSearchText = searchText.trim();
          if (trimSearchText) {
            allUsersListFiltered = allUsersList.filter(item => {
              return item.label.toUpperCase().indexOf(trimSearchText.toUpperCase()) !== -1;
            });
          }

          setTabItems({
            ...tabItems,
            [TAB_ALL_USERS]: allUsersListFiltered
          });

          setAllUsers(allUsersList);
          setIsAllUsersGroupFetched(true);
        });
    }
  }, [isAllUsersGroupsFetched, currentTab, searchText]);

  // set default value
  useEffect(() => {
    let initValue;
    if (multiple && Array.isArray(defaultValue) && defaultValue.length > 0) {
      initValue = [...defaultValue];
    } else if (!multiple && Array.isArray(defaultValue)) {
      initValue = defaultValue.length > 0 ? [defaultValue[0]] : [];
    } else if (!multiple && !!defaultValue) {
      initValue = [defaultValue];
    }

    if (Array.isArray(initValue)) {
      const promises = [];
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
            [TAB_BY_LEVELS]: tabItems[TAB_BY_LEVELS].map(newItem => {
              return {
                ...newItem,
                isSelected: selectedItems.findIndex(item => item.id === newItem.id) !== -1
              };
            })
          });

          setSelectedRows([...selectedItems]);
        });
    }
  }, []);

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
            [TAB_BY_LEVELS]: tabItems[TAB_BY_LEVELS].map(newItem => {
              return {
                ...newItem,
                isSelected: selectedRows.findIndex(item => item.id === newItem.id) !== -1
              };
            }),
            [TAB_ALL_USERS]: tabItems[TAB_ALL_USERS].map(newItem => {
              return {
                ...newItem,
                isSelected: selectedRows.findIndex(item => item.id === newItem.id) !== -1
              };
            })
          });

          toggleSelectModal(false);
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

          console.warn('e.target.value => ', e.target.value);

          if (liveSearch) {
            onSubmitSearchForm(e.target.value);
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
    </SelectOrgstructContext.Provider>
  );
};

SelectOrgstructProvider.propTypes = {
  controlProps: PropTypes.shape({
    defaultValue: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.string), PropTypes.string]),
    onChange: PropTypes.func,
    onError: PropTypes.func,
    multiple: PropTypes.bool,
    isCompact: PropTypes.bool
  }),
  orgStructApi: PropTypes.instanceOf(OrgStructApi)
};
