import React from 'react';
import classNames from 'classnames';
import get from 'lodash/get';

import { t } from '../../../helpers/util';
import { Search, Tooltip } from '../../common';
import { IcoBtn } from '../../common/btns';
import { Dropdown } from '../../common/form';
import Export from '../../Export/Export';
import { getCreateVariantKeyField } from '../service/util';
import JournalsDashletPagination from '../JournalsDashletPagination';
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
  grid,
  journalConfig,
  searchText,
  selectedRecords,

  isMobile,
  isCreateLoading,
  isLoading,
  isShowResetFilter,

  onRefresh,
  onSearch,
  onToggleSettings,
  onAddRecord,
  onResetFilter
}) => {
  const grey = 'ecos-btn_i ecos-btn_grey ecos-btn_bgr-inherit ecos-btn_width_auto ecos-btn_hover_t-light-blue';
  const step = classNames('ecos-journal__settings-bar_step', { 'ecos-journal__settings-bar_step-mobile': isMobile });

  const renderCreateMenu = () => {
    const createVariants = get(journalConfig, 'meta.createVariants') || [];

    if (isMobile || !createVariants || !createVariants.length) {
      return null;
    }

    if (createVariants.length === 1) {
      return (
        <Tooltip off={isMobile} target="ecos-journal-settings-bar-create" text={t(Labels.BTN_CREATE)} uncontrolled>
          <IcoBtn
            id="ecos-journal-settings-bar-create"
            loading={isCreateLoading}
            colorLoader="light-blue"
            icon="icon-small-plus"
            className={`ecos-journal__add-record ecos-btn_i ecos-btn_white ecos-btn_hover_blue2 ${step}`}
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

  const getTooltipId = key => 'ecos-journal-settings-bar-' + key;

  return (
    <div className={classNames('ecos-journal__settings-bar', { 'ecos-journal__settings-bar_mobile': isMobile })}>
      {renderCreateMenu()}

      {!isMobile && (
        <Tooltip off={isMobile} target="ecos-journal-settings-bar-settings" text={t(Labels.BTN_SETTINGS)} uncontrolled>
          <IcoBtn
            id="ecos-journal-settings-bar-settings"
            icon={'icon-settings'}
            className={classNames('ecos-btn_i', 'ecos-btn_white', 'ecos-btn_hover_blue2', step, 'ecos-btn_size-by-content')}
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

      <Tooltip off={isMobile} target="ecos-journal-settings-bar-update" text={t(Labels.BTN_UPDATE)} uncontrolled>
        <IcoBtn
          id="ecos-journal-settings-bar-update"
          icon={'icon-reload'}
          className={classNames('ecos-journal__settings-bar-update', step, {
            [grey]: !isMobile,
            'ecos-btn_i ecos-btn_white': isMobile
          })}
          onClick={onRefresh}
        />
      </Tooltip>

      {isShowResetFilter && (
        <Tooltip off={isMobile} target="ecos-journal-settings-bar-reset-filter" text={t(Labels.BTN_FILTER_DEL)} uncontrolled>
          <IcoBtn
            id="ecos-journal-settings-bar-reset-filter"
            icon={'icon-filter-clean'}
            className={classNames('ecos-journal__settings-bar-reset-filter', step, {
              [grey]: !isMobile,
              'ecos-btn_i ecos-btn_white': isMobile
            })}
            onClick={onResetFilter}
          />
        </Tooltip>
      )}

      <div className="ecos-journal__settings-bar_right">
        <JournalsDashletPagination
          stateId={stateId}
          className={classNames('ecos-journal__pagination', step, {
            'ecos-journal__pagination_mobile': isMobile
          })}
        />
        <ViewTabs stateId={stateId} />
      </div>
    </div>
  );
};

export default JournalsSettingsBar;
