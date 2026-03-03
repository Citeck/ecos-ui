import React from 'react';
import PropTypes from 'prop-types';

import SwimlaneHeader from './SwimlaneHeader';
import SwimlaneCell from './SwimlaneCell';

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
      {!swimlane.isCollapsed && (
        <div className="ecos-kanban__swimlane-body">
          {columns.map(col => {
            const colActions = (resolvedActions || []).find(a => a.status === col.id) || {};
            return (
              <SwimlaneCell
                key={`${swimlane.id}_${col.id}`}
                swimlaneId={swimlane.id}
                statusId={col.id}
                cell={swimlane.cells[col.id]}
                columnInfo={col}
                formProps={formProps}
                readOnly={readOnly}
                boardConfig={boardConfig}
                actions={colActions}
                isDragging={isDragging}
                draggingSwimlaneId={draggingSwimlaneId}
                onLoadMore={onLoadMore}
                onClickAction={onClickAction}
              />
            );
          })}
        </div>
      )}
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
