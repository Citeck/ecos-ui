import get from 'lodash/get';
import isFunction from 'lodash/isFunction';
import uniqueId from 'lodash/uniqueId';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import FormManager from '../../EcosForm/FormManager';
import JournalsSettingsBar from '../JournalsSettingsBar';

import SettingsModal from './SettingsModal';

import { JournalUrlParams as JUP } from '@/constants';
import { getSearchParams, goToCardDetailsPage, removeUrlSearchParams } from '@/helpers/urls';

class Bar extends Component {
  targetId = uniqueId('ecos-journal-settings-bar-');

  state = {
    isReset: false,
    settingsVisible: false,
    isCreateLoading: false
  };

  getSearchText() {
    const { isActivePage, urlParams } = this.props;
    return !isActivePage ? '' : get(getSearchParams(), JUP.SEARCH, get(urlParams, JUP.SEARCH, ''));
  }

  handleToggleSettings = () => {
    this.setState(({ settingsVisible }) => ({ settingsVisible: !settingsVisible, isReset: false }));
  };

  handleApplySettings = (isChangedPredicates, settings) => {
    const { clearSearch, applySettings } = this.props;

    isFunction(applySettings) && applySettings({ settings });

    if (isChangedPredicates) {
      const url = removeUrlSearchParams(window.location.href, JUP.SEARCH);

      window.history.replaceState({ path: url }, '', url);
      isFunction(clearSearch) && clearSearch();
    }

    this.handleToggleSettings();
  };

  handleCreateSettings = settings => {
    const {
      journalConfig: { id },
      createJournalSetting
    } = this.props;

    isFunction(createJournalSetting) && createJournalSetting(id, settings, this.handleToggleSettings);
  };

  handleSaveSettings = (id, settings, callback) => {
    const { saveJournalSetting } = this.props;

    isFunction(saveJournalSetting) && saveJournalSetting(id, settings, callback);
  };

  handleRefresh = () => {
    const { deselectAllRecords, reloadGrid } = this.props;
    isFunction(deselectAllRecords) && deselectAllRecords();
    isFunction(reloadGrid) && reloadGrid();
  };

  handleSearch = text => {
    const { urlParams, runSearch } = this.props;

    if (text === get(urlParams, [JUP.SEARCH], '')) {
      return;
    }

    isFunction(runSearch) && runSearch(text);
  };

  handleAddRecord = createVariant => {
    const { isCreateLoading } = this.state;

    if (isCreateLoading) {
      return;
    }

    this.setState({ isCreateLoading: true });

    FormManager.createRecordByVariant(createVariant, {
      onSubmit: (record, postCreateActionExecuted) => {
        if (!postCreateActionExecuted) {
          goToCardDetailsPage(record.id);
        } else {
          this.handleRefresh();
        }
      },
      onReady: () => this.setState({ isCreateLoading: false }),
      onAfterHideModal: () => this.setState({ isCreateLoading: false })
    });
  };

  handleResetFilter = () => {
    const { resetFiltering } = this.props;
    isFunction(resetFiltering) && resetFiltering();
  };

  render() {
    const {
      stateId,
      viewMode,
      isMobile,
      isDocLibEnabled,
      isLoading,
      isFilterOn,
      noGroupActions,
      noCreateBtn,
      journalConfig = {},
      predicate = {},
      grid = {},
      settingsData = {},
      settingsFiltersData = {},
      settingsColumnsData = {},
      settingsGroupingData = {},
      originKanbanSettings = {},
      kanbanSettings = {},
      selectedRecords = [],
      nameBtnSettings,
      leftChild,
      rightChild,
      ...otherProps
    } = this.props;
    const { settingsVisible, isReset, isCreateLoading } = this.state;
    const searchText = this.getSearchText();

    return (
      <>
        <SettingsModal
          {...settingsData}
          viewMode={viewMode}
          filtersData={settingsFiltersData}
          columnsData={settingsColumnsData}
          groupingData={settingsGroupingData}
          originKanbanSettings={originKanbanSettings}
          kanbanSettings={kanbanSettings}
          isReset={isReset}
          isOpen={settingsVisible}
          onClose={this.handleToggleSettings}
          onApply={this.handleApplySettings}
          onCreate={this.handleCreateSettings}
          onSave={this.handleSaveSettings}
          noCreateBtn={noCreateBtn}
        />

        <JournalsSettingsBar
          leftChild={leftChild}
          rightChild={rightChild}
          stateId={stateId}
          targetId={this.targetId}
          grid={grid}
          journalConfig={journalConfig}
          predicate={predicate}
          searchText={searchText}
          selectedRecords={selectedRecords}
          viewMode={viewMode}
          isMobile={isMobile}
          isDocLibEnabled={isDocLibEnabled}
          isCreateLoading={isCreateLoading}
          isLoading={isLoading}
          isShowResetFilter={isFilterOn}
          noGroupActions={noGroupActions}
          nameBtnSettings={nameBtnSettings}
          onRefresh={this.handleRefresh}
          onSearch={this.handleSearch}
          onToggleSettings={this.handleToggleSettings}
          onAddRecord={this.handleAddRecord}
          onResetFilter={this.handleResetFilter}
          {...otherProps}
        />
      </>
    );
  }
}

Bar.propTypes = {
  leftChild: PropTypes.element,
  rightChild: PropTypes.element,

  stateId: PropTypes.string,
  urlParams: PropTypes.object,
  viewMode: PropTypes.string,
  isActivePage: PropTypes.bool,
  isMobile: PropTypes.bool.isRequired,
  isAdmin: PropTypes.bool.isRequired,
  isDocLibEnabled: PropTypes.bool,
  isLoading: PropTypes.bool,
  isFilterOn: PropTypes.bool,
  noCreateBtn: PropTypes.bool,
  noGroupActions: PropTypes.bool,
  nameBtnSettings: PropTypes.string,
  journalConfig: PropTypes.object,
  grid: PropTypes.object,
  settingsData: PropTypes.object,
  settingsFiltersData: PropTypes.object,
  settingsColumnsData: PropTypes.object,
  settingsGroupingData: PropTypes.object,
  selectedRecords: PropTypes.array,

  applySettings: PropTypes.func,
  createJournalSetting: PropTypes.func,
  saveJournalSetting: PropTypes.func,
  reloadGrid: PropTypes.func,
  runSearch: PropTypes.func
};

export default Bar;
