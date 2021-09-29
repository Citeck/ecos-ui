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
  resetFiltering,
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
import { wrapArgs } from '../../../helpers/redux';
import { isPreview, isTableOrPreview } from '../constants';
import Bar from '../CommonBar';
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
    resetFiltering: () => dispatch(resetFiltering(w())),
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

class TableView extends React.Component {
  state = {
    isClose: true
  };

  componentDidUpdate(prevProps, prevState, snapshot) {
    const { isActivePage, viewMode, stateId, journalId, urlParams = {}, wasChangedSettings } = this.props;

    if (!journalId || !isActivePage || !isTableOrPreview(viewMode)) {
      return;
    }

    if (prevProps.journalId !== journalId || (stateId && prevProps.stateId !== stateId) || this.state.isClose) {
      this.setState({ isClose: false }, () => this.props.getJournalsData());
    }

    if (!isTableOrPreview(prevProps.viewMode) && !!wasChangedSettings) {
      this.props.getJournalsData();
    }

    if (urlParams[JUP.SEARCH] !== get(prevProps, ['urlParams', JUP.SEARCH])) {
      this.props.reloadGrid();
    }
  }

  componentWillUnmount() {
    this.setState({ isClose: true });
  }

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

  RightBarChild = ({ hasPageSize }) => {
    const { stateId, isMobile } = this.props;

    return (
      <JournalsDashletPagination
        stateId={stateId}
        hasPageSize={hasPageSize}
        className={classNames('ecos-journal__pagination', { 'ecos-journal__pagination_mobile': isMobile })}
      />
    );
  };

  render() {
    const { isClose } = this.state;

    if (isClose) {
      return null;
    }

    const {
      Header,

      viewMode,
      stateId,
      isMobile,
      bodyForwardedRef,
      bodyTopForwardedRef,
      footerForwardedRef,
      bodyClassName,
      isActivePage,
      displayElements = {},

      journalConfig,
      grid,
      selectedRecords,
      selectAllRecordsVisible,
      selectAllRecords,

      getJournalContentMaxHeight
    } = this.props;

    return (
      <div hidden={!isTableOrPreview(viewMode)} ref={bodyForwardedRef} className={classNames('ecos-journal-view__table', bodyClassName)}>
        <div className="ecos-journal__body-top" ref={bodyTopForwardedRef}>
          <Header title={get(journalConfig, 'meta.title', '')} config={journalConfig} />

          <Bar {...this.props} rightChild={<this.RightBarChild hasPageSize={false} />} />

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
          {displayElements.pagination && <this.RightBarChild hasPageSize />}
        </div>
      </div>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(TableView);
