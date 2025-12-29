import classNames from 'classnames';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import isEqualWith from 'lodash/isEqualWith';
import isNil from 'lodash/isNil';
import React from 'react';
import { connect } from 'react-redux';

import { JournalUrlParams, JournalUrlParams as JUP, KanbanUrlParams as KUP, SourcesId } from '../../../constants';
import { Dropdown } from '../../common/form';
import Kanban, { Bar } from '../Kanban';
import { isKanban, Labels } from '../constants';

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
import { applyFilter, getBoardData, reloadBoardData, resetFilter, selectBoardId } from '@/actions/kanban';
import { t } from '@/helpers/export/util';
import { wrapArgs } from '@/helpers/redux';
import { getSearchParams } from '@/helpers/urls';
import { selectViewMode } from '@/selectors/journals';
import { selectKanbanPageProps } from '@/selectors/kanban';
import { selectIsAdmin } from '@/selectors/user';
import { selectIsViewNewJournal } from '@/selectors/view';

import '../style.scss';

function mapStateToProps(state, props) {
  const viewMode = selectViewMode(state, props.stateId);
  const ownProps = selectKanbanPageProps(state, props.stateId);
  const newState = get(state, ['journals', props.stateId]) || {};
  const isViewNewJournal = selectIsViewNewJournal(state);

  return {
    predicate: newState.journalSetting?.predicate || {},
    urlParams: getSearchParams(),
    isAdmin: selectIsAdmin(state),
    isViewNewJournal,
    viewMode,
    ...ownProps
  };
}

function mapDispatchToProps(dispatch, props) {
  const w = wrapArgs(props.stateId);

  return {
    resetFiltering: () => dispatch(resetFilter({ stateId: props.stateId })),
    applyFiltering: settings => dispatch(applyFilter({ stateId: props.stateId, settings })),
    getBoardData: (boardId, templateId) => dispatch(getBoardData({ boardId, templateId, stateId: props.stateId })),
    reloadBoardData: () => dispatch(reloadBoardData({ stateId: props.stateId })),
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
    setUrl: urlParams => dispatch(setUrl(w(urlParams)))
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

    if (prevProps.journalId !== journalId || (stateId && prevProps.stateId !== stateId)) {
      this.props.getJournalsData({ force, savePredicate: true });
    }

    if (urlParams[JUP.SEARCH] !== get(prevProps, ['urlParams', JUP.SEARCH])) {
      this.props.reloadBoardData();
    }

    if (
      !isEqualWith(boardList, prevProps.boardList, isEqual) ||
      (!isEmpty(boardList) && this.state.isClose) ||
      urlParams[KUP.BOARD_ID] !== get(prevProps, ['urlParams', KUP.BOARD_ID])
    ) {
      this.setState({ isClose: false }, () => {
        this.props.getBoardData(this.getSelectedBoardFromUrl(), urlParams.journalSettingId || '');
      });
    }

    if (urlParams[KUP.TEMPLATE_ID] !== get(prevProps, ['urlParams', KUP.TEMPLATE_ID])) {
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

  LeftBarChild = () => {
    const { boardList, isViewNewJournal } = this.props;

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
          controlClassName={classNames(
            'ecos-btn_drop-down',
            { 'ecos-kanban__dropdown': !isViewNewJournal },
            { 'ecos-btn_hover_blue2': isViewNewJournal },
            { 'ecos-journal__btn_new': isViewNewJournal },
            { 'ecos-btn_grey3': isViewNewJournal }
          )}
          menuClassName="ecos-kanban__dropdown-menu"
        />
      </>
    );
  };

  render() {
    const { isClose } = this.state;

    if (isClose) {
      return null;
    }

    const {
      Header,
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
      isViewNewJournal,
      hasBtnEdit,
      onEditJournal
    } = this.props;
    const { name } = boardConfig || {};
    const maxHeight = getMaxHeight();

    return (
      <div hidden={!isKanban(viewMode)} className={classNames('ecos-journal-view__kanban', bodyClassName)}>
        <div ref={bodyTopForwardedRef} className="ecos-journal-view__kanban-top">
          {!isViewNewJournal && <Header title={name} config={boardConfig} configRec={this.boardId} />}
          <Bar
            {...this.props}
            hasBtnEdit={() => hasBtnEdit(this.boardId)}
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
