import PropTypes from 'prop-types';
import { t } from '../../helpers/util';

export const TasksPropTypes = {
  id: PropTypes.string,
  formId: PropTypes.string,
  title: PropTypes.string,
  assignee: PropTypes.string,
  sender: PropTypes.string,
  lastcomment: PropTypes.string,
  started: PropTypes.any
};

export const displayedColumns = () => [
  {
    key: 'started',
    label: t('Запущено'),
    order: 0,
    format: 'date'
  },
  {
    key: 'deadline',
    label: t('Срок'),
    order: 1
  },
  {
    key: 'sender',
    label: t('Отправитель'),
    order: 2
  },
  {
    key: 'assignee',
    label: t('Исполнитель'),
    order: 3
  },
  {
    key: 'lastcomment',
    label: t('Комментарий'),
    order: 4
  }
];

export const stateAssignBtn = () => [
  {
    id: 0,
    label: t('Я выполняю это')
  },
  {
    id: 1,
    label: t('Переназначить')
  }
];
