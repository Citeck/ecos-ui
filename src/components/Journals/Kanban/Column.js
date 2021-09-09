import React from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';
import isEmpty from 'lodash/isEmpty';
import { Droppable } from 'react-beautiful-dnd';

import { t } from '../../../helpers/export/util';
import { selectColumnProps } from '../../../selectors/kanban';
import { runAction } from '../../../actions/kanban';
import { InfoText, Loader } from '../../common';
import { Labels } from '../constants';
import { isDropDisabled } from './utils';
import Card from './Card';

class Column extends React.PureComponent {
  handleAction = (...data) => {
    this.props.runAction(...data);
  };

  renderInfo = () => {
    const { records, isFirstLoading, isFiltered, isLoading, isLoadingCol, error } = this.props;
    let text;
    const loading = isFirstLoading || (isLoading && isFiltered) || isLoadingCol;

    if (error) {
      text = error;
    } else if (loading) {
      text = ' ';
    } else if (isEmpty(records)) {
      text = t(Labels.Kanban.COL_NO_CARD);
    }

    if (!text) {
      return null;
    }

    return (
      <div className={classNames('ecos-kanban__card_empty', { 'ecos-kanban__card_loading': loading })}>
        <InfoText text={text} noIndents type={'primary'} />
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
    const { records = [], data, readOnly, isLoadingCol, columnInfo } = this.props;
    const dropDisabled = isDropDisabled({ readOnly, isLoadingCol, columnInfo });

    return (
      <Droppable droppableId={data.id} isDropDisabled={dropDisabled}>
        {(provided, { draggingFromThisWith, draggingOverWith, isDraggingOver }) => (
          <div
            data-tip={draggingFromThisWith === draggingOverWith ? t(Labels.Kanban.DND_NOT_MOVE_HERE) : t(Labels.Kanban.DND_MOVE_HERE)}
            className={classNames('ecos-kanban__column', {
              'ecos-kanban__column_dragging-over': isDraggingOver,
              'ecos-kanban__column_loading': isLoadingCol,
              'ecos-kanban__column_disabled': dropDisabled,
              'ecos-kanban__column_owner': isDraggingOver && draggingFromThisWith === draggingOverWith
            })}
            {...provided.droppableProps}
            ref={provided.innerRef}
          >
            {isLoadingCol && <Loader className="ecos-kanban__column-loader" blur />}
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
