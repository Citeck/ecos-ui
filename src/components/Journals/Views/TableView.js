import React from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';
import get from 'lodash/get';

import {
  applyJournalSetting,
  createJournalSetting,
  deselectAllRecords,
  execRecordsAction,
  getJournalsData,
  reloadGrid,
  resetFiltering,
  runSearch,
  saveJournalSetting,
  selectPreset,
  setGrid,
  setSelectAllPageRecords,
  setSelectedRecords,
  setUrl
} from '../../../actions/journals';
import { selectCommonJournalPageProps, selectJournalPageProps } from '../../../selectors/journals';
import { JournalUrlParams as JUP, SourcesId } from '../../../constants';
import { wrapArgs } from '../../../helpers/redux';
import { isPreview, isTableOrPreview } from '../constants';
import Bar from '../CommonBar';
import JournalsContent from '../JournalsContent';
import JournalsDashletPagination from '../JournalsDashletPagination';

function mapStateToProps(state, props) {
  const commonProps = selectCommonJournalPageProps(state, props.stateId);
  const journalProps = selectJournalPageProps(state, props.stateId);

  return {
    ...commonProps,
    ...journalProps,
    isMobile: get(state, 'view.isMobile')
  };
}

function mapDispatchToProps(dispatch, props) {
  const w = wrapArgs(props.stateId);

  return {
    applySettings: settings => dispatch(applyJournalSetting(w(settings))),
    resetFiltering: () => dispatch(resetFiltering(w())),
    clearSearch: () => dispatch(setGrid({ search: '', stateId: props.stateId })),
    createJournalSetting: (journalId, settings, callback) => dispatch(createJournalSetting(w({ journalId, settings, callback }))),
    execRecordsAction: (records, action, context) => dispatch(execRecordsAction(w({ records, action, context }))),
    getJournalsData: options => dispatch(getJournalsData(w(options))),
    reloadGrid: () => dispatch(reloadGrid(w({}))),
    runSearch: text => dispatch(runSearch({ text, stateId: props.stateId })),
    saveJournalSetting: (id, settings) => dispatch(saveJournalSetting(w({ id, settings }))),
    setSelectedRecords: records => dispatch(setSelectedRecords(w(records))),
    setSelectAllPageRecords: need => dispatch(setSelectAllPageRecords(w(need))),
    deselectAllRecords: () => dispatch(deselectAllRecords(w())),
    setUrl: urlParams => dispatch(setUrl(w(urlParams))),
    selectPreset: id => dispatch(selectPreset(w(id)))
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

  RightBarChild = ({ hasPageSize, noData }) => {
    const { stateId, isMobile } = this.props;

    return (
      <JournalsDashletPagination
        stateId={stateId}
        hasPageSize={hasPageSize}
        noData={noData}
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
      bodyTopForwardedRef,
      footerForwardedRef,
      bodyClassName,
      minHeight,
      getMaxHeight,
      isActivePage,
      displayElements = {},

      journalConfig
    } = this.props;
    const maxHeight = getMaxHeight();

    return (
      <div hidden={!isTableOrPreview(viewMode)} className={classNames('ecos-journal-view__table', bodyClassName)}>
        <div className="ecos-journal__body-top" ref={bodyTopForwardedRef}>
          <Header
            title={get(journalConfig, 'meta.title', '')}
            config={journalConfig}
            configRec={journalConfig.id && `${SourcesId.JOURNAL}@${journalConfig.id}`}
          />
          <Bar {...this.props} rightChild={isMobile ? <this.RightBarChild noData /> : null} />
        </div>

        <JournalsContent
          stateId={stateId}
          showPreview={isPreview(viewMode) && !isMobile}
          maxHeight={maxHeight}
          minHeight={minHeight}
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
