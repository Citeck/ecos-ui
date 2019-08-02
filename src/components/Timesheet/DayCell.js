import React from 'react';
import classNames from 'classnames';

const DayCell = props => {
  const { day, children = null } = props;

  return (
    <div
      key={day.title}
      className={classNames(
        'ecos-timesheet__table-calendar-cell',
        'ecos-timesheet__table-calendar-cell_hours',
        'ecos-timesheet__table-calendar-cell_big',
        {
          'ecos-timesheet__table-calendar-cell_weekend': !day.isBusinessDay
        }
      )}
    >
      <div className="ecos-timesheet__table-calendar-cell-content">{children}</div>
    </div>
  );
};

export default DayCell;
