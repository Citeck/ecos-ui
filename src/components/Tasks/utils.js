import PropTypes from 'prop-types';
import { t } from '../../helpers/util';
import { AssignOptions } from '../../constants/tasks';

export const TasksPropTypes = {
  id: PropTypes.string,
  formId: PropTypes.string,
  title: PropTypes.string,
  assignee: PropTypes.string,
  sender: PropTypes.string,
  lastcomment: PropTypes.string,
  started: PropTypes.any
};

export const DisplayedColumns = [
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

export const InfoAssignButtons = [
  {
    id: AssignOptions.ASSIGN_ME,
    label: t('Я выполняю это')
  },
  {
    id: AssignOptions.ASSIGN_SMB,
    label: t('Назначить')
  },
  {
    id: AssignOptions.REASSIGN_SMB,
    label: t('Переназначить')
  },
  {
    id: AssignOptions.UNASSIGN,
    label: t('Вернуть на группу')
  }
];
