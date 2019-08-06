import React from 'react';
import classNames from 'classnames';
import MyCollapse from 'react-css-collapse';

export const CalendarRow = React.memo(({ children = null, className, ...props }) => (
  <div className={classNames('ecos-timesheet__table-calendar-row', className)} {...props}>
    {children}
  </div>
));

export const CalendarCell = React.memo(({ children = null, className, ...props }) => (
  <div className={classNames('ecos-timesheet__table-calendar-cell', className)} {...props}>
    <div className="ecos-timesheet__table-calendar-cell-content">{children}</div>
  </div>
));

export const DayCell = React.memo(({ day, className, children = null, isBig, ...props }) => (
  <CalendarCell
    key={day.title}
    className={classNames(
      'ecos-timesheet__table-calendar-cell',
      {
        'ecos-timesheet__table-calendar-cell_big': isBig,
        'ecos-timesheet__table-calendar-cell_weekend': !day.isBusinessDay,
        'ecos-timesheet__table-calendar-cell_current': day.isCurrentDay
      },
      className
    )}
    {...props}
  >
    {children}
  </CalendarCell>
));

export const Collapse = React.memo(({ children = null, ...props }) => <MyCollapse {...props}>{children}</MyCollapse>);

export const Header = React.memo(({ daysOfMonth }) => (
  <CalendarRow>
    {daysOfMonth.map(day => (
      <CalendarCell
        key={`header-date-${day.title}`}
        className={classNames(
          'ecos-timesheet__table-calendar-cell_day',
          'ecos-timesheet__table-calendar-cell_big',
          'ecos-timesheet__table-calendar-cell_by-group',
          {
            'ecos-timesheet__table-calendar-cell_weekend': !day.isBusinessDay,
            'ecos-timesheet__table-calendar-cell_current': day.isCurrentDay
          }
        )}
      >
        {day.title}
      </CalendarCell>
    ))}
  </CalendarRow>
));
