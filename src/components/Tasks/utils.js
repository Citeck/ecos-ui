import PropTypes from 'prop-types';
import moment from 'moment';
import { t } from '../../helpers/util';
import { DataFormatTypes } from '../../constants';

export const StateAssignPropTypes = {
  claimable: PropTypes.bool,
  releasable: PropTypes.bool,
  reassignable: PropTypes.bool,
  assignable: PropTypes.bool
};

export const TasksPropTypes = {
  id: PropTypes.string,
  formKey: PropTypes.string,
  title: PropTypes.string,
  actors: PropTypes.string,
  sender: PropTypes.string,
  lastcomment: PropTypes.string,
  started: PropTypes.any,
  deadline: PropTypes.any,
  stateAssign: PropTypes.shape(StateAssignPropTypes)
};

export const getDisplayedColumns = () => {
  return [
    {
      key: 'started',
      label: t('tasks-widget.column.started'),
      order: 0,
      format: DataFormatTypes.DATE
    },
    {
      key: 'deadline',
      label: t('tasks-widget.column.deadline'),
      order: 1,
      format: DataFormatTypes.DATE
    },
    {
      key: 'sender',
      label: t('tasks-widget.column.sender'),
      order: 2
    },
    {
      key: 'actors',
      label: t('tasks-widget.column.actors'),
      order: 3
    },
    {
      key: 'lastcomment',
      label: t('tasks-widget.column.lastcomment'),
      order: 4
    }
  ];
};

export function getOutputFormat(format, value) {
  if (!format || !value) {
    return value || '';
  }

  switch (format) {
    case DataFormatTypes.DATE:
      return moment(value).format('DD.MM.YYYY');
    default:
      return value;
  }
}
