import React from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';
import isEmpty from 'lodash/isEmpty';
import { Droppable } from 'react-beautiful-dnd';

import { t } from '../../../helpers/export/util';
import { runAction } from '../../../actions/kanban';
import { selectColumnProps } from '../../../selectors/kanban';
import { Loader } from '../../common';
import { Labels } from '../constants';
import { isDropDisabled } from './utils';
import Card from './Card';

class Column extends React.PureComponent {
  handleAction = (...data) => {
    this.props.runAction(...data);
  };

  getIsColumnDropDisabled() {
    const { readOnly, isLoadingCol, columnInfo } = this.props;
    return isDropDisabled({ readOnly, isLoadingCol, columnInfo });
  }

  renderStatuses = flags => {
    const { records, isFirstLoading, isFiltered, isLoading, isLoadingCol, error, isDragging, readOnly } = this.props;

    if (isLoadingCol) {
      return null;
    }

    const loading = isFirstLoading || (isLoading && isFiltered);
    const dropDisabled = this.getIsColumnDropDisabled();

    const statuses = [
      {
        text: t(Labels.Kanban.COL_NO_CARD),
        isAvailable: !loading && !error && !isDragging && isEmpty(records)
      },
      {
        text: t(Labels.Kanban.ERROR_FETCH_DATA),
        isAlert: !!error,
        isAvailable: !!error
      },
      {
        text: ' ',
        isAvailable: loading
      },
      {
        text: t(Labels.Kanban.DND_ALREADY_HERE),
        isFloat: true,
        isAvailable: !readOnly && !dropDisabled && flags.isColumnOwner
      },
      {
        text: t(Labels.Kanban.DND_MOVE_HERE),
        isFloat: true,
        isAvailable: !readOnly && !dropDisabled && !flags.isColumnOwner
      },
      {
        text: t(Labels.Kanban.DND_NOT_MOVE_HERE),
        isFloat: true,
        isAvailable: !readOnly && dropDisabled
      }
    ];

    return statuses
      .filter(status => status.isAvailable)
      .map(status => (
        <div
          className={classNames('ecos-kanban__card-info', {
            'ecos-kanban__card-info_alert': status.isAlert,
            'ecos-kanban__card-info_loading': loading,
            'ecos-kanban__card-info_float': status.isFloat
          })}
        >
          {status.text}
        </div>
      ));
  };

  renderContentCard = (record, index) => {
    if (!record) {
      return null;
    }

    const { formProps, readOnly, actions = {}, cardFormRef } = this.props;

    return (
      <Card
        key={record.cardId}
        cardIndex={index}
        data={record}
        formProps={formProps}
        readOnly={readOnly}
        cardFormRef={cardFormRef}
        actions={actions[record.cardId]}
        onClickAction={this.handleAction}
      />
    );
  };

  render() {
    const { records = [], data, isLoadingCol } = this.props;
    const isDropDisabled = this.getIsColumnDropDisabled();

    return (
      <Droppable droppableId={data.id} isDropDisabled={isDropDisabled}>
        {(provided, { draggingFromThisWith, isDraggingOver }) => {
          const isColumnOwner = records.some(rec => rec.cardId === draggingFromThisWith);

          return (
            <div
              className={classNames('ecos-kanban__column', {
                'ecos-kanban__column_dragging-over': isDraggingOver,
                'ecos-kanban__column_loading': isLoadingCol,
                'ecos-kanban__column_disabled': isDropDisabled,
                'ecos-kanban__column_owner': isColumnOwner,
                'ecos-kanban__column_empty': isEmpty(records)
              })}
              {...provided.droppableProps}
              ref={provided.innerRef}
            >
              {isLoadingCol && <Loader className="ecos-kanban__column-loader" blur />}
              {this.renderStatuses({ isColumnOwner, isDraggingOver })}
              {records.map(this.renderContentCard)}
            </div>
          );
        }}
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
