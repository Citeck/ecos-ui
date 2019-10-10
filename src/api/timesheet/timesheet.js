import { deepClone, t } from '../../helpers/util';
import { CommonLabels, StatusActionFilters } from '../../helpers/timesheet/constants';
import CommonTimesheetService from '../../services/timesheet/common';

export class TimesheetApi {
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
        action: StatusActionFilters.FILL
      },
      {
        name: t(CommonLabels.STATUS_ACTION_TO_APPROVE),
        isActive: false,
        isAvailable: true,
        badge: '9',
        action: StatusActionFilters.APPROVE
      }
    ];
  };
}
