import React from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';
import get from 'lodash/get';

import {
  applyJournalSetting,
  createJournalSetting,
  execRecordsAction,
  getJournalsData,
  reloadGrid,
  runSearch,
  saveJournalSetting,
  selectJournalSettings,
  setGrid,
  setSelectAllRecords,
  setSelectedRecords,
  setUrl
} from '../../../actions/journals';
import { selectCommonJournalPageProps, selectJournalPageProps } from '../../../selectors/journals';
import { JournalUrlParams as JUP } from '../../../constants';
import { t } from '../../../helpers/export/util';
import { wrapArgs } from '../../../helpers/redux';
import { getSearchParams, goToCardDetailsPage, removeUrlSearchParams } from '../../../helpers/urls';
import FormManager from '../../EcosForm/FormManager';
import { isPreview, isTableOrPreview } from '../constants';
import SettingsModal from '../SettingsModal';
import JournalsSettingsBar from '../JournalsSettingsBar';
import { JournalsGroupActionsTools } from '../JournalsTools';
import JournalsContent from '../JournalsContent';
import JournalsDashletPagination from '../JournalsDashletPagination';

function mapStateToProps(state, props) {
  const commonProps = selectCommonJournalPageProps(state, props.stateId);
  const journalProps = selectJournalPageProps(state, props.stateId);

  return {
    ...commonProps,
    ...journalProps
  };
}

function mapDispatchToProps(dispatch, props) {
  const w = wrapArgs(props.stateId);

  return {
    applySettings: settings => dispatch(applyJournalSetting(w(settings))),
    clearSearch: () => dispatch(setGrid({ search: '', stateId: props.stateId })),
    createJournalSetting: (journalId, settings) => dispatch(createJournalSetting(w({ journalId, settings }))),
    execRecordsAction: (records, action, context) => dispatch(execRecordsAction(w({ records, action, context }))),
    getJournalsData: options => dispatch(getJournalsData(w(options))),
    reloadGrid: () => dispatch(reloadGrid(w({}))),
    runSearch: text => dispatch(runSearch({ text, stateId: props.stateId })),
    saveJournalSetting: (id, settings) => dispatch(saveJournalSetting(w({ id, settings }))),
    setSelectedRecords: records => dispatch(setSelectedRecords(w(records))),
    setSelectAllRecords: need => dispatch(setSelectAllRecords(w(need))),
    setUrl: urlParams => dispatch(setUrl(w(urlParams))),
    selectJournalSettings: id => dispatch(selectJournalSettings(w(id)))
  };
}

const Labels = {
  J_SHOW_MENU: 'journals.action.show-menu',
  J_SHOW_MENU_SM: 'journals.action.show-menu_sm'
};

class TableView extends React.Component {
  state = {
    isClose: true,
    isReset: false,
    settingsVisible: false,
    isCreateLoading: false
  };

  componentDidUpdate(prevProps, prevState, snapshot) {
    const { isActivePage, viewMode, stateId, journalId, urlParams = {} } = this.props;

    if (!isActivePage || !isTableOrPreview(viewMode)) {
      return;
    }

    if (prevProps.journalId !== journalId || prevProps.stateId !== stateId || this.state.isClose) {
      this.setState({ isClose: false }, () => this.props.getJournalsData());
    }

    if (get(prevProps, ['urlParams', JUP.SEARCH]) && urlParams[JUP.SEARCH] !== get(prevProps, ['urlParams', JUP.SEARCH])) {
      this.props.reloadGrid();
    }

    if (urlParams[JUP.JOURNAL_SETTING_ID] !== get(prevProps, ['urlParams', JUP.JOURNAL_SETTING_ID])) {
      this.props.selectJournalSettings(urlParams[JUP.JOURNAL_SETTING_ID]);
    }
  }

  componentWillUnmount() {
    this.setState({ isClose: true });
  }

  get searchText() {
    const { isActivePage, urlParams } = this.props;
    return !isActivePage ? '' : get(getSearchParams(), JUP.SEARCH, get(urlParams, JUP.SEARCH, ''));
  }

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

  handleToggleSettings = () => {
    this.setState(({ settingsVisible }) => ({ settingsVisible: !settingsVisible, isReset: false }));
  };

  handleSaveSettings = (id, settings) => {
    const { saveJournalSetting } = this.props;

    saveJournalSetting(id, settings);
  };

  handleCreateSettings = settings => {
    const {
      journalConfig: { id },
      createJournalSetting
    } = this.props;

    createJournalSetting(id, settings);
    this.handleToggleSettings();
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

  handleSearch = text => {
    if (text === get(this.props, ['urlParams', JUP.SEARCH], '')) {
      return;
    }

    this.props.runSearch(text);
  };

  handleRefresh = () => {
    this.props.reloadGrid();
  };

  handleSelectAllRecords = () => {
    const { setSelectAllRecords, selectAllRecords, setSelectedRecords } = this.props;

    setSelectAllRecords(!selectAllRecords);

    if (!selectAllRecords) {
      setSelectedRecords([]);
    }
  };

  handleExecuteGroupAction = action => {
    const { selectAllRecords } = this.props;

    if (!selectAllRecords) {
      const records = get(this.props, 'selectedRecords', []);

      this.props.execRecordsAction(records, action);
    } else {
      const query = get(this.props, 'grid.query');

      this.props.execRecordsAction(query, action);
    }
  };

  render() {
    const { isClose } = this.state;

    if (isClose) {
      return null;
    }

    const {
      viewMode,
      stateId,
      isMobile,
      toggleViewMode,
      bodyForwardedRef,
      bodyTopForwardedRef,
      footerForwardedRef,
      pageTabsIsShow,
      bodyClassName,
      Header,
      isActivePage,
      displayElements = {},
      isDocLibEnabled,

      journalConfig,
      grid,
      isLoading,
      selectedRecords,
      selectAllRecordsVisible,
      selectAllRecords,
      settingsData,
      settingsFiltersData,
      settingsColumnsData,
      settingsGroupingData,

      getJournalContentMaxHeight
    } = this.props;
    const { settingsVisible, isReset, isCreateLoading } = this.state;

    return (
      <div
        hidden={!isTableOrPreview(viewMode)}
        ref={bodyForwardedRef}
        className={classNames('ecos-journal__body', bodyClassName, {
          'ecos-journal__body_with-tabs': pageTabsIsShow,
          'ecos-journal__body_mobile': isMobile
        })}
      >
        <div className="ecos-journal__body-top" ref={bodyTopForwardedRef}>
          <Header title={get(journalConfig, 'meta.title', '')} labelBtnMenu={isMobile ? t(Labels.J_SHOW_MENU_SM) : t(Labels.J_SHOW_MENU)} />

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
          />

          <JournalsSettingsBar
            stateId={stateId}
            grid={grid}
            journalConfig={journalConfig}
            searchText={this.searchText}
            selectedRecords={selectedRecords}
            viewMode={viewMode}
            isMobile={isMobile}
            isDocLibEnabled={isDocLibEnabled}
            isCreateLoading={isCreateLoading}
            isLoading={isLoading}
            onRefresh={this.handleRefresh}
            onSearch={this.handleSearch}
            onToggleSettings={this.handleToggleSettings}
            onToggleViewMode={toggleViewMode}
            onAddRecord={this.handleAddRecord}
          />

          {displayElements.groupActions && (
            <JournalsGroupActionsTools
              isMobile={isMobile}
              selectAllRecordsVisible={selectAllRecordsVisible}
              selectAllRecords={selectAllRecords}
              grid={grid}
              selectedRecords={selectedRecords}
              onExecuteAction={this.handleExecuteGroupAction}
              onSelectAll={this.handleSelectAllRecords}
            />
          )}
        </div>

        <JournalsContent
          stateId={stateId}
          showPreview={isPreview(viewMode) && !isMobile}
          maxHeight={getJournalContentMaxHeight()}
          isActivePage={isActivePage}
          onOpenSettings={this.handleToggleSettings}
        />

        <div className="ecos-journal__footer" ref={footerForwardedRef}>
          {displayElements.pagination && (
            <JournalsDashletPagination
              stateId={stateId}
              hasPageSize
              className={classNames('ecos-journal__pagination', { 'ecos-journal__pagination_mobile': isMobile })}
            />
          )}
        </div>
      </div>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(TableView);
