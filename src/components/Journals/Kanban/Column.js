import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classNames from 'classnames';
import isEmpty from 'lodash/isEmpty';
import { Droppable } from 'react-beautiful-dnd';

import { t } from '../../../helpers/export/util';
import { selectColumnProps } from '../../../selectors/kanban';
import { Loader } from '../../common';
import { Labels } from '../constants';
import { isDropDisabled } from './utils';
import Card from './Card';

class Column extends React.PureComponent {
  static propTypes = {
    runAction: PropTypes.func,
    columnInfo: PropTypes.shape({ id: PropTypes.string, name: PropTypes.string }),
    records: PropTypes.array,
    error: PropTypes.string,
    actions: PropTypes.object,
    formProps: PropTypes.object,
    readOnly: PropTypes.bool,
    isLoading: PropTypes.bool,
    isFiltered: PropTypes.bool,
    isLoadingCol: PropTypes.bool,
    isFirstLoading: PropTypes.bool
  };

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
        <span
          className={classNames('ecos-kanban__card-info', {
            'ecos-kanban__card-info_alert': status.isAlert,
            'ecos-kanban__card-info_loading': loading,
            'ecos-kanban__card-info_float': status.isFloat
          })}
        >
          {status.text}
        </span>
      ));
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
    const { records = [], columnInfo, isLoadingCol } = this.props;
    const isDropDisabled = this.getIsColumnDropDisabled();

    if (isEmpty(columnInfo)) {
      return null;
    }

    return (
      <Droppable droppableId={columnInfo.id} isDropDisabled={isDropDisabled}>
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
  return selectColumnProps(state, props.stateId, props.columnStatus);
}

export default connect(mapStateToProps)(Column);
