import * as React from 'react';
import PropTypes from 'prop-types';

import { t } from '../../../helpers/util';
import { DataFormatTypes } from '../../../constants/index';

export const CurrentTaskPropTypes = {
  id: PropTypes.string,
  title: PropTypes.string,
  actors: PropTypes.string,
  usersGroup: PropTypes.array,
  deadline: PropTypes.any
};

export const DisplayedColumns = {
  title: {
    key: 'title',
    label: t('current-tasks-widget.column.title'),
    order: 0
  },
  actors: {
    key: 'actors',
    label: t('current-tasks-widget.column.actors'),
    order: 1
  },
  deadline: {
    key: 'deadline',
    label: t('current-tasks-widget.column.deadline'),
    order: 2,
    format: DataFormatTypes.DATE
  }
};

export const noData = <span className="ecos-current-task_no-data">{t('current-tasks-widget.no-data')}</span>;

export const cleanTaskId = taskId => taskId.replace(/[$@]/g, '');

export const settingsInfoExamples = [
  {
    input: 'YYYY',
    example: '2014',
    description: t(`4 or 2 digit year. Note: Only 4 digit can be parsed on strict mode`)
  },
  {
    input: 'YY',
    example: '14',
    description: t(`2 digit year`)
  },
  {
    input: 'M MM',
    example: '1..12',
    description: t(`Month number`)
  },
  {
    input: 'MMM MMMM',
    example: 'Jan..December',
    description: t(`Month name in locale set by moment.locale()`)
  },
  {
    input: 'D DD',
    example: '1..31',
    description: t(`Day of month`)
  },
  {
    input: 'H HH',
    example: '0..23',
    description: t(`Hours (24 hour time)`)
  },
  {
    input: 'h hh',
    example: '1..12',
    description: t(`Hours (12 hour time used with a A.)`)
  },
  {
    input: 'a A',
    example: 'am pm',
    description: t(`Post or ante meridiem (Note the one character a p are also considered valid)`)
  },
  {
    input: 'm mm',
    example: '0..59',
    description: t(`Minutes`)
  },
  {
    input: 's ss',
    example: '0..59',
    description: t(`Seconds`)
  }
];
