import React, { useMemo } from 'react';
import classNames from 'classnames';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';

import { t } from '../../../helpers/util';
import { Search, Tooltip } from '../../common';
import { IcoBtn } from '../../common/btns';
import Export from '../../Export/Export';
import GroupActions from '../GroupActions';
import ViewTabs from '../ViewTabs';
import CreateMenu from './CreateMenu';
import { Predicate } from '../../Filters/predicates';

import './JournalsSettingsBar.scss';

const Labels = {
  BTN_CREATE: 'journals.bar.btn.create',
  BTN_SETTINGS: 'journals.bar.btn.settings-table',
  BTN_EXPORT: 'journals.bar.btn.export',
  BTN_UPDATE: 'journals.bar.btn.update',
  BTN_FILTER_DEL: 'journals.bar.btn.filter-del'
};

function getVal(predicate) {
  if (Array.isArray(predicate)) {
    if (Predicate.isPredicate(predicate[0]) && predicate.length > 1) {
      return predicate;
    }

    return getVal(predicate[0].val);
  }

  if (Predicate.isPredicate(predicate)) {
    return getVal(predicate.val);
  }

  return predicate;
}

const checkIsEmptyValue = predicate => {
  return predicate.val === '' || predicate.val === null || predicate.val === undefined;
};

const checkIsDefault = predicate => {
  if (!predicate) {
    return true;
  }

  const predicates = getVal(get(predicate, 'val'));

  if (!predicates) {
    return true;
  }

  if (Array.isArray(predicates)) {
    return predicates.every(checkIsEmptyValue);
  }

  if (Predicate.isPredicate(predicates)) {
    return checkIsEmptyValue(predicates);
  }

  return predicates === '' || predicates === null || predicates === undefined;
};

const JournalsSettingsBar = ({
  stateId,
  targetId,
  grid,
  journalConfig,
  predicate,
  searchText,
  selectedRecords,

  isMobile,
  isCreateLoading,
  isLoading,
  isShowResetFilter,
  noGroupActions,

  leftChild,
  rightChild,

  nameBtnSettings,

  onRefresh,
  onSearch,
  onToggleSettings,
  onAddRecord,
  onResetFilter
}) => {
  const grey = 'ecos-btn_i ecos-btn_grey ecos-btn_bgr-inherit ecos-btn_width_auto ecos-btn_hover_t-light-blue';
  const createVariants = get(journalConfig, 'meta.createVariants') || [];
  const noCreateMenu = isMobile || isEmpty(createVariants);
  const target = str => `${targetId}-${str}`;
  const isDefaultSettings = useMemo(() => checkIsDefault(predicate), [predicate]);

  return (
    <>
      <div className={classNames('ecos-journal__settings-bar', { 'ecos-journal__settings-bar_mobile': isMobile })}>
        {!noCreateMenu && <CreateMenu createIsLoading={isCreateLoading} createVariants={createVariants} onAddRecord={onAddRecord} />}

        {!isMobile && (
          <Tooltip off={isMobile} target={target('settings')} text={t(nameBtnSettings || Labels.BTN_SETTINGS)} uncontrolled>
            <IcoBtn
              id={target('settings')}
              icon={'icon-settings'}
              className={classNames('ecos-btn_i ecos-btn_white ecos-btn_hover_blue2 ecos-btn_size-by-content', {
                'ecos-btn-settings-filter-on': !isDefaultSettings
              })}
              onClick={onToggleSettings}
              loading={isLoading}
            />
          </Tooltip>
        )}

        <Search
          onSearch={onSearch}
          className="ecos-journal__settings-bar-search search_border-white"
          collapsed={isMobile}
          text={searchText}
          cleaner
        />

        {!isMobile && !noGroupActions && <GroupActions stateId={stateId} />}

        <Export
          journalConfig={journalConfig}
          grid={grid}
          className="ecos-journal__settings-bar-export"
          classNameBtn="ecos-btn_i ecos-journal__settings-bar-export-btn"
          selectedItems={selectedRecords}
        >
          {!isMobile && (
            <IcoBtn
              invert
              icon="icon-small-down"
              className="ecos-journal__settings-bar-export-btn ecos-btn_hover_blue2 ecos-btn_drop-down ecos-btn_grey3"
              loading={isLoading}
            >
              {t(Labels.BTN_EXPORT)}
            </IcoBtn>
          )}
        </Export>

        <Tooltip off={isMobile} target={target('update')} text={t(Labels.BTN_UPDATE)} uncontrolled>
          <IcoBtn
            id={target('update')}
            icon={'icon-reload'}
            className={classNames('ecos-journal__settings-bar-update', {
              [grey]: !isMobile,
              'ecos-btn_i ecos-btn_white': isMobile
            })}
            onClick={onRefresh}
          />
        </Tooltip>

        {isShowResetFilter && (
          <Tooltip off={isMobile} target={target('reset-filter')} text={t(Labels.BTN_FILTER_DEL)} uncontrolled>
            <IcoBtn
              id={target('reset-filter')}
              icon={'icon-filter-clean'}
              className={classNames('ecos-journal__settings-bar-reset-filter', {
                [grey]: !isMobile,
                'ecos-btn_i ecos-btn_white': isMobile
              })}
              onClick={onResetFilter}
            />
          </Tooltip>
        )}

        {leftChild}
        <div className="ecos-journal__settings-bar-right-side">
          {rightChild}
          <ViewTabs stateId={stateId} />
        </div>
      </div>

      <div className={classNames('ecos-journal__settings-bar-extra', { 'ecos-journal__settings-bar-extra_mobile': isMobile })}>
        {isMobile && <GroupActions stateId={stateId} />}
      </div>
    </>
  );
};

export default JournalsSettingsBar;
