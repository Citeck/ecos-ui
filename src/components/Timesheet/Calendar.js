import React from 'react';
import classNames from 'classnames';

export const CalendarRow = ({ children = null, className, ...props }) => (
  <div className={classNames('ecos-timesheet__table-calendar-row', className)} {...props}>
    {children}
  </div>
);

export const CalendarCell = ({ children = null, className, ...props }) => (
  <div className={classNames('ecos-timesheet__table-calendar-cell', className)} {...props}>
    <div className="ecos-timesheet__table-calendar-cell-content">{children}</div>
  </div>
);

export const DayCell = ({ day, className, children = null, isBig, ...props }) => (
  <CalendarCell
    key={day.title}
    className={classNames(
      'ecos-timesheet__table-calendar-cell',
      {
        'ecos-timesheet__table-calendar-cell_big': isBig
      },
      className
    )}
    {...props}
  >
    {children}
  </CalendarCell>
);
