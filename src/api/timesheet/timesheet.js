import { URL } from '../../constants';
import { deepClone, t } from '../../helpers/util';
import { CommonLabels, StatusActions } from '../../helpers/timesheet/constants';
import CommonTimesheetService from '../../services/timesheet/common';

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

  getEvents = () => {
    return [
      {
        user: 'Пантелеева Мадина',
        organization: 'ООО ДжиИ Рус',
        eventTypes: deepClone(CommonTimesheetService.getEventTypes()),
        timesheetNumber: '1'
      },
      {
        user: 'Медведева Диана',
        organization: 'ООО ДжиИ Рус',
        eventTypes: deepClone(CommonTimesheetService.getEventTypes()),
        timesheetNumber: '2'
      },
      {
        user: 'Миронова Татьяна',
        organization: 'ООО ДжиИ Рус',
        eventTypes: deepClone(CommonTimesheetService.getEventTypes()),
        timesheetNumber: '3'
      },
      {
        user: 'Кулахметов Шамиль',
        organization: 'ООО ДжиИ Хэлскеа',
        eventTypes: deepClone(CommonTimesheetService.getEventTypes()),
        timesheetNumber: '4'
      },
      {
        user: 'Печкуров Григорий',
        organization: 'ООО АЛЬСТОМ',
        eventTypes: deepClone(CommonTimesheetService.getEventTypes()),
        timesheetNumber: '5'
      }
    ];
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
