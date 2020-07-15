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
