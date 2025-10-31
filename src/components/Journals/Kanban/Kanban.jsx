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

import { InfoText, Loader, PointsLoader } from '../../common';
import { Labels } from '../constants';

import Column from './Column';
import HeaderColumn from './HeaderColumn';

import { cancelGetNextBoardPage, getNextPage, moveCard, runAction } from '@/actions/kanban';
import { ParserPredicate } from '@/components/Filters/predicates';
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
    runAction: (recordRef, action) => dispatch(runAction({ recordRef, action, stateId: props.stateId }))
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
    isDragging: false
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
    const { isLoading, isFirstLoading } = this.props;
    const headerElement = get(this.refHeader, 'current');
    const bodyElement = get(this.refBody, 'current');

    if (isLoading || isFirstLoading) {
      if (headerElement) {
        headerElement.style.width = 0;
      }

      return;
    }

    if (this.state.isInView && !this.isNoMore()) {
      this.props.cancelGetNextBoardPage();
      this.props.getNextPage({ isSkipPagination: true });
    }

    if (headerElement && bodyElement) {
      const max = Math.max(headerElement.scrollWidth, bodyElement.scrollWidth);
      headerElement.style.width = `${max}px`;
      bodyElement.style.width = `${max}px`;
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
    if (!this.props.isLoading && !this.isNoMore() && scroll.scrollTop && scroll.scrollTop + scroll.clientHeight === scroll.scrollHeight) {
      this.props.getNextPage();
    }
  };

  handleDragStart = () => {
    const isDragging = true;

    this.setState({ isDragging });
  };

  handleDragEnd = result => {
    const isDragging = false;

    this.setState({ isDragging });

    const cardIndex = get(result, 'source.index');
    const fromColumnRef = get(result, 'source.droppableId');
    const toColumnRef = get(result, 'destination.droppableId');

    if (fromColumnRef === toColumnRef || isNil(toColumnRef)) {
      return;
    }

    this.props.moveCard({ cardIndex, fromColumnRef, toColumnRef });
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

  render() {
    const {
      columns,
      dataCards = [],
      isLoading,
      isFirstLoading,
      page,
      selectedBoard,
      kanbanSettings,
      isViewNewJournal,
      predicate,
      boardConfig
    } = this.props;
    const { isDragging } = this.state;
    const bodyStyle = { minHeight: this.getHeight(-70) };

    const defaultColumns = Array.isArray(columns) ? columns.filter(item => item && item.id) : [];
    const colsFromSettings = get(kanbanSettings, 'columns');
    const cols = colsFromSettings ? [] : defaultColumns;

    /* To prevent the columns from changing places, you need to go through the default columns and insert them in the same order */
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

    if (isDragging) {
      bodyStyle.height = bodyStyle.minHeight;
      bodyStyle.overflow = 'hidden';
    }

    return (
      <ReactResizeDetector handleWidth onResize={this.handleResize}>
        <div className={classNames('ecos-kanban', { 'ecos-kanban__new': isViewNewJournal })} style={{ '--count-col': cols.length || 1 }}>
          <Scrollbars
            autoHeight
            autoHeightMin={this.getHeight(-10)}
            autoHeightMax={this.getHeight(-10)}
            renderThumbVertical={props => <div {...props} className="ecos-kanban__scroll_v" />}
            renderTrackHorizontal={props => <div {...props} className="ecos-kanban__scroll_h" />}
            onScrollFrame={this.handleScrollFrame}
            ref={this.refScroll}
          >
            <div className="ecos-kanban__head" ref={this.refHeader}>
              {cols.map(data => {
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
              })}
            </div>
            <div
              className={classNames('ecos-kanban__body', {
                'ecos-kanban__body_dragging': isDragging,
                'ecos-kanban__body_end': this.isNoMore()
              })}
              style={bodyStyle}
              ref={this.refBody}
            >
              {isLoading && isEmpty(cols) && <Loader />}
              {!isLoading && isEmpty(cols) && <InfoText className="ecos-kanban__info" text={t(Labels.Kanban.NO_COLUMNS)} />}
              <DragDropContext onDragEnd={this.handleDragEnd} onDragStart={this.handleDragStart}>
                {cols.map(this.renderColumn)}
              </DragDropContext>
            </div>
            <div ref={this.refBottom} className="ecos-kanban__footer-border" />
          </Scrollbars>
          {isLoading && page > 1 && <PointsLoader className="ecos-kanban__loader" />}
        </div>
      </ReactResizeDetector>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Kanban);
