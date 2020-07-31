import moment from 'moment';
import 'moment-business-days';
import get from 'lodash/get';
import { pagesWithOnlyContent } from '../../constants';
import { ServerDateFormats } from '../../constants/timesheet';
import { t } from '../util';
import { CommonLabels } from './dictionary';

export function getDaysOfMonth(currentDate) {
  const arr = Array.from({ length: moment(currentDate).daysInMonth() }, (x, i) => {
    return moment(currentDate)
      .startOf('month')
      .add(i, 'days');
  });

  return arr.map(day => ({
    number: day.format('D'),
    title: day.format('dd, D'),
    // рабочий день
    isBusinessDay: moment(day).isBusinessDay(),
    // короткий день
    // isShortenedDay: true,
    // текущий день
    isCurrentDay: moment().isSame(moment(day), 'd')
  }));
}

export function isOnlyContent() {
  const url = get(window, ['location', 'pathname'], '/');

  return pagesWithOnlyContent.includes(url);
}

export function getNewDateByDayNumber(currentDate, number) {
  return moment(currentDate)
    .date(number)
    .format(ServerDateFormats.DDMMYYYY);
}

export const BaseConfigGroupButtons = {
  SEND_MANAGER_APPROVE: {
    id: 'ecos-timesheet__table-group-btn_sent-manager-approve_id',
    className: 'ecos-timesheet__table-group-btn_sent-manager-approve',
    icon: 'icon-small-arrow-right',
    get title() {
      return t(CommonLabels.STATUS_BTN_SEND_MANAGER_APPROVE);
    },
    get tooltip() {
      return t(CommonLabels.STATUS_TIP_SEND_MANAGER_APPROVE_1);
    }
  },
  APPROVE: {
    id: 'ecos-timesheet__table-group-btn_approve_id',
    className: 'ecos-timesheet__table-group-btn_approve',
    icon: 'icon-small-check',
    get title() {
      return t(CommonLabels.STATUS_BTN_APPROVE);
    },
    get tooltip() {
      return t(CommonLabels.STATUS_TIP_APPROVE_1);
    }
  },
  SENT_IMPROVE: {
    id: 'ecos-timesheet__table-group-btn_revision_id',
    className: 'ecos-timesheet__table-group-btn_revision',
    icon: 'icon-small-arrow-left',
    get title() {
      return t(CommonLabels.STATUS_BTN_SENT_IMPROVE);
    },
    get tooltip() {
      return t(CommonLabels.STATUS_TIP_SENT_IMPROVE_1);
    }
  },
  SENT_APPROVE: {
    id: 'ecos-timesheet__table-group-btn_sent-approve_id',
    className: 'ecos-timesheet__table-group-btn_sent-approve',
    get title() {
      return t(CommonLabels.STATUS_BTN_SENT_APPROVE);
    }
  }
};
