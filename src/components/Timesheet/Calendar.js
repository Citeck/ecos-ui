import React from 'react';
import classNames from 'classnames';
import MyCollapse from 'react-css-collapse';
import uuid from 'uuidv4';

import { t } from '../../helpers/util';
import { CommonLabels } from '../../helpers/timesheet/dictionary';
import Tooltip from './Tooltip';

export const CalendarRow = React.memo(({ children = null, className, ...props }) => (
  <div>
    <div className={classNames('ecos-timesheet__table-calendar-row', className)} {...props}>
      {children}
    </div>
  </div>
));

export const CalendarCell = React.memo(({ children = null, tooltipLabel, className, ...props }) => {
  const key = `tooltip-${uuid()}`;
  let tooltip = null;

  if (tooltipLabel) {
    tooltip = <Tooltip target={key} content={tooltipLabel} />;
  }

  return (
    <>
      <div id={key} className={classNames('ecos-timesheet__table-calendar-cell', className)} {...props}>
        <div className="ecos-timesheet__table-calendar-cell-content">{children}</div>
      </div>
      {tooltip}
    </>
  );
});

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

export const Header = React.memo(({ daysOfMonth, byGroup = false }) => (
  <CalendarRow>
    {daysOfMonth.map(day => (
      <CalendarCell
        key={`header-date-${day.title}`}
        className={classNames('ecos-timesheet__table-calendar-cell_day', 'ecos-timesheet__table-calendar-cell_big', {
          'ecos-timesheet__table-calendar-cell_weekend': !day.isBusinessDay,
          'ecos-timesheet__table-calendar-cell_current': day.isCurrentDay,
          'ecos-timesheet__table-calendar-cell_shortened': day.isShortenedDay,
          'ecos-timesheet__table-calendar-cell_by-group': byGroup
        })}
        tooltipLabel={dayTypeLabel(day)}
      >
        {day.title}
      </CalendarCell>
    ))}
  </CalendarRow>
));

export const dayTypeLabel = day => {
  let label = '';

  if (day.isShortenedDay) {
    label = t(CommonLabels.SHORTENED_DAY);
  }

  if (!day.isBusinessDay) {
    label = t(CommonLabels.DAY_OFF);
  }

  if (day.isCurrentDay) {
    label = t(CommonLabels.TODAY);
  }

  return label;
};
