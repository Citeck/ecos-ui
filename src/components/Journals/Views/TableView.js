import React, { Component } from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';
import SettingsModal from '../SettingsModal';
import JournalsSettingsBar from '../JournalsSettingsBar';
import { JournalsGroupActionsTools } from '../JournalsTools';
import { isPreview, isTable } from '../constants';
import JournalsContent from '../JournalsContent';
import JournalsDashletPagination from '../JournalsDashletPagination';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import { t } from '../../../helpers/export/util';
import {
  execRecordsAction,
  getJournalsData,
  runSearch,
  saveJournalSetting,
  setSelectAllRecords,
  setSelectedRecords,
  setUrl,
  toggleViewMode
} from '../../../actions/journals';
import { wrapArgs } from '../../../helpers/redux';
import { selectCommonJournalPageProps, selectJournalPageProps } from '../../../selectors/journals';
import { getSearchParams, goToCardDetailsPage, removeUrlSearchParams } from '../../../helpers/urls';
import { JournalUrlParams as JUP } from '../../../constants';
import FormManager from '../../EcosForm/FormManager';

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
    execRecordsAction: (records, action, context) => dispatch(execRecordsAction(w({ records, action, context }))),
    getJournalsData: options => dispatch(getJournalsData(w(options))),
    runSearch: text => dispatch(runSearch({ text, stateId: props.stateId })),
    saveJournalSetting: (id, settings) => dispatch(saveJournalSetting(w({ id, settings }))),
    setSelectedRecords: records => dispatch(setSelectedRecords(w(records))),
    setSelectAllRecords: need => dispatch(setSelectAllRecords(w(need))),
    setUrl: urlParams => dispatch(setUrl(w(urlParams))),
    //todo перенести в отдельный компонент табов
    toggleViewMode: viewMode => dispatch(toggleViewMode(w({ viewMode })))
  };
}

const Labels = {
  J_SHOW_MENU: 'journals.action.show-menu',
  J_SHOW_MENU_SM: 'journals.action.show-menu_sm'
};

class TableView extends React.Component {
  state = {
    isReset: false, //
    isForceUpdate: false, //
    settingsVisible: false,
    isCreateLoading: false
  };

  componentDidUpdate(prevProps, prevState, snapshot) {
    const { isActivePage, stateId, journalId } = this.props;

    if (isActivePage && (prevProps.journalId !== journalId || prevProps.stateId !== stateId)) {
      this.props.getJournalsData();
    }
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
    this.setState(({ settingsVisible }) => ({ settingsVisible: !settingsVisible, savedSetting: null, isReset: false }));
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

    const searchParams = {
      ...getSearchParams(),
      search: text
    };
    this.props.setUrl(searchParams);
    this.props.runSearch(text);
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

      settingsFiltersData,
      journalConfig,
      grid,

      selectedRecords,
      reloadGrid,
      isDocLibEnabled,
      settingsData,
      settingsColumnsData,
      settingsGroupingData,
      isLoading,
      displayElements = {},
      selectAllRecordsVisible,
      selectAllRecords,
      isActivePage,
      getJournalContentMaxHeight
    } = this.props;
    const { settingsVisible, isReset, isCreateLoading } = this.state;

    return (
      <div
        hidden={!isTable(viewMode)}
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
            onRefresh={reloadGrid}
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
              onGoTo={this.onGoTo}
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
