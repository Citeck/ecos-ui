import isString from 'lodash/isString';
import { URL } from '../constants';
import { deepClone, t } from '../helpers/util';
import { CommonLabels, StatusActions } from '../helpers/timesheet/constants';

export class TimesheetApi {
  getSheetTabs = (isOnlyContent, location) => {
    return [
      {
        name: t(CommonLabels.MAIN_TAB_1),
        link: isOnlyContent ? URL.TIMESHEET_IFRAME : URL.TIMESHEET,
        isActive: [URL.TIMESHEET, URL.TIMESHEET_IFRAME].includes(location.pathname),
        isAvailable: true
      },
      {
        name: t(CommonLabels.MAIN_TAB_2),
        link: isOnlyContent ? URL.TIMESHEET_IFRAME_SUBORDINATES : URL.TIMESHEET_SUBORDINATES,
        isActive: [URL.TIMESHEET_SUBORDINATES, URL.TIMESHEET_IFRAME_SUBORDINATES].includes(location.pathname),
        isAvailable: true
      },
      {
        name: t(CommonLabels.MAIN_TAB_3),
        link: isOnlyContent ? URL.TIMESHEET_IFRAME_DELEGATED : URL.TIMESHEET_DELEGATED,
        isActive: [URL.TIMESHEET_IFRAME_DELEGATED, URL.TIMESHEET_DELEGATED].includes(location.pathname),
        isAvailable: true,
        badge: '99'
      }
    ];
  };

  getEventTypes = () => {
    return [
      {
        title: t(CommonLabels.EVENT_TYPE_DAYTIME_WORK),
        name: 'daytime-work',
        color: '#00C308',
        canEdit: true
      },
      {
        title: t(CommonLabels.EVENT_TYPE_BUSINESS_TRIP),
        name: 'business-trip',
        color: '#ff3ecb',
        canEdit: true
      },
      {
        title: t(CommonLabels.EVENT_TYPE_ABSENCE),
        name: 'absence',
        color: '#af9fff',
        canEdit: true
      },
      {
        title: t(CommonLabels.EVENT_TYPE_ANNUAL_PAID_LEAVE),
        name: 'annual-basic-paid-leave',
        color: '#DF3386',
        canEdit: false
      },
      {
        title: t(CommonLabels.EVENT_TYPE_UNPAID_LEAVE),
        name: 'basic-unpaid-leave',
        color: '#ff41e3',
        canEdit: false
      },
      {
        title: t(CommonLabels.EVENT_TYPE_LEAVE_1_OF_5),
        name: 'one-of-five',
        color: '#d51842',
        canEdit: false
      },
      {
        title: t(CommonLabels.EVENT_TYPE_NORTH_PAID_LEAVE),
        name: 'north-paid-leave',
        color: '#e89972',
        canEdit: false
      },
      {
        title: t(CommonLabels.EVENT_TYPE_HARMFUL_PAID_LEAVE),
        name: 'harmful-paid-leave',
        color: '#c0ac70',
        canEdit: false
      },
      {
        title: t(CommonLabels.EVENT_TYPE_IRREGULAR_PAID_LEAVE),
        name: 'irregular-paid-leave',
        color: '#ff9953',
        canEdit: false
      },
      {
        title: t(CommonLabels.EVENT_TYPE_COMPENSATORY_LEAVE),
        name: 'compensatory-leave',
        color: '#29bd8d',
        canEdit: true
      },
      {
        title: t(CommonLabels.EVENT_TYPE_WORK_ON_DAY_OFF_1),
        name: 'weekends-holidays-work-holiday-and-compensation',
        color: '#33DFD5',
        canEdit: true
      },
      {
        title: t(CommonLabels.EVENT_TYPE_WORK_ON_DAY_OFF_2),
        name: 'weekends-holidays-work-doubled-compensation',
        color: '#3382df',
        canEdit: true
      },
      {
        title: t(CommonLabels.EVENT_TYPE_OVERTIME_WORK),
        name: 'overtime-work',
        color: '#DF8633',
        canEdit: true
      },
      {
        title: t(CommonLabels.EVENT_TYPE_NIGHT_WORK),
        name: 'night-work',
        color: '#4133DF',
        canEdit: true
      }
    ];
  };

  getSubordinatesEvents = () => {
    return [
      {
        user: 'Пантелеева Мадина',
        organization: 'ООО ДжиИ Рус',
        eventTypes: deepClone(this.getEventTypes()),
        timesheetNumber: '212392064'
      },
      {
        user: 'Медведева Диана',
        organization: 'ООО ДжиИ Рус',
        eventTypes: deepClone(this.getEventTypes()),
        timesheetNumber: '212572436'
      },
      {
        user: 'Миронова Татьяна',
        organization: 'ООО ДжиИ Рус',
        eventTypes: deepClone(this.getEventTypes()),
        timesheetNumber: '212604506'
      },
      {
        user: 'Кулахметов Шамиль',
        organization: 'ООО ДжиИ Хэлскеа',
        eventTypes: deepClone(this.getEventTypes()),
        timesheetNumber: '212594037'
      },
      {
        user: 'Печкуров Григорий',
        organization: 'ООО АЛЬСТОМ',
        eventTypes: deepClone(this.getEventTypes()),
        timesheetNumber: '212555619'
      }
    ];
  };

  getStatuses = actions => {
    const all = [
      {
        name: t(CommonLabels.STATUSES_VAL_NOT_FILLED),
        key: 'not-filled',
        isActive: true,
        isAvailable: true,
        actions: [StatusActions.FILL, StatusActions.VERIFY]
      },
      {
        name: t(CommonLabels.STATUSES_VAL_UNDER_REVISION),
        key: 'under-revision',
        isActive: false,
        isAvailable: true,
        actions: [StatusActions.FILL]
      },
      {
        name: t(CommonLabels.STATUSES_VAL_ON_AGREEMENT),
        key: 'on-agreement',
        isActive: false,
        isAvailable: true,
        actions: [StatusActions.FILL]
      },
      {
        name: t(CommonLabels.STATUSES_VAL_WAITING_APPROVAL),
        key: 'waiting-approval',
        isActive: true,
        isAvailable: true,
        actions: [StatusActions.APPROVE]
      },
      {
        name: t(CommonLabels.STATUSES_VAL_SENT_FOR_REVISION),
        key: 'sent-for-revision',
        isActive: false,
        isAvailable: true,
        actions: [StatusActions.APPROVE, StatusActions.VERIFY]
      },
      {
        name: t(CommonLabels.STATUSES_VAL_AGREED),
        key: 'agreed',
        isActive: false,
        isAvailable: true,
        actions: [StatusActions.APPROVE, StatusActions.VERIFY]
      },
      {
        name: t(CommonLabels.STATUSES_VAL_ON_AGREEMENT_BY_MANAGER),
        key: 'on-agreement-by-manager',
        isActive: false,
        isAvailable: true,
        actions: [StatusActions.VERIFY]
      },
      {
        name: t(CommonLabels.STATUSES_VAL_AGREED_BY_MANAGER),
        key: 'agreed-by-manager',
        isActive: false,
        isAvailable: true,
        actions: [StatusActions.VERIFY]
      }
    ];

    actions = Array.isArray(actions) ? actions : isString(actions) ? [actions] : [];

    if (actions.length) {
      return all.filter(item => actions.some(act => item.actions.includes(act)));
    }

    return all;
  };

  getDelegatedActions = () => {
    return [
      {
        name: t(CommonLabels.STATUS_ACTION_FILL_IN),
        isActive: true,
        isAvailable: true,
        badge: '90',
        action: StatusActions.FILL
      },
      {
        name: t(CommonLabels.STATUS_ACTION_TO_APPROVE),
        isActive: false,
        isAvailable: true,
        badge: '9',
        action: StatusActions.APPROVE
      }
    ];
  };
}
