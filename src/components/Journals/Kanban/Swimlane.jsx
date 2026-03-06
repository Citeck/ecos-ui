import classNames from 'classnames';
import React from 'react';
import PropTypes from 'prop-types';

import SwimlaneHeader from './SwimlaneHeader';
import KanbanColumn from './KanbanColumn';

const Swimlane = ({
  swimlane,
  columns,
  formProps,
  readOnly,
  boardConfig,
  resolvedActions,
  isDragging,
  draggingSwimlaneId,
  onToggleCollapse,
  onLoadMore,
  onClickAction
}) => {
  return (
    <div className="ecos-kanban__swimlane">
      <SwimlaneHeader
        swimlane={swimlane}
        columns={columns}
        isCollapsed={swimlane.isCollapsed}
        onToggleCollapse={() => onToggleCollapse(swimlane.id)}
      />
      <div className={classNames('ecos-kanban__swimlane-body', {
        'ecos-kanban__swimlane-body_collapsed': swimlane.isCollapsed
      })}>
        <div className="ecos-kanban__swimlane-body-inner">
          {columns.map(col => {
            const cell = swimlane.cells[col.id] || {};
            const colActions = (resolvedActions || []).find(a => a.status === col.id) || {};
            return (
              <KanbanColumn
                key={`${swimlane.id}_${col.id}`}
                columnInfo={col}
                swimlaneId={swimlane.id}
                statusId={col.id}
                records={cell.records}
                totalCount={cell.totalCount}
                isLoading={cell.isLoading}
                swimlaneColor={swimlane.color}
                formProps={formProps}
                readOnly={readOnly}
                boardConfig={boardConfig}
                actions={colActions}
                isDragging={isDragging}
                draggingSwimlaneId={draggingSwimlaneId}
                isCollapsed={swimlane.isCollapsed}
                onLoadMore={onLoadMore}
                onClickAction={onClickAction}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

Swimlane.propTypes = {
  swimlane: PropTypes.object.isRequired,
  columns: PropTypes.array.isRequired,
  formProps: PropTypes.object,
  readOnly: PropTypes.bool,
  boardConfig: PropTypes.object,
  resolvedActions: PropTypes.array,
  isDragging: PropTypes.bool,
  draggingSwimlaneId: PropTypes.string,
  onToggleCollapse: PropTypes.func.isRequired,
  onLoadMore: PropTypes.func.isRequired,
  onClickAction: PropTypes.func
};

export default Swimlane;
