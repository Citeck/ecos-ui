import classNames from 'classnames';
import React from 'react';
import PropTypes from 'prop-types';

import { t } from '@/helpers/util';

const SwimlaneHeader = ({ swimlane, columns, isCollapsed, onToggleCollapse }) => {
  const totalCount = columns.reduce((sum, col) => {
    const cell = swimlane.cells[col.id];
    return sum + (cell ? cell.totalCount : 0);
  }, 0);

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
      <span className="ecos-kanban__swimlane-header-label">{label}</span>
      <span className="ecos-kanban__swimlane-header-count">({totalCount})</span>
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
