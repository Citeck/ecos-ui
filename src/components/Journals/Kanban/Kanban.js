import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classNames from 'classnames';
import get from 'lodash/get';
import isEqualWith from 'lodash/isEqualWith';
import isEqual from 'lodash/isEqual';
import isEmpty from 'lodash/isEmpty';
import isNil from 'lodash/isNil';
import { Scrollbars } from 'react-custom-scrollbars';
import { DragDropContext } from 'react-beautiful-dnd';
import ReactResizeDetector from 'react-resize-detector';

import { getNextPage, moveCard, runAction } from '../../../actions/kanban';
import { selectKanbanProps } from '../../../selectors/kanban';
import { t } from '../../../helpers/util';
import { InfoText, Loader, PointsLoader } from '../../common';
import { Labels } from '../constants';
import HeaderColumn from './HeaderColumn';
import Column from './Column';

import './style.scss';

function mapStateToProps(state, props) {
  return selectKanbanProps(state, props.stateId);
}

function mapDispatchToProps(dispatch, props) {
  return {
    getNextPage: () => dispatch(getNextPage({ stateId: props.stateId })),
    moveCard: data => dispatch(moveCard({ stateId: props.stateId, ...data })),
    runAction: (recordRef, action) => dispatch(runAction({ recordRef, action, stateId: props.stateId }))
  };
}

class Kanban extends React.Component {
  static propTypes = {
    getNextPage: PropTypes.func,
    moveCard: PropTypes.func,
    runAction: PropTypes.func
  };

  refBody = React.createRef();
  refScroll = React.createRef();
  refHeader = React.createRef();

  state = {
    isDragging: false
  };

  componentDidUpdate(prevProps, prevState, snapshot) {
    const height = get(this.refBody, 'current.clientHeight');
    const { dataCards, isLoading, isFirstLoading } = this.props;
    const headerElement = get(this.refHeader, 'current');

    if (isLoading || isFirstLoading) {
      if (headerElement) {
        headerElement.style.width = 0;
      }

      return;
    }

    if (!isEqualWith(prevProps.dataCards, dataCards, isEqual) && !!height) {
      if (this.getHeight() > height && !this.isNoMore()) {
        this.props.getNextPage();
      }
    }

    if (headerElement) {
      headerElement.style.width = `${headerElement.scrollWidth}px`;
    }
  }

  getHeight(changes = 0) {
    return this.props.maxHeight + changes;
  }

  isNoMore = () => {
    const { totalCount, dataCards } = this.props;

    return totalCount !== 0 && totalCount === dataCards.reduce((count = 0, card) => card.records.length + count, 0);
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
    const { stateId, runAction, selectedBoard } = this.props;
    const { isDragging } = this.state;

    return (
      <Column
        key={`col_${selectedBoard}-${data.id}`}
        data={data}
        stateId={stateId}
        columnIndex={index}
        isDragging={isDragging}
        runAction={runAction}
      />
    );
  };

  render() {
    const { columns, dataCards = [], isLoading, isFirstLoading, page, selectedBoard } = this.props;
    const { isDragging } = this.state;
    const bodyStyle = { minHeight: this.getHeight(-70) };
    const cols = Array.isArray(columns) ? columns.filter(item => item && item.id) : [];

    if (isDragging) {
      bodyStyle.height = bodyStyle.minHeight;
      bodyStyle.overflow = 'hidden';
    }

    return (
      <ReactResizeDetector handleWidth onResize={this.handleResize}>
        <div className="ecos-kanban" style={{ '--count-col': cols.length || 1 }}>
          <Scrollbars
            autoHeight
            autoHeightMin={this.getHeight()}
            autoHeightMax={this.getHeight()}
            renderThumbVertical={props => <div {...props} className="ecos-kanban__scroll_v" />}
            renderTrackHorizontal={props => <div {...props} className="ecos-kanban__scroll_h" />}
            onScrollFrame={this.handleScrollFrame}
            ref={this.refScroll}
          >
            <div className="ecos-kanban__head" ref={this.refHeader}>
              {cols.map((data, index) => (
                <HeaderColumn
                  key={`head_${selectedBoard}-${data.id}`}
                  isReady={!isFirstLoading}
                  data={data}
                  totalCount={get(dataCards, [index, 'totalCount'], '⭯')}
                />
              ))}
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
          </Scrollbars>
          {isLoading && page > 1 && <PointsLoader className="ecos-kanban__loader" color={'light-blue'} />}
        </div>
      </ReactResizeDetector>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Kanban);
