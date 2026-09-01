import classNames from 'classnames';
import React, { useMemo } from 'react';
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
  sourceId,
  ecosType,
  sumTypeRef,
  journalPredicate,
  isDragging,
  draggingSwimlaneId,
  onToggleCollapse,
  onLoadMore,
  onClickAction
}) => {
  const swimlaneId = swimlane.id;
  const groupingAttribute = swimlaneGrouping ? swimlaneGrouping.attribute : null;

  // Same cell scope the sagas query cards with (buildSwimlaneCellQueryParams).
  //
  // Memoized on the two values it is derived from, and NOT on the lane object: the store replaces
  // that object on every board commit, while the identity of this predicate has to survive it. Each
  // cell hands it to its `ColumnSum`, which memoizes the whole query build (cloning every predicate
  // and serializing the result) on the props it reads — a fresh object per render would miss that
  // memo in every cell of every lane, on every frame of a drag.
  const groupPredicate = useMemo(
    () =>
      groupingAttribute
        ? swimlaneId === '__unassigned__'
          ? { t: 'empty', att: groupingAttribute }
          : { t: 'eq', att: groupingAttribute, val: swimlaneId }
        : null,
    [groupingAttribute, swimlaneId]
  );

  return (
    <div className="ecos-kanban__swimlane">
      <SwimlaneHeader
        swimlane={swimlane}
        columns={columns}
        isCollapsed={swimlane.isCollapsed}
        onToggleCollapse={() => onToggleCollapse(swimlane.id)}
      />
      <div
        className={classNames('ecos-kanban__swimlane-body', {
          'ecos-kanban__swimlane-body_collapsed': swimlane.isCollapsed
        })}
      >
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
                sourceId={sourceId}
                ecosType={ecosType}
                sumTypeRef={sumTypeRef}
                journalPredicate={journalPredicate}
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
  sourceId: PropTypes.string,
  ecosType: PropTypes.string,
  sumTypeRef: PropTypes.string,
  journalPredicate: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  isDragging: PropTypes.bool,
  draggingSwimlaneId: PropTypes.string,
  onToggleCollapse: PropTypes.func.isRequired,
  onLoadMore: PropTypes.func.isRequired,
  onClickAction: PropTypes.func
};

export default Swimlane;
