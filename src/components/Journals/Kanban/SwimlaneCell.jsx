import classNames from 'classnames';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import React from 'react';
import PropTypes from 'prop-types';
import { Droppable } from 'react-beautiful-dnd';

import { Loader } from '../../common';
import { t } from '@/helpers/util';

import Card from './Card';
import { isDropDisabled } from './utils';

const SwimlaneCell = ({
  swimlaneId,
  statusId,
  cell,
  columnInfo,
  formProps,
  readOnly,
  boardConfig,
  actions,
  isDragging,
  draggingSwimlaneId,
  swimlaneColor,
  isCollapsed,
  onLoadMore,
  onClickAction
}) => {
  if (isCollapsed) {
    return <div className="ecos-kanban__swimlane-cell" />;
  }

  const { records = [], totalCount = 0, isLoading } = cell || {};
  const remaining = totalCount - records.length;
  const droppableId = `${swimlaneId}::${statusId}`;
  const dropDisabled = isDropDisabled({ readOnly, isLoadingCol: false, columnInfo }) ||
    (isDragging && draggingSwimlaneId && draggingSwimlaneId !== swimlaneId);

  const handleLoadMore = () => {
    if (onLoadMore) {
      onLoadMore(swimlaneId, statusId);
    }
  };

  return (
    <Droppable droppableId={droppableId} isDropDisabled={dropDisabled}>
      {(provided, { isDraggingOver }) => (
        <div
          className={classNames('ecos-kanban__swimlane-cell', {
            'ecos-kanban__swimlane-cell_dragging-over': isDraggingOver,
            'ecos-kanban__swimlane-cell_disabled': dropDisabled && isDragging
          })}
          {...provided.droppableProps}
          ref={provided.innerRef}
        >
          {isLoading && isEmpty(records) && <Loader className="ecos-kanban__swimlane-cell-loader" blur />}
          {records.map((record, index) => {
            if (!record) {
              return null;
            }
            return (
              <Card
                key={record.cardId || record.id}
                cardIndex={index}
                data={record}
                formProps={formProps}
                readOnly={readOnly}
                actions={actions ? actions[record.cardId] : undefined}
                boardConfig={boardConfig}
                swimlaneColor={record._colorAttrValue ? get(boardConfig, ['colorMap', record._colorAttrValue]) || null : swimlaneColor}
                onClickAction={onClickAction}
              />
            );
          })}
          {provided.placeholder}
          {isEmpty(records) && !isLoading && (
            <span className="ecos-kanban__swimlane-cell-empty-text">{t('kanban.swimlane.no-cards')}</span>
          )}
          {remaining > 0 && !isLoading && (
            <button className="ecos-kanban__cell-show-more" onClick={handleLoadMore}>
              {t('kanban.swimlane.show-more', { count: remaining })}
            </button>
          )}
          {isLoading && !isEmpty(records) && <Loader className="ecos-kanban__swimlane-cell-loader" blur />}
        </div>
      )}
    </Droppable>
  );
};

SwimlaneCell.propTypes = {
  swimlaneId: PropTypes.string.isRequired,
  statusId: PropTypes.string.isRequired,
  cell: PropTypes.object,
  columnInfo: PropTypes.object,
  formProps: PropTypes.object,
  readOnly: PropTypes.bool,
  boardConfig: PropTypes.object,
  actions: PropTypes.object,
  isDragging: PropTypes.bool,
  draggingSwimlaneId: PropTypes.string,
  swimlaneColor: PropTypes.string,
  isCollapsed: PropTypes.bool,
  onLoadMore: PropTypes.func,
  onClickAction: PropTypes.func
};

export default SwimlaneCell;
