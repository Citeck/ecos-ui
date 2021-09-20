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

  renderInfo = flags => {
    const { records, isFirstLoading, isFiltered, isLoading, isLoadingCol, error, isDragging } = this.props;
    const loading = isFirstLoading || (isLoading && isFiltered);
    const dropDisabled = this.getIsColumnDropDisabled();

    let text = '';
    let temp = false;

    switch (true) {
      case !!error:
        text = t(Labels.Kanban.ERROR_FETCH_DATA);
        break;
      case loading:
        text = ' ';
        break;
      case dropDisabled && !isEmpty(records):
        temp = true;
        text = t(Labels.Kanban.DND_NOT_MOVE_HERE);
        break;
      case flags.isColumnOwner:
        temp = true;
        text = t(Labels.Kanban.DND_ALREADY_HERE);
        break;
      case flags.isDraggingOver:
        temp = true;
        text = t(Labels.Kanban.DND_MOVE_HERE);
        break;
      case !isDragging && isEmpty(records):
        text = t(Labels.Kanban.COL_NO_CARD);
        break;
      default:
        break;
    }

    return (
      <div
        className={classNames('ecos-kanban__card-info', {
          'ecos-kanban__card-info_hidden': !text || isLoadingCol,
          'ecos-kanban__card-info_error': !!error,
          'ecos-kanban__card-info_loading': loading,
          'ecos-kanban__card-info_temp': temp
        })}
      >
        {text}
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
              {this.renderInfo({ isColumnOwner, isDraggingOver })}
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
