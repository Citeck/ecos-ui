import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import isFunction from 'lodash/isFunction';
import uniqueId from 'lodash/uniqueId';
import PropTypes from 'prop-types';
import React, { useContext, useEffect, useState } from 'react';

import { TabTypes, DataTypes } from './constants';
import { handleResponse, prepareSelected, getAuthRef, getRecordRef } from './helpers';

import { usePrevious } from '@/hooks';

export const SelectOrgstructContext = React.createContext();

export const useSelectOrgstructContext = () => useContext(SelectOrgstructContext);

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
    rootGroupName,
    allowedGroupTypes
  } = controlProps;

  const [isSelectModalOpen, toggleSelectModal] = useState(openByDefault);
  const [selectedRows, setSelectedRows] = useState([]);
  const [targetId, setTargetId] = useState(undefined);
  const [tabItems, setTabItems] = useState({
    [TabTypes.LEVELS]: [],
    [TabTypes.USERS]: [],
    [TabTypes.SELECTED]: []
  });

  useEffect(() => {
    !targetId && setTargetId(uniqueId('SelectOrgstruct_'));
  }, [targetId]);

  const [isSelectedFetched, setIsSelectedFetched] = useState(false);

  const prevDefaultValue = usePrevious(defaultValue);

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
        .then(items => items.map(prepareSelected))
        .then(selectedItems => {
          setSelectedRows([...selectedItems]);
        })
        .catch(_ => _);
    }
  }, [isSelectedFetched, defaultValue]);

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
        value = getVal(selectedList.map(item => (item.id ? getRecordRef(item.id) : '')));
        break;
      }
    }

    isFunction(onChange) && onChange(value, selectedList);
  };

  return (
    <SelectOrgstructContext.Provider
      value={{
        controlProps: {
          ...controlProps
        },

        allowedGroupTypes,

        multiple,
        defaultValue,
        allowedAuthorityTypes,
        excludeAuthoritiesByName,
        excludeAuthoritiesByType,

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

        selectedRows,
        setSelectedRows,
        error: null,

        isSelectModalOpen,
        targetId,

        toggleSelectModal: () => {
          toggleSelectModal(!isSelectModalOpen);

          if (isSelectModalOpen) {
            isFunction(onCancelSelect) && onCancelSelect();
          }
        },

        onCancelSelect: () => {
          toggleSelectModal(false);

          if (typeof onCancelSelect === 'function') {
            onCancelSelect();
          }
        },

        onChangeValue,

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

          const newSelectedRows = selectedRows.filter(item => item.id !== targetId);

          onChangeValue(newSelectedRows);
          setSelectedRows(newSelectedRows);
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
  })
};
