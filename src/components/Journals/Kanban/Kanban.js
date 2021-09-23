import React from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';
import get from 'lodash/get';
import isEqualWith from 'lodash/isEqualWith';
import isEqual from 'lodash/isEqual';
import isEmpty from 'lodash/isEmpty';
import { Scrollbars } from 'react-custom-scrollbars';
import { DragDropContext } from 'react-beautiful-dnd';

import { getNextPage, moveCard } from '../../../actions/kanban';
import { selectKanbanProps } from '../../../selectors/kanban';
import { isExistValue, t } from '../../../helpers/util';
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
    moveCard: data => dispatch(moveCard({ stateId: props.stateId, ...data }))
  };
}

class Kanban extends React.Component {
  refBody = React.createRef();
  refScroll = React.createRef();

  state = {
    isDragging: false
  };

  componentDidUpdate(prevProps, prevState, snapshot) {
    const height = get(this.refBody, 'current.clientHeight');
    const { dataCards, isLoading, isFirstLoading } = this.props;

    if (isLoading || isFirstLoading) {
      return;
    }

    if (!isEqualWith(prevProps.dataCards, dataCards, isEqual) && !!height) {
      if (this.getHeight() > height && !this.isNoMore()) {
        this.props.getNextPage();
      }
    }
  }

  getHeight(changes = 0) {
    return this.props.maxHeight - 40 + changes;
  }

  isNoMore = () => {
    const { totalCount, dataCards } = this.props;

    return totalCount !== 0 && totalCount === dataCards.reduce((count = 0, card) => card.records.length + count, 0);
  };

  handleScrollFrame = (scroll = {}) => {
    if (!this.props.isLoading && !this.isNoMore() && scroll.scrollTop + scroll.clientHeight === scroll.scrollHeight) {
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

    if (fromColumnRef === toColumnRef || !isExistValue(toColumnRef)) {
      return;
    }

    this.props.moveCard({ cardIndex, fromColumnRef, toColumnRef });
  };

  renderColumn = (data, index) => {
    const { isDragging } = this.state;
    const { stateId } = this.props;

    return <Column key={`col_${data.id}`} data={data} stateId={stateId} columnIndex={index} isDragging={isDragging} />;
  };

  render() {
    const { isDragging } = this.state;
    const { columns = [], dataCards = [], isLoading, isFirstLoading, page } = this.props;
    const bodyStyle = { minHeight: this.getHeight(-70) };

    if (isDragging) {
      bodyStyle.height = bodyStyle.minHeight;
      bodyStyle.overflow = 'hidden';
    }

    return (
      <div className="ecos-kanban" style={{ '--count-col': columns.length || 1 }}>
        <Scrollbars
          autoHeight
          autoHeightMin={this.getHeight()}
          autoHeightMax={this.getHeight()}
          renderThumbVertical={props => <div {...props} className="ecos-kanban__scroll_v" />}
          renderTrackHorizontal={props => <div {...props} className="ecos-kanban__scroll_h" />}
          onScrollFrame={this.handleScrollFrame}
          ref={this.refScroll}
        >
          <div className="ecos-kanban__head">
            {columns.map((data, index) => (
              <HeaderColumn
                key={`head_${data.id}`}
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
            {isLoading && isEmpty(columns) && <Loader />}
            {!isLoading && isEmpty(columns) && <InfoText className="ecos-kanban__info" text={t(Labels.Kanban.NO_COLUMNS)} />}
            <DragDropContext onDragEnd={this.handleDragEnd} onDragStart={this.handleDragStart}>
              {columns.map(this.renderColumn)}
            </DragDropContext>
          </div>
        </Scrollbars>
        {isLoading && page > 1 && <PointsLoader className="ecos-kanban__loader" color={'light-blue'} />}
      </div>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Kanban);
