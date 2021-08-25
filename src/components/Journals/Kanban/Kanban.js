import React from 'react';
import { connect } from 'react-redux';
import get from 'lodash/get';
import isEqualWith from 'lodash/isEqualWith';
import isEqual from 'lodash/isEqual';
import { Scrollbars } from 'react-custom-scrollbars';
import { DragDropContext } from 'react-beautiful-dnd';

import { extractLabel } from '../../../helpers/util';
import { t } from '../../../helpers/export/util';
import { getNextPage, moveCard } from '../../../actions/kanban';
import { selectKanbanProps } from '../../../selectors/kanban';
import { InfoText, PointsLoader } from '../../common';
import { Badge, Caption } from '../../common/form';
import TitlePageLoader from '../../common/TitlePageLoader';
import { Labels } from '../constants';
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

  componentDidUpdate(prevProps, prevState, snapshot) {
    const height = get(this.refBody, 'current.clientHeight');

    if (!isEqualWith(prevProps.dataCards, this.props.dataCards, isEqual) && !!height) {
      if (this.getHeight() > height && !this.isNoMore()) {
        this.props.getNextPage();
      }
    }
  }

  getHeight() {
    return this.props.maxHeight - 100;
  }

  isNoMore = () => {
    const { totalCount, dataCards } = this.props;

    return totalCount !== 0 && totalCount === dataCards.reduce((count, card) => card.records.length + count, 0);
  };

  handleScrollFrame = (scroll = {}) => {
    if (!this.isNoMore() && scroll.scrollTop + scroll.clientHeight === scroll.scrollHeight) {
      this.props.getNextPage();
    }
  };

  handleDragEnd = result => {
    const cardRef = get(result, 'draggableId');
    const cardIndex = get(result, 'source.index');
    const fromColumnRef = get(result, 'source.droppableId');
    const toColumnRef = get(result, 'destination.droppableId');

    if (fromColumnRef === toColumnRef) {
      return;
    }

    this.props.moveCard({ cardIndex, cardRef, fromColumnRef, toColumnRef });
  };

  renderHeaderColumn = (data, index) => {
    const { dataCards = [], isFirstLoading } = this.props;
    const totalCount = get(dataCards, [index, 'totalCount']);

    return (
      <div className="ecos-kanban__column" key={`head_${data.id}`}>
        <div className="ecos-kanban__column-head">
          <TitlePageLoader isReady={!isFirstLoading} withBadge>
            <Caption small className="ecos-kanban__column-head-caption">
              {extractLabel(data.name).toUpperCase() || t(Labels.KB_CARD_NO_TITLE)}
            </Caption>
            {!!totalCount && <Badge text={totalCount} outline />}
          </TitlePageLoader>
        </div>
      </div>
    );
  };

  renderColumn = (data, index) => {
    const { stateId } = this.props;

    return <Column key={`col_${data.id}`} data={data} stateId={stateId} columnIndex={index} />;
  };

  render() {
    const { columns = [], isLoading, isFirstLoading } = this.props;
    const cols = columns || Array(3).map((_, id) => ({ id }));

    return (
      <div className="ecos-kanban">
        <div className="ecos-kanban__head">{cols.map(this.renderHeaderColumn)}</div>
        <Scrollbars
          autoHeight
          autoHeightMin={this.getHeight()}
          autoHeightMax={this.getHeight()}
          renderThumbVertical={props => <div {...props} className="ecos-kanban__scroll_v" />}
          renderTrackHorizontal={() => <div hidden />}
          onScrollFrame={this.handleScrollFrame}
        >
          <div className="ecos-kanban__body" ref={this.refBody}>
            <DragDropContext onDragEnd={this.handleDragEnd}>{columns.map(this.renderColumn)}</DragDropContext>
          </div>
          {this.isNoMore() && <InfoText noIndents text={t(Labels.KB_COL_NO_MORE_CARDS)} />}
          {(isLoading || isFirstLoading) && <PointsLoader className="ecos-kanban__loader" color={'light-blue'} />}
        </Scrollbars>
      </div>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Kanban);
