import classNames from 'classnames';
import React from 'react';
import PropTypes from 'prop-types';

import { t } from '@/helpers/util';
import ColoredFormatter from '@/components/Journals/service/formatters/registry/ColoredFormatter/ColoredFormatter';

const SwimlaneHeader = ({ swimlane, columns, isCollapsed, onToggleCollapse }) => {
  const columnCounts = columns.map(col => {
    const cell = swimlane.cells[col.id];
    return { col, count: cell ? cell.totalCount : 0 };
  });
  const totalCount = columnCounts.reduce((sum, { count }) => sum + count, 0);

  const label = swimlane.id === '__unassigned__' ? t('kanban.swimlane.unassigned') : swimlane.label;

  return (
    <div
      className={classNames('ecos-kanban__swimlane-header', {
        'ecos-kanban__swimlane-header_collapsed': isCollapsed
      })}
      onClick={onToggleCollapse}
    >
      <span className={classNames('ecos-kanban__swimlane-header-icon', { 'ecos-kanban__swimlane-header-icon_collapsed': isCollapsed })}>
        <i className={`icon-small-${isCollapsed ? 'right' : 'down'}`} />
      </span>
      {swimlane.color && (
        <span className="ecos-kanban__swimlane-header-dot" style={{ backgroundColor: ColoredFormatter.resolveColor(swimlane.color) }} />
      )}
      <span className="ecos-kanban__swimlane-header-label">{label}</span>
      <span className="ecos-kanban__swimlane-header-count">({totalCount})</span>
      {isCollapsed && (
        <span className="ecos-kanban__swimlane-header-breakdown">
          {columnCounts.map(({ col, count }) => {
            if (count === 0) return null;
            return (
              <span key={col.id} className="ecos-kanban__swimlane-header-col-count" title={col.name}>
                {count}
              </span>
            );
          })}
        </span>
      )}
    </div>
  );
};

SwimlaneHeader.propTypes = {
  swimlane: PropTypes.object.isRequired,
  columns: PropTypes.array.isRequired,
  isCollapsed: PropTypes.bool,
  onToggleCollapse: PropTypes.func.isRequired
};

export default SwimlaneHeader;
