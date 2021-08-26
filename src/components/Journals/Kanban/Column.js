import React from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';
import isEmpty from 'lodash/isEmpty';
import { Droppable } from 'react-beautiful-dnd';

import { t } from '../../../helpers/export/util';
import { selectColumnProps } from '../../../selectors/kanban';
import { runAction } from '../../../actions/kanban';
import { InfoText } from '../../common';
import { Labels } from '../constants';
import Card from './Card';

class Column extends React.PureComponent {
  handleAction = (...data) => {
    this.props.runAction(...data);
  };

  renderInfo = () => {
    const { records, isFirstLoading, error } = this.props;
    let text;

    if (error) {
      text = error;
    } else if (isFirstLoading) {
      text = ' ';
    } else if (isEmpty(records)) {
      text = t(Labels.KB_COL_NO_CARD);
    }

    if (!text) {
      return null;
    }

    return (
      <div className="ecos-kanban__column-card_empty">
        <InfoText text={text} noIndents />
      </div>
    );
  };

  renderContentCard = (record, index) => {
    if (!record) {
      return null;
    }

    const { formProps, readOnly, actions = {} } = this.props;

    return (
      <Card
        key={record.cardId}
        cardIndex={index}
        data={record}
        formProps={formProps}
        readOnly={readOnly}
        actions={actions[record.cardId]}
        onClickAction={this.handleAction}
      />
    );
  };

  render() {
    const { records = [], data, readOnly } = this.props;

    return (
      <Droppable droppableId={data.id} isDropDisabled={readOnly}>
        {(provided, { draggingFromThisWith, draggingOverWith, isDraggingOver }) => (
          <div
            data-tip={draggingFromThisWith === draggingOverWith ? t(Labels.KB_DND_NOT_MOVE_HERE) : t(Labels.KB_DND_MOVE_HERE)}
            className={classNames('ecos-kanban__column', {
              'ecos-kanban__column_dragging-over': isDraggingOver,
              'ecos-kanban__column_dragging-over-owner': isDraggingOver && draggingFromThisWith === draggingOverWith
            })}
            {...provided.droppableProps}
            ref={provided.innerRef}
          >
            {records.map(this.renderContentCard)}
            {this.renderInfo()}
          </div>
        )}
      </Droppable>
    );
  }
}

function mapStateToProps(state, props) {
  return selectColumnProps(state, props.stateId, props.columnIndex);
}

function mapDispatchToProps(dispatch, props) {
  return {
    runAction: (recordRef, action) => dispatch(runAction({ recordRef, action, stateId: props.stateId }))
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Column);
