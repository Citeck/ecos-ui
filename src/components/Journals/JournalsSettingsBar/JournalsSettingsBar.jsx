import React from 'react';
import classNames from 'classnames';
import get from 'lodash/get';

import { t } from '../../../helpers/util';
import { Search, Tooltip } from '../../common';
import { IcoBtn } from '../../common/btns';
import { Dropdown } from '../../common/form';
import Export from '../../Export/Export';
import { getCreateVariantKeyField } from '../service/util';
import ViewTabs from '../ViewTabs';

import './JournalsSettingsBar.scss';

const Labels = {
  BTN_CREATE: 'journals.bar.btn.create',
  BTN_SETTINGS: 'journals.bar.btn.settings-table',
  BTN_EXPORT: 'journals.bar.btn.export',
  BTN_UPDATE: 'journals.bar.btn.update',
  BTN_FILTER_DEL: 'journals.bar.btn.filter-del'
};

const JournalsSettingsBar = ({
  stateId,
  targetId,
  grid,
  journalConfig,
  searchText,
  selectedRecords,

  isMobile,
  isCreateLoading,
  isLoading,
  isShowResetFilter,
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
  const step = classNames('ecos-journal__settings-bar_step', { 'ecos-journal__settings-bar_step-mobile': isMobile });
  const target = str => `${targetId}-${str}`;

  const renderCreateMenu = () => {
    const createVariants = get(journalConfig, 'meta.createVariants') || [];

    if (isMobile || !createVariants || !createVariants.length) {
      return null;
    }

    if (createVariants.length === 1) {
      return (
        <Tooltip off={isMobile} target={target('create')} text={t(Labels.BTN_CREATE)} uncontrolled>
          <IcoBtn
            id={target('create')}
            loading={isCreateLoading}
            colorLoader="light-blue"
            icon="icon-small-plus"
            className={`ecos-journal__add-record ecos-btn_i ecos-btn_white ecos-btn_hover_blue2 ecos-btn_size-by-content ${step}`}
            onClick={() => onAddRecord(createVariants[0])}
          />
        </Tooltip>
      );
    }

    const keyFields = getCreateVariantKeyField(createVariants[0]);

    return (
      <Dropdown
        hasEmpty
        isStatic
        className={step}
        source={createVariants}
        keyFields={keyFields}
        valueField="destination"
        titleField="title"
        onChange={onAddRecord}
        controlIcon="icon-small-plus"
        controlClassName="ecos-journal__add-record ecos-btn_settings-down ecos-btn_white ecos-btn_hover_blue2"
      />
    );
  };

  return (
    <div className={classNames('ecos-journal__settings-bar', { 'ecos-journal__settings-bar_mobile': isMobile })}>
      {renderCreateMenu()}

      {!isMobile && (
        <Tooltip off={isMobile} target={target('settings')} text={t(nameBtnSettings || Labels.BTN_SETTINGS)} uncontrolled>
          <IcoBtn
            id={target('settings')}
            icon={'icon-settings'}
            className={classNames('ecos-btn_i ecos-btn_white ecos-btn_hover_blue2 ecos-btn_size-by-content', step)}
            onClick={onToggleSettings}
            loading={isLoading}
          />
        </Tooltip>
      )}

      <Search
        onSearch={onSearch}
        className={`ecos-journal__settings-bar-search search_border-white ${step}`}
        collapsed={isMobile}
        text={searchText}
        cleaner
      />

      <Export
        journalConfig={journalConfig}
        grid={grid}
        className={classNames('ecos-journal__settings-bar-export', step)}
        selectedItems={selectedRecords}
      >
        <IcoBtn
          invert
          icon={isMobile ? 'icon-download' : 'icon-small-down'}
          className={classNames('ecos-btn_hover_blue2 ecos-btn_r_6', {
            'ecos-btn_drop-down ecos-btn_grey3': !isMobile,
            'ecos-btn_i ecos-btn_white': isMobile
          })}
        >
          {!isMobile && t(Labels.BTN_EXPORT)}
        </IcoBtn>
      </Export>

      <Tooltip off={isMobile} target={target('update')} text={t(Labels.BTN_UPDATE)} uncontrolled>
        <IcoBtn
          id={target('update')}
          icon={'icon-reload'}
          className={classNames('ecos-journal__settings-bar-update', step, {
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
            className={classNames('ecos-journal__settings-bar-reset-filter', step, {
              [grey]: !isMobile,
              'ecos-btn_i ecos-btn_white': isMobile
            })}
            onClick={onResetFilter}
          />
        </Tooltip>
      )}
      {leftChild}

      <div className="ecos-journal__settings-bar_right">
        {rightChild}
        <ViewTabs stateId={stateId} />
      </div>
    </div>
  );
};

export default JournalsSettingsBar;
