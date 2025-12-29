import classNames from 'classnames';
import get from 'lodash/get';
import React, { useContext, useEffect, useRef, useState } from 'react';

import Input from '../../../form/Input';
import Icon from '../../../icons/Icon';
import { OrgstructContext } from '../../OrgstructContext';

import { Avatar } from '@/components/common';
import { TabTypes } from '@/components/common/Orgstruct/constants';
import ChevronDown from '@/components/common/icons/ChevronDown';
import { t } from '@/helpers/util';

import './Search.scss';

const Labels = {
  PLACEHOLDER: 'select-orgstruct.search.placeholder'
};

const MAX_SELECTED_ITEMS_IN_SEARCH = 3;
const MAX_COUNT_VIEW_SELECTED_ITEMS = 10;

const Search = () => {
  const [isOpenOtherUsersMenu, setIsOpenOtherUsersMenu] = useState(false);
  const context = useContext(OrgstructContext);
  const {
    searchText,
    updateSearchText,
    onUpdateTree,
    resetSearchText,
    onToggleSelectItem,
    tabItems: { [TabTypes.SELECTED]: selectedItems = [] }
  } = context;
  const inputRef = useRef(null);
  const isMoreSelectedItems = selectedItems.length > 1;

  useEffect(() => {
    if (inputRef.current && typeof inputRef.current.focus === 'function') {
      inputRef.current.focus();
    }

    document.addEventListener('click', closeIsOpenOtherUsersMenu);
    return () => document.removeEventListener('click', closeIsOpenOtherUsersMenu);
  }, []);

  const onSearchIconClick = () => {
    inputRef.current.focus();
  };

  const onKeyDown = e => {
    if (e.key === 'Enter') {
      onUpdateTree();
    }
  };

  const onChange = e => {
    updateSearchText(e);
  };

  const onMouseDown = (e, item) => {
    if (e.button === 1) {
      e.preventDefault();
      toggleSelectItem(e, item);
    }
  };

  const closeIsOpenOtherUsersMenu = () => setIsOpenOtherUsersMenu(false);
  const toggleIsOpenOtherUsersMenu = e => {
    e.stopPropagation();
    setIsOpenOtherUsersMenu(!isOpenOtherUsersMenu);
  };

  const toggleSelectItem = (e, item) => {
    e.stopPropagation();
    onToggleSelectItem(item);
  };

  const renderFirstSelectedUsers = () =>
    selectedItems.map(
      (selectedItem, index) =>
        index < MAX_SELECTED_ITEMS_IN_SEARCH && (
          <div
            key={selectedItem.id}
            title={selectedItem.label}
            onMouseDown={e => onMouseDown(e, selectedItem)}
            className="select-orgstruct__search-selected-items_item"
          >
            <span className="select-orgstruct__search-selected-items_item_text">{selectedItem.label}</span>
            <Icon
              className={classNames('icon-small-close select-orgstruct__search-cleaner small')}
              onClick={e => toggleSelectItem(e, selectedItem)}
            />
          </div>
        )
    );

  const renderOtherSelectedUser = () =>
    selectedItems.length > MAX_SELECTED_ITEMS_IN_SEARCH && (
      <div
        onClick={toggleIsOpenOtherUsersMenu}
        className={classNames('select-orgstruct__search-selected-items_item other-users', { opened: isOpenOtherUsersMenu })}
      >
        <span className="select-orgstruct__search-selected-items_item_text">
          {selectedItems.length <= MAX_COUNT_VIEW_SELECTED_ITEMS
            ? `+${selectedItems.length - MAX_SELECTED_ITEMS_IN_SEARCH}`
            : `${MAX_COUNT_VIEW_SELECTED_ITEMS}+`}
        </span>
        <ChevronDown />
        {isOpenOtherUsersMenu && (
          <ul className="select-orgstruct__search-selected-items-user-list">
            {selectedItems.slice(MAX_SELECTED_ITEMS_IN_SEARCH).map(item => (
              <div
                onMouseDown={e => onMouseDown(e, item)}
                title={item.label}
                className="select-orgstruct__search-selected-items-user-list_item"
              >
                <div className="select-orgstruct__search-selected-items-user-list_item_info-container">
                  <Avatar
                    className="select-orgstruct__search-selected-items-user-list_item_photo"
                    userName={item.label}
                    url={get(item, 'attributes.photo')}
                    noBorder
                    countSymbols={1}
                  />
                  <span className="select-orgstruct__search-selected-items_item_text">{item.label}</span>
                </div>
                <Icon
                  className={classNames('icon-small-close select-orgstruct__search-cleaner small')}
                  onClick={e => toggleSelectItem(e, item)}
                />
              </div>
            ))}
          </ul>
        )}
      </div>
    );

  return (
    <div className="select-orgstruct__search">
      <div
        className={classNames('select-orgstruct__search-wrapper', {
          moreSelect: isMoreSelectedItems,
          noMoreSelect: !isMoreSelectedItems
        })}
      >
        <Icon className="icon icon-search select-orgstruct__search-icon" onClick={onSearchIconClick} />
        <Input
          getInputRef={el => {
            inputRef.current = el?.current ?? el;
          }}
          placeholder={t(Labels.PLACEHOLDER)}
          onKeyDown={onKeyDown}
          className="select-orgstruct__search-input"
          value={searchText}
          onChange={onChange}
        >
          <div className="select-orgstruct__search-selected">
            <Icon
              className={classNames('icon-small-close select-orgstruct__search-cleaner', {
                moreSelected: isMoreSelectedItems,
                'select-orgstruct__search-cleaner_show': !!searchText
              })}
              onClick={resetSearchText}
            />
            {selectedItems.length > 0 && (
              <div className="select-orgstruct__search-selected-items">
                {renderFirstSelectedUsers()}
                {renderOtherSelectedUser()}
              </div>
            )}
          </div>
        </Input>
      </div>
    </div>
  );
};

export default Search;
