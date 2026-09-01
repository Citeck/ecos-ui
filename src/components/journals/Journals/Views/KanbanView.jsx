import { JournalUrlParams, JournalUrlParams as JUP, KanbanUrlParams as KUP, SourcesId } from '@citeck/constants';
import classNames from 'classnames';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import isEqualWith from 'lodash/isEqualWith';
import isNil from 'lodash/isNil';
import React from 'react';
import { connect } from 'react-redux';

import { Dropdown } from '@/components/common/form';
import Kanban, { Bar } from '../Kanban';
import SwimlaneGroupingDropdown from '../Kanban/SwimlaneGroupingDropdown';
import { isKanban, Labels } from '@/components/journals/Journals/constants';

import {
  applyJournalSetting,
  createJournalSetting,
  deselectAllRecords,
  execRecordsAction,
  getJournalsData,
  reloadGrid,
  reloadJournalConfig,
  runSearch,
  saveJournalSetting,
  selectPreset,
  setGrid,
  setSelectAllPageRecords,
  setSelectedRecords,
  setUrl
} from '@/actions/journals';
import { applyFilter, getBoardData, reloadBoardData, resetFilter, selectBoardId, changeSwimlaneGrouping } from '@/actions/kanban';
import { t } from '@/helpers/export/util';
import { wrapArgs } from '@/helpers/redux';
import { getSearchParams } from '@/helpers/urls';
import { selectViewMode } from '@/selectors/journals';
import { selectKanbanPageProps } from '@/selectors/kanban';
import { selectIsAdmin } from '@/selectors/user';

import '../style.scss';

function mapStateToProps(state, props) {
  const viewMode = selectViewMode(state, props.stateId);
  const ownProps = selectKanbanPageProps(state, props.stateId);
  const newState = get(state, ['journals', props.stateId]) || {};
  const journalConfig = get(newState, 'journalConfig') || {};
  const groupableColumns = (journalConfig.columns || []).filter(c => c.groupable);

  return {
    predicate: newState.journalSetting?.predicate || {},
    urlParams: getSearchParams(),
    isAdmin: selectIsAdmin(state),
    viewMode,
    groupableColumns,
    ...ownProps
  };
}

function mapDispatchToProps(dispatch, props) {
  const w = wrapArgs(props.stateId);

  return {
    resetFiltering: () => dispatch(resetFilter({ stateId: props.stateId })),
    applyFiltering: settings => dispatch(applyFilter({ stateId: props.stateId, settings })),
    getBoardData: (boardId, templateId) => dispatch(getBoardData({ boardId, templateId, stateId: props.stateId })),
    reloadBoardData: options => dispatch(reloadBoardData({ stateId: props.stateId, ...options })),
    selectBoardId: boardId => dispatch(selectBoardId({ boardId, stateId: props.stateId })),
    selectPreset: id => dispatch(selectPreset(w(id))),
    applySettings: settings => dispatch(applyJournalSetting(w(settings))),
    clearSearch: () => dispatch(setGrid(w({ search: '' }))),
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
    changeSwimlaneGrouping: swimlaneGrouping => dispatch(changeSwimlaneGrouping({ stateId: props.stateId, swimlaneGrouping }))
  };
}

class KanbanView extends React.Component {
  state = {
    isClose: true
  };

  componentDidUpdate(prevProps, prevState, snapshot) {
    const { isActivePage, stateId, urlParams = {}, boardList, journalId, withForceUpdate: force } = this.props;

    if (!isActivePage || !isKanban(urlParams[JournalUrlParams.VIEW_MODE])) {
      return;
    }

    // `urlParams` is read from window.location, which always describes the ACTIVE page tab — not this
    // one. prevProps.urlParams belongs to whichever tab was active before this commit, so when this
    // tab was inactive that is another tab's URL — comparing against it would make every param look
    // "changed": boardId, search and templateId all fired at once and re-ran the full board load —
    // skeletons over the whole board and the scroll thrown back to the first page (COREDEV-426).
    // Substitute the current params so only genuine changes register.
    const prevUrlParams = prevProps.isActivePage ? get(prevProps, 'urlParams', {}) : urlParams;

    if (!prevProps.isActivePage && isActivePage) {
      // Coming back to this page tab: the URL diff above is neutralized, so trigger the in-place data
      // refresh explicitly. The saga drops the dispatch if a refresh/load is already in flight (e.g. the
      // one sagaToggleViewMode fires when the view mode really changed), so double dispatch is safe.
      this.props.reloadBoardData({ silent: true });
    }

    if (prevProps.journalId !== journalId || (stateId && prevProps.stateId !== stateId)) {
      this.props.getJournalsData({ force, savePredicate: true });
    }

    if (urlParams[JUP.SEARCH] !== prevUrlParams[JUP.SEARCH]) {
      // The silent reload re-reads the search text from the URL while refreshing the loaded volumes
      // in place — a full skeleton reload here is exactly what COREDEV-426 removes.
      this.props.reloadBoardData({ silent: true });
    }

    // Second guard for the same class of false positive: whatever the previous URL said, the board
    // does not need reloading when the requested board is the one already loaded.
    const isBoardIdChanged = urlParams[KUP.BOARD_ID] !== prevUrlParams[KUP.BOARD_ID] && (urlParams[KUP.BOARD_ID] || '') !== this.boardId;

    if (!isEqualWith(boardList, prevProps.boardList, isEqual) || (!isEmpty(boardList) && this.state.isClose) || isBoardIdChanged) {
      this.setState({ isClose: false }, () => {
        this.props.getBoardData(this.getSelectedBoardFromUrl(), urlParams.journalSettingId || '');
      });
    }

    if (urlParams[KUP.TEMPLATE_ID] !== prevUrlParams[KUP.TEMPLATE_ID]) {
      this.setState({ isClose: true });
    }
  }

  componentWillUnmount() {
    this.setState({ isClose: true });
  }

  get boardId() {
    const id = get(this.props, 'boardConfig.id') || '';

    if (!id) {
      return id;
    }

    if (id.indexOf(SourcesId.BOARD) === 0) {
      return id;
    }

    return `${SourcesId.BOARD}@${id}`;
  }

  getSelectedBoardFromUrl() {
    const { urlParams = {}, boardList } = this.props;

    return urlParams.boardId || get(boardList, '[0].id');
  }

  handleChangeBoard = board => {
    if (!isNil(board)) {
      this.props.selectBoardId(board.id);
    }
  };

  RightBarChild = () => {
    const { totalCount: count } = this.props;
    return <span className="ecos-pagination__text">{t(Labels.Kanban.BAR_TOTAL, { count })}</span>;
  };

  handleChangeSwimlaneGrouping = grouping => {
    this.props.changeSwimlaneGrouping(grouping);
  };

  LeftBarChild = () => {
    const { boardList, groupableColumns, swimlaneGrouping } = this.props;

    return (
      <>
        <Dropdown
          isButton
          isStatic
          source={boardList}
          value={this.getSelectedBoardFromUrl()}
          valueField="id"
          titleField="name"
          onChange={this.handleChangeBoard}
          controlLabel={t(Labels.Kanban.BOARD_LIST)}
          controlClassName={classNames('ecos-btn_drop-down ecos-btn_hover_blue2 ecos-journal__btn_new ecos-btn_grey3')}
          menuClassName="ecos-kanban__dropdown-menu"
        />
        {!isEmpty(groupableColumns) && (
          <SwimlaneGroupingDropdown
            groupableColumns={groupableColumns}
            swimlaneGrouping={swimlaneGrouping}
            onChangeSwimlaneGrouping={this.handleChangeSwimlaneGrouping}
          />
        )}
      </>
    );
  };

  render() {
    const { isClose } = this.state;

    if (isClose) {
      return null;
    }

    const {
      UnavailableView,
      boardConfig,
      stateId,
      isLoading,
      isEnabled,
      viewMode,
      bodyTopForwardedRef,
      bodyClassName,
      getMaxHeight,
      urlParams,
      isActivePage,
      hasBtnEdit,
      onEditJournal
    } = this.props;
    const maxHeight = getMaxHeight();

    return (
      <div hidden={!isKanban(viewMode)} className={classNames('ecos-journal-view__kanban', bodyClassName)}>
        <div ref={bodyTopForwardedRef} className="ecos-journal-view__kanban-top">
          <Bar
            {...this.props}
            hasBtnEdit={hasBtnEdit(this.boardId)}
            onEditJournal={() => onEditJournal(this.boardId)}
            urlParams={urlParams}
            isActivePage={isActivePage}
            stateId={stateId}
            leftChild={<this.LeftBarChild />}
            rightChild={<this.RightBarChild />}
          />
        </div>
        {!isEnabled && !isLoading && <UnavailableView />}
        <Kanban stateId={stateId} maxHeight={maxHeight} boardConfig={boardConfig} />
      </div>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(KanbanView);
