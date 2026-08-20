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
  swimlaneGrouping,
  predicate,
  searchPredicate,
  relatedFilter,
  isDragging,
  draggingSwimlaneId,
  onToggleCollapse,
  onLoadMore,
  onClickAction
}) => {
  // Same cell scope the sagas query cards with (buildSwimlaneCellQueryParams).
  const groupPredicate = swimlaneGrouping
    ? swimlane.id === '__unassigned__'
      ? { t: 'empty', att: swimlaneGrouping.attribute }
      : { t: 'eq', att: swimlaneGrouping.attribute, val: swimlane.id }
    : null;

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
                predicate={predicate}
                searchPredicate={searchPredicate}
                groupPredicate={groupPredicate}
                relatedFilter={relatedFilter}
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
  swimlaneGrouping: PropTypes.object,
  predicate: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  searchPredicate: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  relatedFilter: PropTypes.object,
  isDragging: PropTypes.bool,
  draggingSwimlaneId: PropTypes.string,
  onToggleCollapse: PropTypes.func.isRequired,
  onLoadMore: PropTypes.func.isRequired,
  onClickAction: PropTypes.func
};

export default Swimlane;
