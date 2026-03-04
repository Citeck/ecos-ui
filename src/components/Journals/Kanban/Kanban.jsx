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

import { Loader, PointsLoader } from '../../common';
import { Labels } from '../constants';

import Column from './Column';
import HeaderColumn from './HeaderColumn';
import Swimlane from './Swimlane';

import { cancelGetNextBoardPage, getNextPage, loadMoreSwimlaneCell, moveCard, moveSwimlaneCard, runAction, toggleSwimlaneCollapse } from '@/actions/kanban';
import { ParserPredicate } from '@/components/Filters/predicates';
import EmptyColumns from '@/components/common/icons/EmptyColumns';
import { t } from '@/helpers/util';
import { selectJournalPageProps, selectJournalSetting } from '@/selectors/journals';
import { selectKanbanProps } from '@/selectors/kanban';
import { selectIsViewNewJournal } from '@/selectors/view';
import './style.scss';

function mapStateToProps(state, props) {
  const settings = selectJournalSetting(state, props.stateId);
  const journalPageProps = selectJournalPageProps(state, props.stateId);

  return {
    ...selectKanbanProps(state, props.stateId),
    predicate: settings.predicate,
    searchText: get(journalPageProps, 'grid.search'),
    journalSetting: journalPageProps.journalSetting,
    isViewNewJournal: selectIsViewNewJournal(state)
  };
}

function mapDispatchToProps(dispatch, props) {
  return {
    getNextPage: settings => dispatch(getNextPage({ stateId: props.stateId, ...settings })),
    cancelGetNextBoardPage: () => dispatch(cancelGetNextBoardPage({ stateId: props.stateId })),
    moveCard: data => dispatch(moveCard({ stateId: props.stateId, ...data })),
    runAction: (recordRef, action) => dispatch(runAction({ recordRef, action, stateId: props.stateId })),
    toggleSwimlaneCollapse: swimlaneId => dispatch(toggleSwimlaneCollapse({ stateId: props.stateId, swimlaneId })),
    loadMoreSwimlaneCell: (swimlaneId, statusId) =>
      dispatch(loadMoreSwimlaneCell({ stateId: props.stateId, swimlaneId, statusId })),
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

  state = {
    isDragging: false,
    draggingSwimlaneId: null
  };

  get searchPredicate() {
    const { searchText, journalSetting } = this.props;

    return !isEmpty(searchText)
      ? ParserPredicate.getSearchPredicates({
          text: searchText,
          columns: ParserPredicate.getAvailableSearchColumns(journalSetting.columns)
        })
      : null;
  }

  componentDidMount() {
    this.observer = new IntersectionObserver(([entry]) => {
      this.setState({ isInView: entry.isIntersecting });
    });

    this.observer.observe(this.refBottom.current);
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const { isLoading, isFirstLoading, columns, kanbanSettings, swimlaneGrouping } = this.props;
    const headerElement = get(this.refHeader, 'current');
    const bodyElement = get(this.refBody, 'current');

    if (isLoading || isFirstLoading) {
      if (headerElement) {
        headerElement.style.width = 0;
      }

      return;
    }

    if (!swimlaneGrouping && !this.state.isDragging && this.state.isInView && !this.isNoMore()) {
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
    if (!this.state.isDragging && !this.props.isLoading && !this.isNoMore() && scroll.scrollTop && scroll.scrollTop + scroll.clientHeight === scroll.scrollHeight) {
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
    const fromColumnRef = get(result, 'source.droppableId');
    const toColumnRef = get(result, 'destination.droppableId');

    if (fromColumnRef === toColumnRef || isNil(toColumnRef)) {
      return;
    }

    this.props.moveCard({ cardIndex, fromColumnRef, toColumnRef });
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
      return;
    }

    if (fromStatusId === toStatusId) {
      return;
    }

    const cardIndex = get(result, 'source.index');

    this.props.moveSwimlaneCard({
      cardIndex,
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
    const { stateId, runAction, selectedBoard, boardConfig } = this.props;
    const { isDragging } = this.state;

    return (
      <Column
        key={`${index}_col_${selectedBoard}-${data.id}`}
        data={data}
        stateId={stateId}
        columnStatus={data.id}
        isDragging={isDragging}
        boardConfig={boardConfig}
        runAction={runAction}
        hasSum={data.hasSum}
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
    const { isViewNewJournal } = this.props;
    const cols = this.getColumns();

    return (
      <ReactResizeDetector handleWidth onResize={this.handleResize}>
        <div className={classNames('ecos-kanban', extraClassName, { 'ecos-kanban__new': isViewNewJournal })} style={{ '--count-col': cols.length || 1 }}>
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

  renderSwimlaneHeader = cols => {
    const { swimlanes, isFirstLoading, selectedBoard, predicate, boardConfig, isViewNewJournal } = this.props;

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
          predicate={predicate}
          searchPredicate={this.searchPredicate}
          typeRef={get(boardConfig, 'typeRef')}
          totalCount={totalCount}
          isViewNewJournal={isViewNewJournal}
        />
      );
    });
  };

  renderSwimlaneBody = cols => {
    const { swimlanes, formProps, boardConfig, resolvedActions, isLoading } = this.props;
    const { isDragging, draggingSwimlaneId } = this.state;
    const readOnly = get(boardConfig, 'readOnly');

    return (
      <DragDropContext onDragEnd={this.handleDragEnd} onDragStart={this.handleDragStart}>
        <div className="ecos-kanban__swimlanes" ref={this.refBody}>
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
    const { dataCards = [], isFirstLoading, selectedBoard, predicate, boardConfig, isViewNewJournal } = this.props;

    return cols.map(data => {
      const column = dataCards.find(card => card.status === data.id);

      return (
        <HeaderColumn
          key={`head_${selectedBoard}-${data.id}`}
          isReady={!isFirstLoading}
          data={data}
          predicate={predicate}
          searchPredicate={this.searchPredicate}
          typeRef={get(boardConfig, 'typeRef')}
          totalCount={get(column, 'totalCount', '⭯')}
          isViewNewJournal={isViewNewJournal}
        />
      );
    });
  };

  renderDefaultBody = cols => {
    const { isLoading } = this.props;
    const { isDragging } = this.state;

    const bodyStyle = { minHeight: this.getHeight(-70) };

    if (isDragging) {
      bodyStyle.height = bodyStyle.minHeight;
      bodyStyle.overflow = 'hidden';
    }

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
      renderAfterScrollbars: () => isLoading && page > 1 ? <PointsLoader className="ecos-kanban__loader" /> : null
    });
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Kanban);
