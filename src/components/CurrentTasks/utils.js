import PropTypes from 'prop-types';
import { t } from '../../helpers/util';
import { DataFormatTypes } from '../../constants';
import * as React from 'react';

export const CurrentTaskPropTypes = {
  id: PropTypes.string,
  title: PropTypes.string,
  actors: PropTypes.string,
  deadline: PropTypes.any
};

export const DisplayedColumns = {
  title: {
    key: 'title',
    label: t('Задача'),
    order: 0
  },
  actors: {
    key: 'actors',
    label: t('Исполнитель'),
    order: 1
  },
  deadline: {
    key: 'deadline',
    label: t('Срок до'),
    order: 2,
    format: DataFormatTypes.DATE
  }
};

export const noData = <span className={'ecos-current-task_no-data'}>{t('Нет данных')}</span>;

export const cleanTaskId = taskId => taskId.replace(/[$@]/g, '');
