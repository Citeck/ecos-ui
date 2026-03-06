import classNames from 'classnames';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import PropTypes from 'prop-types';
import React from 'react';
import { Droppable } from 'react-beautiful-dnd';

import { t } from '@/helpers/util';
import { Loader } from '../../common';
import { Labels } from '../constants';
import Card from './Card';
import { isDropDisabled as checkDropDisabled } from './utils';

const KanbanColumn = ({
  columnInfo,
  swimlaneId,
  statusId,
  records = [],
  totalCount,
  error,
  formProps,
  actions = {},
  boardConfig = {},
  swimlaneColor,
  readOnly,
  isLoadingCol,
  isLoading,
  isFirstLoading,
  isFiltered,
  hasSum,
  isDragging,
  draggingSwimlaneId,
  isCollapsed,
  onClickAction,
  onLoadMore
}) => {
  if (isEmpty(columnInfo)) {
    return null;
  }

  const isSwimlaneMode = !!swimlaneId;
  const droppableId = isSwimlaneMode ? `${swimlaneId}::${statusId}` : columnInfo.id;

  if (isCollapsed) {
    return (
      <Droppable droppableId={droppableId} isDropDisabled>
        {(provided) => (
          <div
            className={classNames('ecos-kanban__column', { 'ecos-kanban__column_has-sum': hasSum })}
            {...provided.droppableProps}
            ref={provided.innerRef}
          >
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    );
  }

  const dropDisabled =
    checkDropDisabled({ readOnly, isLoadingCol, columnInfo }) ||
    (isSwimlaneMode && isDragging && !!draggingSwimlaneId && draggingSwimlaneId !== swimlaneId);

  const remaining = isSwimlaneMode && typeof totalCount === 'number' ? totalCount - records.length : 0;
  const isFlatLoading = !isSwimlaneMode && (isFirstLoading || (isLoading && isFiltered));

  const renderStatuses = ({ isColumnOwner }) => {
    if (isLoadingCol) {
      return null;
    }

    const statuses = [
      {
        text: t(Labels.Kanban.COL_NO_CARD),
        isAvailable: isEmpty(records) && !isDragging && (isSwimlaneMode ? !isLoading : !isFlatLoading && !error)
      },
      {
        text: t(Labels.Kanban.ERROR_FETCH_DATA),
        isAlert: true,
        isAvailable: !!error
      },
      {
        text: ' ',
        isAvailable: isFlatLoading
      },
      {
        text: t(Labels.Kanban.DND_ALREADY_HERE),
        isFloat: true,
        isAvailable: !readOnly && !dropDisabled && isColumnOwner
      },
      {
        text: t(Labels.Kanban.DND_MOVE_HERE),
        isFloat: true,
        isAvailable: !readOnly && !dropDisabled && !isColumnOwner
      },
      {
        text: t(Labels.Kanban.DND_NOT_MOVE_HERE),
        isFloat: true,
        isAvailable: !readOnly && dropDisabled
      }
    ];

    return statuses
      .filter(s => s.isAvailable)
      .map((s, i) => (
        <span
          key={i}
          className={classNames('ecos-kanban__card-info', {
            'ecos-kanban__card-info_alert': s.isAlert,
            'ecos-kanban__card-info_loading': isFlatLoading,
            'ecos-kanban__card-info_float': s.isFloat
          })}
        >
          {s.text}
        </span>
      ));
  };

  const renderCard = (record, index) => {
    if (!record) return null;

    const colorMap = get(boardConfig, 'colorMap', {});
    const colorValue = get(record, '_colorAttrValue');
    const cardColor = colorValue ? colorMap[colorValue] || null : swimlaneColor || null;

    return (
      <Card
        key={record.cardId || record.id}
        cardIndex={index}
        data={record}
        formProps={formProps}
        readOnly={readOnly}
        actions={actions[record.cardId]}
        boardConfig={boardConfig}
        swimlaneColor={cardColor}
        onClickAction={onClickAction}
      />
    );
  };

  return (
    <Droppable droppableId={droppableId} isDropDisabled={dropDisabled}>
      {(provided, { draggingFromThisWith, isDraggingOver }) => {
        const isColumnOwner = records.some(rec => rec.cardId === draggingFromThisWith);

        return (
          <div
            className={classNames('ecos-kanban__column', {
              'ecos-kanban__column_dragging-over': isDraggingOver,
              'ecos-kanban__column_loading': isLoadingCol,
              'ecos-kanban__column_disabled': dropDisabled,
              'ecos-kanban__column_has-sum': hasSum,
              'ecos-kanban__column_owner': isColumnOwner,
              'ecos-kanban__column_empty': isEmpty(records)
            })}
            {...provided.droppableProps}
            ref={provided.innerRef}
          >
            {isLoadingCol && <Loader className="ecos-kanban__column-loader" blur />}
            {isSwimlaneMode && isLoading && isEmpty(records) && <Loader className="ecos-kanban__column-loader" blur />}
            {renderStatuses({ isColumnOwner, isDraggingOver })}
            {records.map(renderCard)}
            {provided.placeholder}
            {isSwimlaneMode && isLoading && !isEmpty(records) && <Loader className="ecos-kanban__column-loader" blur />}
            {remaining > 0 && !isLoading && (
              <button className="ecos-kanban__cell-show-more" onClick={() => onLoadMore && onLoadMore(swimlaneId, statusId)}>
                {t('kanban.swimlane.show-more', { count: remaining })}
              </button>
            )}
          </div>
        );
      }}
    </Droppable>
  );
};

KanbanColumn.propTypes = {
  columnInfo: PropTypes.shape({ id: PropTypes.string, name: PropTypes.string }).isRequired,
  swimlaneId: PropTypes.string,
  statusId: PropTypes.string,
  records: PropTypes.array,
  totalCount: PropTypes.number,
  error: PropTypes.string,
  formProps: PropTypes.object,
  actions: PropTypes.object,
  boardConfig: PropTypes.object,
  swimlaneColor: PropTypes.string,
  readOnly: PropTypes.bool,
  isLoadingCol: PropTypes.bool,
  isLoading: PropTypes.bool,
  isFirstLoading: PropTypes.bool,
  isFiltered: PropTypes.bool,
  hasSum: PropTypes.bool,
  isDragging: PropTypes.bool,
  draggingSwimlaneId: PropTypes.string,
  isCollapsed: PropTypes.bool,
  onClickAction: PropTypes.func,
  onLoadMore: PropTypes.func
};

export default KanbanColumn;
