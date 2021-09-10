import React, { Component } from 'react';
import get from 'lodash/get';

import { getSearchParams, goToCardDetailsPage, removeUrlSearchParams } from '../../../helpers/urls';
import { JournalUrlParams as JUP } from '../../../constants';
import FormManager from '../../EcosForm/FormManager';
import JournalsSettingsBar from '../JournalsSettingsBar';
import SettingsModal from './SettingsModal';

export default class Bar extends Component {
  state = {
    isReset: false,
    settingsVisible: false,
    isCreateLoading: false
  };

  getSearchText() {
    const { isActivePage, urlParams } = this.props;
    console.log('000');
    console.log(urlParams);
    return !isActivePage ? '' : get(getSearchParams(), JUP.SEARCH, get(urlParams, JUP.SEARCH, ''));
  }

  handleToggleSettings = () => {
    this.setState(({ settingsVisible }) => ({ settingsVisible: !settingsVisible, isReset: false }));
  };

  handleApplySettings = (isChangedPredicates, settings) => {
    const { clearSearch, applySettings } = this.props;

    applySettings({ settings });

    if (isChangedPredicates) {
      const url = removeUrlSearchParams(window.location.href, JUP.SEARCH);

      window.history.replaceState({ path: url }, '', url);
      clearSearch();
    }

    this.handleToggleSettings();
  };

  handleCreateSettings = settings => {
    const {
      journalConfig: { id },
      createJournalSetting
    } = this.props;

    createJournalSetting(id, settings);
    this.handleToggleSettings();
  };

  handleSaveSettings = (id, settings) => {
    const { saveJournalSetting } = this.props;

    saveJournalSetting(id, settings);
  };

  handleRefresh = () => {
    this.props.reloadGrid();
  };

  handleSearch = text => {
    if (text === get(this.props, ['urlParams', JUP.SEARCH], '')) {
      return;
    }

    this.props.runSearch(text);
  };

  handleAddRecord = createVariant => {
    const { isCreateLoading } = this.state;

    if (isCreateLoading) {
      return;
    }

    this.setState({ isCreateLoading: true });

    FormManager.createRecordByVariant(createVariant, {
      onSubmit: record => goToCardDetailsPage(record.id),
      onReady: () => this.setState({ isCreateLoading: false }),
      onAfterHideModal: () => this.setState({ isCreateLoading: false })
    });
  };

  handleResetFilter = () => {
    this.props.resetFiltering();
  };

  render() {
    const {
      stateId,
      viewMode,
      isMobile,
      isDocLibEnabled,
      isLoading,
      isFilterOn,
      noCreateBtn,
      journalConfig = {},
      grid = {},
      settingsData = {},
      settingsFiltersData = {},
      settingsColumnsData = {},
      settingsGroupingData = {},
      selectedRecords = [],
      nameBtnSettings,
      leftChild,
      rightChild
    } = this.props;
    const { settingsVisible, isReset, isCreateLoading } = this.state;
    const searchText = this.getSearchText();

    return (
      <>
        <SettingsModal
          {...settingsData}
          filtersData={settingsFiltersData}
          columnsData={settingsColumnsData}
          groupingData={settingsGroupingData}
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
          grid={grid}
          journalConfig={journalConfig}
          searchText={searchText}
          selectedRecords={selectedRecords}
          viewMode={viewMode}
          isMobile={isMobile}
          isDocLibEnabled={isDocLibEnabled}
          isCreateLoading={isCreateLoading}
          isLoading={isLoading}
          isShowResetFilter={isFilterOn}
          nameBtnSettings={nameBtnSettings}
          onRefresh={this.handleRefresh}
          onSearch={this.handleSearch}
          onToggleSettings={this.handleToggleSettings}
          onAddRecord={this.handleAddRecord}
          onResetFilter={this.handleResetFilter}
        />
      </>
    );
  }
}
