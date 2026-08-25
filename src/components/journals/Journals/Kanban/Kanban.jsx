import { ParserPredicate } from '@citeck/records-predicates';
import classNames from 'classnames';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import isNil from 'lodash/isNil';
import PropTypes from 'prop-types';
import React from 'react';
import { DragDropContext } from 'react-beautiful-dnd';
import { Scrollbars } from 'react-custom-scrollbars';
import { connect } from 'react-redux';
import ReactResizeDetector from 'react-resize-detector';

import { Loader, PointsLoader } from '@/components/common';
import { Labels } from '@/components/journals/Journals/constants';

import HeaderColumn from './HeaderColumn';
import KanbanColumn from './KanbanColumn';
import Swimlane from './Swimlane';

import {
  cancelGetNextBoardPage,
  getNextPage,
  loadMoreSwimlaneCell,
  moveCard,
  moveSwimlaneCard,
  runAction,
  toggleSwimlaneCollapse
} from '@/actions/kanban';
import EmptyColumns from '@/components/common/icons/EmptyColumns';
import { guessTypeSourceId } from '@/dto/kanban';
import { t } from '@/helpers/util';
import { selectJournalPageProps, selectJournalSetting } from '@/selectors/journals';
import { selectBoardConfig, selectKanbanProps, selectRelatedFilter } from '@/selectors/kanban';
import AttributesService from '@/services/AttributesService';
import './style.scss';

const EMPTY_COLUMNS = [];

/**
 * Scope the column sum has to be queried with, so that it counts exactly the records the cards are
 * loaded with. The cards go through `board-cards`, where the SERVER picks source, type and predicate
 * (`BoardCardOrderService.resolveCardsSourceAndPredicate`); the sum goes straight to the record
 * source, so the same choice has to be made here. Its three cases:
 *
 *  (a) the board is backed by the journal the page has loaded — the server scopes the cards by that
 *      journal's type, source and predicate, and so do we: the FULL scope;
 *  (b) the board has no `journalRef` at all — the server ignores the journal completely and scopes the
 *      cards by the BOARD's own type with `VoidPredicate`. Sending the page journal's predicate here
 *      would filter the sum by something the cards are not filtered by — the COREDEV-87 mismatch the
 *      other way round. A board whose journal has no `typeRef` is the same case server-side;
 *  (c) the board declares a journal whose config the page does not have — it is still on its way, or
 *      (during a switch between journals) the store still holds the previous one. Nothing may be
 *      queried in that window: the whole type would be summed and that wrong number would sit on
 *      screen until the config lands (`ColumnSum` reads a missing `sourceId` as "not ready"). A board
 *      pointing at a journal the page will NEVER load is unreachable — the board list itself is built
 *      from the page journal's `boardRefs` — so waiting cannot strand such a board forever.
 */
function mapStateToProps(state, props) {
  const settings = selectJournalSetting(state, props.stateId);
  const journalPageProps = selectJournalPageProps(state, props.stateId);
  const boardConfig = selectBoardConfig(state, props.stateId);
  const journalConfig = get(journalPageProps, 'journalConfig') || {};

  const boardJournalId = boardConfig.journalRef ? AttributesService.parseId(boardConfig.journalRef) : undefined;
  // (a) — the board is backed by the very journal whose config the page has loaded
  const isBoardJournal = !!boardJournalId && boardJournalId === journalConfig.id && !!journalConfig.typeRef;
  // (c) — the board declares a journal whose config the page does not have. Comparing the ids (rather
  // than just asking whether ANY config has arrived) also covers the switch between two journals, when
  // the new `boardConfig` is already in the store and `journalConfig` is still the previous journal's.
  const isJournalConfigPending = !!boardJournalId && journalConfig.id !== boardJournalId;
  const cardsSourceId = isBoardJournal ? journalConfig.sourceId : guessTypeSourceId(boardConfig.typeRef);
  const cardsTypeRef = isBoardJournal ? journalConfig.typeRef : boardConfig.typeRef;

  return {
    ...selectKanbanProps(state, props.stateId),
    relatedFilter: selectRelatedFilter(state, props.stateId),
    predicate: settings.predicate,
    searchText: get(journalPageProps, 'grid.search'),
    journalSetting: journalPageProps.journalSetting,
    journalPredicate: isBoardJournal ? journalConfig.predicate : undefined,
    sourceId: isJournalConfigPending ? undefined : cardsSourceId,
    ecosType: isJournalConfigPending || !cardsTypeRef ? undefined : AttributesService.parseId(cardsTypeRef),
    // The sum's tooltip names the summed attribute, and that name is resolved on a TYPE. It has to be
    // the same type the sum is computed on: on a journal-backed board whose own `typeRef` differs, the
    // board's type need not even have the attribute, and the tooltip would read `Sum by ""`.
    sumTypeRef: isJournalConfigPending ? undefined : cardsTypeRef
  };
}

function mapDispatchToProps(dispatch, props) {
  return {
    getNextPage: settings => dispatch(getNextPage({ stateId: props.stateId, ...settings })),
    cancelGetNextBoardPage: () => dispatch(cancelGetNextBoardPage({ stateId: props.stateId })),
    moveCard: data => dispatch(moveCard({ stateId: props.stateId, ...data })),
    runAction: (recordRef, action) => dispatch(runAction({ recordRef, action, stateId: props.stateId })),
    toggleSwimlaneCollapse: swimlaneId => dispatch(toggleSwimlaneCollapse({ stateId: props.stateId, swimlaneId })),
    loadMoreSwimlaneCell: (swimlaneId, statusId) => dispatch(loadMoreSwimlaneCell({ stateId: props.stateId, swimlaneId, statusId })),
    moveSwimlaneCard: data => dispatch(moveSwimlaneCard({ stateId: props.stateId, ...data }))
  };
}

class Kanban extends React.Component {
  static propTypes = {
    getNextPage: PropTypes.func,
    moveCard: PropTypes.func,
    cancelGetNextBoardPage: PropTypes.func,
    runAction: PropTypes.func
  };

  refBody = React.createRef();
  refScroll = React.createRef();
  refHeader = React.createRef();
  refBottom = React.createRef();
  _kanbanRef = React.createRef();

  state = {
    isDragging: false,
    draggingSwimlaneId: null
  };

  // Cache of the getter below, keyed by the two props it is built from. Not an optimization of the
  // build itself — of its RESULT IDENTITY: see the getter.
  _searchPredicate = { isSet: false, text: undefined, columns: undefined, value: null };

  /**
   * The search filter of the board, as one predicate — handed to every column header and to every
   * swimlane cell on every render.
   *
   * The result is cached so that an unchanged search yields the very SAME object every time. Each
   * `ColumnSum` memoizes its query build (cloning every predicate, then serializing the result) on
   * the props it is given; a getter that rebuilt this predicate per read would hand out a new object
   * on every render and defeat that memo in every cell at once — including on every frame of a drag.
   */
  get searchPredicate() {
    const { searchText, journalSetting } = this.props;
    // Never `|| []` inline: a fresh empty array on every read would miss the cache every time.
    const columns = get(journalSetting, 'columns');
    const cache = this._searchPredicate;

    if (cache.isSet && cache.text === searchText && cache.columns === columns) {
      return cache.value;
    }

    const value = !isEmpty(searchText)
      ? ParserPredicate.getSearchPredicates({
          text: searchText,
          columns: ParserPredicate.getAvailableSearchColumns(columns || EMPTY_COLUMNS)
        })
      : null;

    this._searchPredicate = { isSet: true, text: searchText, columns, value };

    return value;
  }

  componentDidMount() {
    this.observer = new IntersectionObserver(([entry]) => {
      this.setState({ isInView: entry.isIntersecting });
    });

    this.observer.observe(this.refBottom.current);
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const { isLoading, isFirstLoading, columns, kanbanSettings, swimlaneGrouping, isLoadingColumns } = this.props;
    const headerElement = get(this.refHeader, 'current');
    const bodyElement = get(this.refBody, 'current');

    if (isLoading || isFirstLoading) {
      if (headerElement) {
        headerElement.style.width = 0;
      }

      return;
    }

    // `isLoadingColumns` stays filled for the whole card move (set before the optimistic update,
    // cleared when the affected columns have been reloaded). Without this check every one of those
    // intermediate commits re-dispatches getNextPage, which flips the board loader on and off again.
    if (!swimlaneGrouping && isEmpty(isLoadingColumns) && !this.state.isDragging && this.state.isInView && !this.isNoMore()) {
      const defaultColumns = Array.isArray(columns) ? columns.filter(item => item && item.id) : [];
      const colsFromSettings = get(kanbanSettings, 'columns');
      const cols = colsFromSettings ? [] : defaultColumns;

      if (!isEmpty(cols)) {
        this.props.cancelGetNextBoardPage();
        this.props.getNextPage({ isSkipPagination: true });
      }
    }

    if (headerElement && bodyElement) {
      headerElement.style.width = 'auto';
      bodyElement.style.width = 'auto';

      window.requestAnimationFrame(() => {
        const max = Math.max(headerElement.scrollWidth, bodyElement.scrollWidth);
        headerElement.style.width = `${max}px`;
        bodyElement.style.width = `${max}px`;

        if (swimlaneGrouping) {
          const headHeight = headerElement.offsetHeight;
          headerElement.parentElement.style.setProperty('--kanban-head-height', `${headHeight}px`);
        }
      });
    }
  }

  componentWillUnmount() {
    this.observer.disconnect();
  }

  getHeight(changes = 0) {
    return this.props.maxHeight + changes;
  }

  isNoMore = () => {
    const { totalCount, dataCards } = this.props;
    return totalCount === 0 || totalCount === dataCards.reduce((count = 0, card) => card.records.length + count, 0);
  };

  handleResize = () => {
    const headerElement = get(this.refHeader, 'current');

    if (headerElement) {
      headerElement.style.width = 0;
      this.forceUpdate();
    }
  };

  handleScrollFrame = (scroll = {}) => {
    // Same guard as componentDidUpdate: while a card move keeps isLoadingColumns filled, a scroll
    // to the bottom must not race reloadColumns with a page request either
    if (
      !this.state.isDragging &&
      !this.props.isLoading &&
      isEmpty(this.props.isLoadingColumns) &&
      !this.isNoMore() &&
      scroll.scrollTop &&
      scroll.scrollTop + scroll.clientHeight === scroll.scrollHeight
    ) {
      this.props.getNextPage();
    }
  };

  handleDragStart = result => {
    const { swimlaneGrouping } = this.props;
    const isDragging = true;
    let draggingSwimlaneId = null;

    if (swimlaneGrouping) {
      const droppableId = get(result, 'source.droppableId', '');
      const parts = droppableId.split('::');
      if (parts.length === 2) {
        draggingSwimlaneId = parts[0];
      }
    }

    this.setState({ isDragging, draggingSwimlaneId });
  };

  handleDragEnd = result => {
    const { swimlaneGrouping } = this.props;

    this.setState({ isDragging: false, draggingSwimlaneId: null });

    if (swimlaneGrouping) {
      this.handleSwimlanesDragEnd(result);
      return;
    }

    const cardIndex = get(result, 'source.index');
    const toIndex = get(result, 'destination.index');
    const fromColumnRef = get(result, 'source.droppableId');
    const toColumnRef = get(result, 'destination.droppableId');

    if (isNil(toColumnRef) || isNil(toIndex)) {
      return;
    }

    // Same-column reorder is now meaningful (persisted order) — skip only a true drop-in-place.
    if (fromColumnRef === toColumnRef && cardIndex === toIndex) {
      return;
    }

    this.props.moveCard({ cardIndex, toIndex, fromColumnRef, toColumnRef });
  };

  handleSwimlanesDragEnd = result => {
    const sourceId = get(result, 'source.droppableId');
    const destId = get(result, 'destination.droppableId');

    if (!destId) {
      return;
    }

    const sourceParts = sourceId.split('::');
    const destParts = destId.split('::');

    if (sourceParts.length !== 2 || destParts.length !== 2) {
      return;
    }

    const [fromSwimlaneId, fromStatusId] = sourceParts;
    const [toSwimlaneId, toStatusId] = destParts;

    if (fromSwimlaneId !== toSwimlaneId) {
      return; // moving across swimlanes is not supported
    }

    const cardIndex = get(result, 'source.index');
    const toIndex = get(result, 'destination.index');

    // Same-cell reorder is now meaningful — skip only a true drop-in-place.
    if (fromStatusId === toStatusId && cardIndex === toIndex) {
      return;
    }

    this.props.moveSwimlaneCard({
      cardIndex,
      toIndex,
      fromSwimlaneId,
      fromStatusId,
      toStatusId
    });
  };

  /**
   * @param {KanbanColumnData} data
   * @param {Number} index
   * @returns {JSX.Element}
   */
  renderColumn = (data, index) => {
    const {
      runAction,
      selectedBoard,
      boardConfig,
      dataCards,
      resolvedActions,
      formProps,
      isLoading,
      isFirstLoading,
      isFiltered,
      isLoadingColumns
    } = this.props;
    const { isDragging } = this.state;

    const columnData = (dataCards || []).find(card => card.status === data.id) || {};
    const colActions = (resolvedActions || []).find(a => a.status === data.id) || {};
    const isLoadingCol = (isLoadingColumns || []).includes(data.id);
    const readOnly = get(boardConfig, 'readOnly');

    return (
      <KanbanColumn
        key={`${index}_col_${selectedBoard}-${data.id}`}
        columnInfo={data}
        records={columnData.records}
        error={columnData.error}
        actions={colActions}
        formProps={formProps}
        boardConfig={boardConfig}
        readOnly={readOnly}
        isLoadingCol={isLoadingCol}
        isLoading={isLoading}
        isFirstLoading={isFirstLoading}
        isFiltered={isFiltered}
        hasSum={data.hasSum}
        isDragging={isDragging}
        onClickAction={runAction}
      />
    );
  };

  getColumns() {
    const { columns, kanbanSettings } = this.props;
    const defaultColumns = Array.isArray(columns) ? columns.filter(item => item && item.id) : [];
    const colsFromSettings = get(kanbanSettings, 'columns');
    const cols = colsFromSettings ? [] : defaultColumns;

    if (colsFromSettings) {
      defaultColumns.forEach(item => {
        if (item?.id) {
          const column = colsFromSettings.find(i => i && i.id === item.id);
          if (column?.default) {
            cols.push(item);
          }
        }
      });
    }

    return cols;
  }

  renderLayout({ extraClassName, onScrollFrame, renderHeader, renderBody, renderAfterScrollbars }) {
    const cols = this.getColumns();

    return (
      <ReactResizeDetector handleWidth onResize={this.handleResize} targetRef={this._kanbanRef}>
        <div
          ref={this._kanbanRef}
          className={classNames('ecos-kanban ecos-kanban__new', extraClassName)}
          style={{ '--count-col': cols.length || 1 }}
        >
          <Scrollbars
            autoHeight
            autoHeightMin={this.getHeight(-10)}
            autoHeightMax={this.getHeight(-10)}
            renderThumbVertical={props => <div {...props} className="ecos-kanban__scroll_v" />}
            renderTrackHorizontal={props => <div {...props} className="ecos-kanban__scroll_h" />}
            onScrollFrame={onScrollFrame}
            ref={this.refScroll}
          >
            <div className="ecos-kanban__head" ref={this.refHeader}>
              {renderHeader(cols)}
            </div>
            {renderBody(cols)}
            <div ref={this.refBottom} className="ecos-kanban__footer-border" />
          </Scrollbars>
          {renderAfterScrollbars && renderAfterScrollbars()}
        </div>
      </ReactResizeDetector>
    );
  }

  // In grouped mode the sum lives in each swimlane CELL, so this header turns it off — and with
  // `showSum={false}` `HeaderColumn` mounts no `ColumnSum` at all. None of the scope props the sum
  // needs (predicate, search, card type/source, journal predicate) are read here: passing them would
  // be dead weight that quietly pins a shape nothing depends on.
  renderSwimlaneHeader = cols => {
    const { swimlanes, isFirstLoading, selectedBoard } = this.props;

    return cols.map(data => {
      let totalCount = 0;
      (swimlanes || []).forEach(sl => {
        const cell = sl.cells[data.id];
        if (cell) {
          totalCount += cell.totalCount;
        }
      });

      return (
        <HeaderColumn
          key={`head_${selectedBoard}-${data.id}`}
          isReady={!isFirstLoading}
          data={data}
          totalCount={totalCount}
          showSum={false}
        />
      );
    });
  };

  renderSwimlaneBody = cols => {
    const {
      swimlanes,
      formProps,
      boardConfig,
      resolvedActions,
      isLoading,
      swimlaneGrouping,
      predicate,
      relatedFilter,
      journalPredicate,
      sourceId,
      ecosType,
      sumTypeRef
    } = this.props;
    const { isDragging, draggingSwimlaneId } = this.state;
    const readOnly = get(boardConfig, 'readOnly');

    return (
      <DragDropContext onDragEnd={this.handleDragEnd} onDragStart={this.handleDragStart}>
        <div className={classNames('ecos-kanban__swimlanes', { 'ecos-kanban__swimlanes_dragging': isDragging })} ref={this.refBody}>
          {isLoading && isEmpty(swimlanes) && <Loader />}
          {!isLoading && isEmpty(swimlanes) && isEmpty(cols) && (
            <div className="ecos-kanban__empty">
              <EmptyColumns />
              <p className="ecos-kanban__empty_text">{t(Labels.Kanban.NO_COLUMNS)}</p>
            </div>
          )}
          {(swimlanes || []).map(swimlane => (
            <Swimlane
              key={swimlane.id}
              swimlane={swimlane}
              columns={cols}
              formProps={formProps}
              readOnly={readOnly}
              boardConfig={boardConfig}
              resolvedActions={resolvedActions}
              swimlaneGrouping={swimlaneGrouping}
              predicate={predicate}
              searchPredicate={this.searchPredicate}
              relatedFilter={relatedFilter}
              sourceId={sourceId}
              ecosType={ecosType}
              sumTypeRef={sumTypeRef}
              journalPredicate={journalPredicate}
              isDragging={isDragging}
              draggingSwimlaneId={draggingSwimlaneId}
              onToggleCollapse={this.props.toggleSwimlaneCollapse}
              onLoadMore={this.props.loadMoreSwimlaneCell}
              onClickAction={this.props.runAction}
            />
          ))}
        </div>
      </DragDropContext>
    );
  };

  renderDefaultHeader = cols => {
    const {
      dataCards = [],
      isFirstLoading,
      selectedBoard,
      predicate,
      relatedFilter,
      journalPredicate,
      sourceId,
      ecosType,
      sumTypeRef
    } = this.props;

    return cols.map(data => {
      const column = dataCards.find(card => card.status === data.id);

      return (
        <HeaderColumn
          key={`head_${selectedBoard}-${data.id}`}
          isReady={!isFirstLoading}
          data={data}
          predicate={predicate}
          searchPredicate={this.searchPredicate}
          totalCount={get(column, 'totalCount', '⭯')}
          relatedFilter={relatedFilter}
          sourceId={sourceId}
          ecosType={ecosType}
          sumTypeRef={sumTypeRef}
          journalPredicate={journalPredicate}
        />
      );
    });
  };

  renderDefaultBody = cols => {
    const { isLoading } = this.props;
    const { isDragging } = this.state;

    // NB: the body must NOT be clamped/clipped while dragging — collapsing its height resets the
    // scroll container's scrollTop (the board "jumps" to the top when a low card is lifted) and
    // clips everything below the viewport, making rbd's auto-scroll useless.
    const bodyStyle = { minHeight: this.getHeight(-70) };

    return (
      <div
        className={classNames('ecos-kanban__body', {
          'ecos-kanban__body_dragging': isDragging,
          'ecos-kanban__body_end': this.isNoMore()
        })}
        style={bodyStyle}
        ref={this.refBody}
      >
        {isLoading && isEmpty(cols) && <Loader />}
        {!isLoading && isEmpty(cols) && (
          <div className="ecos-kanban__empty">
            <EmptyColumns />
            <p className="ecos-kanban__empty_text">{t(Labels.Kanban.NO_COLUMNS)}</p>
          </div>
        )}
        <DragDropContext onDragEnd={this.handleDragEnd} onDragStart={this.handleDragStart}>
          {cols.map(this.renderColumn)}
        </DragDropContext>
      </div>
    );
  };

  render() {
    const { swimlaneGrouping, isLoading, page } = this.props;

    if (swimlaneGrouping) {
      return this.renderLayout({
        extraClassName: 'ecos-kanban_swimlane',
        renderHeader: this.renderSwimlaneHeader,
        renderBody: this.renderSwimlaneBody
      });
    }

    return this.renderLayout({
      onScrollFrame: this.handleScrollFrame,
      renderHeader: this.renderDefaultHeader,
      renderBody: this.renderDefaultBody,
      renderAfterScrollbars: () => (isLoading && page > 1 ? <PointsLoader className="ecos-kanban__loader" /> : null)
    });
  }
}

// The bare class and the props mapping are exported for the tests, the application uses the
// connected default export.
export { Kanban, mapStateToProps };

export default connect(mapStateToProps, mapDispatchToProps)(Kanban);
