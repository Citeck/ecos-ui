import classNames from 'classnames';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import React from 'react';
import { connect } from 'react-redux';

import Bar from '../CommonBar';
import JournalsDashletPagination from '../JournalsDashletPagination/JournalsDashletPagination';
import PreviewListContent from '../PreviewListContent';
import { CLASSNAME_JOURNAL_BODY_TOP, isPreviewList } from '@/components/journals/Journals/constants';

import {
  applyJournalSetting,
  createJournalSetting,
  deselectAllRecords,
  execRecordsAction,
  getJournalsData,
  reloadGrid,
  reloadJournalConfig,
  resetFiltering,
  runSearch,
  saveJournalSetting,
  selectPreset,
  setGrid,
  setSelectAllPageRecords,
  setSelectedRecords,
  setUrl
} from '@/actions/journals';
import { initPreviewList } from '@/actions/previewList';
import { JournalUrlParams, JournalUrlParams as JUP, SourcesId } from '@citeck/constants';
import { wrapArgs } from '@/helpers/redux';
import { getSearchParams } from '@/helpers/urls';
import { getBool, t } from '@/helpers/util';
import { selectCommonJournalPageProps, selectJournalPageProps } from '@/selectors/journals';
import { selectKanbanPageProps } from '@/selectors/kanban';
import { selectPreviewListProps } from '@/selectors/previewList';
import { selectIsAdmin } from '@/selectors/user';

const mapStateToProps = (state, props) => {
  const commonProps = selectCommonJournalPageProps(state, props.stateId);
  const ownProps = selectKanbanPageProps(state, props.stateId);
  const journalProps = selectJournalPageProps(state, props.stateId);
  const previewListProps = selectPreviewListProps(state, props.stateId);
  const isTilesContent = getBool(get(previewListProps, 'previewListConfig.isTilesContent', 'false'));

  return {
    isMobile: get(state, 'view.isMobile'),
    isAdmin: selectIsAdmin(state),
    urlParams: getSearchParams(),
    isTilesContent,
    ...previewListProps,
    ...ownProps,
    ...commonProps,
    ...journalProps
  };
};

function mapDispatchToProps(dispatch, props) {
  const w = wrapArgs(props.stateId);

  return {
    applySettings: settings => dispatch(applyJournalSetting(w(settings))),
    resetFiltering: () => dispatch(resetFiltering(w())),
    clearSearch: () => dispatch(setGrid(w({ search: '' }))),
    createJournalSetting: (journalId, settings, callback) => dispatch(createJournalSetting(w({ journalId, settings, callback }))),
    execRecordsAction: (records, action, context) => dispatch(execRecordsAction(w({ records, action, context }))),
    getJournalsData: options => dispatch(getJournalsData(w(options))),
    reloadJournalConfig: (journalId, force, callback) => dispatch(reloadJournalConfig(w({ journalId, w, force, callback }))),
    reloadGrid: options => dispatch(reloadGrid(w(options))),
    runSearch: text => dispatch(runSearch({ text, stateId: props.stateId })),
    saveJournalSetting: (id, settings, callback) => dispatch(saveJournalSetting(w({ id, settings, callback }))),
    setSelectedRecords: records => dispatch(setSelectedRecords(w(records))),
    setSelectAllPageRecords: need => dispatch(setSelectAllPageRecords(w(need))),
    deselectAllRecords: stateId => dispatch(deselectAllRecords({ stateId })),
    setUrl: urlParams => dispatch(setUrl(w(urlParams))),
    selectPreset: id => dispatch(selectPreset(w(id))),
    initPreviewList: () => dispatch(initPreviewList(w()))
  };
}

class PreviewListView extends React.Component {
  state = {
    isClose: true
  };

  componentDidUpdate(prevProps, prevState, snapshot) {
    const { isActivePage, stateId, journalId, urlParams = {}, withForceUpdate: force, deselectAllRecords } = this.props;

    if (!journalId || !isActivePage || !isPreviewList(urlParams[JournalUrlParams.VIEW_MODE])) {
      if (prevProps.journalId !== journalId) {
        deselectAllRecords(prevProps.stateId);
      }

      return;
    }

    if (this.state.isClose) {
      this.setState({ isClose: false }, () => this.props.initPreviewList());
    }

    if (prevProps.journalId !== journalId || (stateId && prevProps.stateId !== stateId) || this.state.isClose) {
      this.setState({ isClose: false }, () => this.props.getJournalsData({ force }));
    }

    if (urlParams[JUP.SEARCH] !== get(prevProps, ['urlParams', JUP.SEARCH])) {
      this.props.reloadGrid();
    }
  }

  componentWillUnmount() {
    this.setState({ isClose: true });
  }

  RightBarChild = ({ hasPageSize, noData, maxHeight, hasTotalSumField }) => {
    const { stateId, isMobile, isTilesContent, urlParams, viewMode, grid } = this.props;
    const { total } = grid || {};

    if (isTilesContent && isPreviewList(urlParams.viewMode || viewMode)) {
      if (isMobile) {
        return null;
      }

      return <h5 className="ecos-journal-view__total">{t('preview-list.bar.total', { total })}</h5>;
    }

    return (
      <JournalsDashletPagination
        isDecrementLastRow={hasTotalSumField}
        stateId={stateId}
        hasPageSize={hasPageSize}
        noData={noData}
        maxHeightJournalData={maxHeight}
        isMobile={isMobile}
        className={classNames('ecos-journal__pagination', 'fitnesse-ecos-journal__pagination', {
          'ecos-journal__pagination_mobile': isMobile
        })}
      />
    );
  };

  reloadGrid = () => {
    const { urlParams, isTilesContent, viewMode, reloadGrid, grid } = this.props;
    const { pagination } = grid || {};
    const { maxItems } = pagination || {};
    const isTilesPreviewListMode = isTilesContent && isPreviewList(urlParams.viewMode || viewMode);

    if (isTilesPreviewListMode && maxItems) {
      reloadGrid({ pagination: { page: 1, maxItems, skipCount: 0 } });

      return;
    }

    reloadGrid();
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
      bodyTopForwardedRef,
      onRowClick,
      bodyClassName,
      minHeight,
      getMaxHeight,
      isActivePage,
      onEditJournal,
      hasBtnEdit,
      draggableEvents,

      selectedRecordId,
      onClickOpenMenu,
      journalConfig
    } = this.props;
    const maxHeight = getMaxHeight();
    const configRec = journalConfig.id && `${SourcesId.JOURNAL}@${journalConfig.id}`;
    const hasTotalSumField = get(journalConfig, 'columns', []).some(col => col.hasTotalSumField === true);

    return (
      <div hidden={!isPreviewList(viewMode)} className={classNames('ecos-journal-view__table', bodyClassName)}>
        <div className={classNames(CLASSNAME_JOURNAL_BODY_TOP, 'ecos-journal__body-top_new')} ref={bodyTopForwardedRef}>
          <Bar
            {...this.props}
            hideActionsBtn
            hideSettingsJournalBtn
            reloadGrid={this.reloadGrid}
            hasBtnEdit={() => hasBtnEdit(configRec)}
            onEditJournal={() => onEditJournal(configRec)}
            onClickOpenMenu={e => onClickOpenMenu(e, journalConfig)}
            rightChild={isMobile ? <this.RightBarChild noData hasTotalSumField={hasTotalSumField} maxHeight={maxHeight} /> : null}
            rightBarChild={!isMobile ? <this.RightBarChild hasPageSize hasTotalSumField={hasTotalSumField} maxHeight={maxHeight} /> : null}
          />
        </div>

        <PreviewListContent
          draggableEvents={draggableEvents}
          onRowClick={onRowClick}
          stateId={stateId}
          maxHeight={maxHeight}
          minHeight={minHeight}
          isActivePage={isActivePage}
          selectedRecordId={selectedRecordId}
        />
      </div>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(PreviewListView);
