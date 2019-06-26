import PropTypes from 'prop-types';
import moment from 'moment';
import { t } from '../../helpers/util';
import { DataFormatTypes } from '../../constants';
import { AssignOptions } from '../../constants/tasks';

export const TasksPropTypes = {
  id: PropTypes.string,
  title: PropTypes.string,
  assignee: PropTypes.string,
  sender: PropTypes.string,
  lastcomment: PropTypes.string,
  started: PropTypes.any,
  deadline: PropTypes.any,
  stateAssign: PropTypes.number
};

export const DisplayedColumns = [
  {
    key: 'started',
    label: t('Запущено'),
    order: 0,
    format: DataFormatTypes.DATE
  },
  {
    key: 'deadline',
    label: t('Срок'),
    order: 1,
    format: DataFormatTypes.DATE
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

export function getOutputFormat(format, value) {
  switch (format) {
    case DataFormatTypes.DATE:
      return moment(value).format('DD.MM.YYYY');
    default:
      return value;
  }
}

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
