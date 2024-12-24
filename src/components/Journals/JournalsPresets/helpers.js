import ListItem from './ListItem';
import get from 'lodash/get';
import isFunction from 'lodash/isFunction';
import React from 'react';
import { isKanban } from '../constants';

export function filterList({ searchText, journalSettings }) {
  const compare = item => new RegExp(`(${searchText})`, 'ig').test(get(item, 'displayName'));
  return !searchText ? journalSettings : journalSettings.filter(compare);
}

export function renderList({ searchText, journalSettings = [], onSelect, onDelete, onEdit }) {
  return filterList({ journalSettings, searchText }).map(item => (
    <ListItem key={get(item, 'id')} onClick={onSelect} onDelete={onDelete} onEdit={onEdit} item={item} />
  ));
}

export function selectedIndex({ journalSetting, journalSettings = [] }) {
  return journalSettings.findIndex(item => item.id === (journalSetting.id || ''));
}

export function onSelect({ setting, journalSetting = [], getJournalsData, openSelectedPreset, kanbanResetFilter, viewMode }) {
  if (journalSetting.id !== setting.id) {
    isFunction(openSelectedPreset) && openSelectedPreset(setting.id);
  } else {
    isFunction(getJournalsData) && getJournalsData({ savePredicate: false, force: true });
    if (isKanban(viewMode)) {
      isFunction(kanbanResetFilter) && kanbanResetFilter();
    }
  }
}
