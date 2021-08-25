import React from 'react';
import { connect } from 'react-redux';
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
    const { records = [], data } = this.props;

    return (
      <Droppable droppableId={data.id}>
        {(provided, snapshot) => (
          <div
            className="ecos-kanban__column"
            {...provided.droppableProps}
            ref={provided.innerRef}
            style={{
              background: snapshot.isDraggingOver ? 'lightblue' : 'lightgrey'
            }}
          >
            <div className="ecos-kanban__column-card-list">
              {records.map(this.renderContentCard)}
              {this.renderInfo()}
            </div>
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
