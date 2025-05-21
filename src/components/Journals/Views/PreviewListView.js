import classNames from 'classnames';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import isEqualWith from 'lodash/isEqualWith';
import React from 'react';
import { connect } from 'react-redux';

import Bar from '../CommonBar';
import JournalsDashletPagination from '../JournalsDashletPagination/JournalsDashletPagination';
import PreviewListContent from '../PreviewListContent';
import { CLASSNAME_JOURNAL_BODY_TOP, isPreviewList } from '../constants';

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
import { getBoardData } from '@/actions/kanban';
import { initPreviewList } from '@/actions/previewList';
import { JournalUrlParams, JournalUrlParams as JUP, KanbanUrlParams as KUP, SourcesId } from '@/constants';
import { wrapArgs } from '@/helpers/redux';
import { getSearchParams } from '@/helpers/urls';
import { getTextByLocale } from '@/helpers/util';
import { selectCommonJournalPageProps, selectJournalPageProps } from '@/selectors/journals';
import { selectKanbanPageProps } from '@/selectors/kanban';
import { selectPreviewListProps } from '@/selectors/previewList';
import { selectIsAdmin } from '@/selectors/user';
import { selectIsViewNewJournal } from '@/selectors/view';

const mapStateToProps = (state, props) => {
  const commonProps = selectCommonJournalPageProps(state, props.stateId);
  const ownProps = selectKanbanPageProps(state, props.stateId);
  const journalProps = selectJournalPageProps(state, props.stateId);
  const previewListProps = selectPreviewListProps(state, props.stateId);
  const isViewNewJournal = selectIsViewNewJournal(state);

  return {
    isMobile: get(state, 'view.isMobile'),
    isAdmin: selectIsAdmin(state),
    urlParams: getSearchParams(),
    isViewNewJournal,
    ...previewListProps,
    ...ownProps,
    ...commonProps,
    ...journalProps
  };
};

function mapDispatchToProps(dispatch, props) {
  const w = wrapArgs(props.stateId);

  return {
    getBoardData: boardId => dispatch(getBoardData({ boardId, stateId: props.stateId })),
    applySettings: settings => dispatch(applyJournalSetting(w(settings))),
    resetFiltering: () => dispatch(resetFiltering(w())),
    clearSearch: () => dispatch(setGrid({ search: '', stateId: props.stateId })),
    createJournalSetting: (journalId, settings, callback) => dispatch(createJournalSetting(w({ journalId, settings, callback }))),
    execRecordsAction: (records, action, context) => dispatch(execRecordsAction(w({ records, action, context }))),
    getJournalsData: options => dispatch(getJournalsData(w(options))),
    reloadJournalConfig: (journalId, force, callback) => dispatch(reloadJournalConfig(w({ journalId, w, force, callback }))),
    reloadGrid: () => dispatch(reloadGrid(w({}))),
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
    const { isActivePage, stateId, journalId, boardList, urlParams = {}, withForceUpdate: force, deselectAllRecords } = this.props;

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

    if (
      !isEqualWith(boardList, prevProps.boardList, isEqual) ||
      (!isEmpty(boardList) && this.state.isClose) ||
      urlParams[KUP.BOARD_ID] !== get(prevProps, ['urlParams', KUP.BOARD_ID]) ||
      urlParams[KUP.TEMPLATE_ID] !== get(prevProps, ['urlParams', KUP.TEMPLATE_ID])
    ) {
      const boardId = this.getSelectedBoardFromUrl();
      if (boardId) {
        this.props.getBoardData(boardId);
      }
    }
  }

  getSelectedBoardFromUrl() {
    const { urlParams = {}, boardList } = this.props;

    return urlParams.boardId || get(boardList, '[0].id');
  }

  componentWillUnmount() {
    this.setState({ isClose: true });
  }

  RightBarChild = ({ hasPageSize, noData, maxHeight, hasTotalSumField }) => {
    const { stateId, isMobile, isViewNewJournal } = this.props;

    return (
      <JournalsDashletPagination
        isDecrementLastRow={hasTotalSumField}
        stateId={stateId}
        isViewNewJournal={isViewNewJournal}
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
      isViewNewJournal,
      onEditJournal,
      hasBtnEdit,

      onClickOpenMenu,
      journalConfig
    } = this.props;
    const maxHeight = getMaxHeight();
    const configRec = journalConfig.id && `${SourcesId.JOURNAL}@${journalConfig.id}`;
    const hasTotalSumField = get(journalConfig, 'columns', []).some(col => col.hasTotalSumField === true);

    return (
      <div hidden={!isPreviewList(viewMode)} className={classNames('ecos-journal-view__table', bodyClassName)}>
        <div
          className={classNames(CLASSNAME_JOURNAL_BODY_TOP, {
            'ecos-journal__body-top_new': isViewNewJournal
          })}
          ref={bodyTopForwardedRef}
        >
          {!isViewNewJournal && (
            <Header
              title={get(journalConfig, 'meta.title', '') || getTextByLocale(get(journalConfig, 'name'))}
              config={journalConfig}
              configRec={configRec}
            />
          )}
          <Bar
            {...this.props}
            hideActionsBtn
            hideSettingsJournalBtn
            hasBtnEdit={() => hasBtnEdit(configRec)}
            onEditJournal={() => onEditJournal(configRec)}
            onClickOpenMenu={e => onClickOpenMenu(e, journalConfig)}
            rightChild={isMobile ? <this.RightBarChild noData hasTotalSumField={hasTotalSumField} maxHeight={maxHeight} /> : null}
            rightBarChild={
              isViewNewJournal && !isMobile ? (
                <this.RightBarChild hasPageSize hasTotalSumField={hasTotalSumField} maxHeight={maxHeight} />
              ) : null
            }
          />
        </div>

        <PreviewListContent stateId={stateId} maxHeight={maxHeight} minHeight={minHeight} isActivePage={isActivePage} />

        {!isViewNewJournal && (
          <div className="ecos-journal__footer" ref={footerForwardedRef}>
            {displayElements.pagination && <this.RightBarChild hasPageSize />}
          </div>
        )}
      </div>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(PreviewListView);
