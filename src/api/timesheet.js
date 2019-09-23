import { URL } from '../constants';
import { deepClone } from '../helpers/util';

export class TimesheetApi {
  getSheetTabs = (isOnlyContent, location) => {
    return [
      {
        name: 'Мой табель',
        link: isOnlyContent ? URL.TIMESHEET_IFRAME : URL.TIMESHEET,
        isActive: [URL.TIMESHEET, URL.TIMESHEET_IFRAME].includes(location.pathname),
        isAvailable: true
      },
      {
        name: 'Табели подчиненных',
        link: isOnlyContent ? URL.TIMESHEET_IFRAME_SUBORDINATES : URL.TIMESHEET_SUBORDINATES,
        isActive: [URL.TIMESHEET_SUBORDINATES, URL.TIMESHEET_IFRAME_SUBORDINATES].includes(location.pathname),
        isAvailable: true
      },
      {
        name: 'Делегированные',
        link: URL.TIMESHEET_IFRAME,
        isActive: false,
        isAvailable: true,
        badge: '99'
      }
    ];
  };

  getEventTypes = () => {
    return [
      {
        title: 'Работа в дневное время',
        name: 'daytime-work',
        color: '#00C308',
        canEdit: true
      },
      {
        title: 'Командировка',
        name: 'business-trip',
        color: '#ff3ecb',
        canEdit: true
      },
      {
        title: 'Отсутствие (необходимы оригиналы документов)',
        name: 'absence',
        color: '#af9fff',
        canEdit: true
      },
      {
        title: 'Ежегодный основной оплачиваемый отпуск',
        name: 'annual-basic-paid-leave',
        color: '#DF3386',
        canEdit: false
      },
      {
        title: 'Отпуск без сохранения заработной платы',
        name: 'basic-unpaid-leave',
        color: '#ff41e3',
        canEdit: false
      },
      {
        title: 'Отпуск 1 из 5',
        name: 'one-of-five',
        color: '#d51842',
        canEdit: false
      },
      {
        title: 'Отпуск за работу в условиях крайнего севера',
        name: 'north-paid-leave',
        color: '#e89972',
        canEdit: false
      },
      {
        title: 'Дополнительный отпуск за работу во вредных условиях труда',
        name: 'harmful-paid-leave',
        color: '#c0ac70',
        canEdit: false
      },
      {
        title: 'Отпуск за ненормированный рабочий день',
        name: 'irregular-paid-leave',
        color: '#ff9953',
        canEdit: false
      },
      {
        title: 'Отгул',
        name: 'compensatory-leave',
        color: '#29bd8d',
        canEdit: true
      },
      {
        title: 'Работа в выходные и праздничные дни (отгул + оплата)',
        name: 'weekends-holidays-work-holiday-and-compensation',
        color: '#33DFD5',
        canEdit: true
      },
      {
        title: 'Работа в выходные и праздничные дни (двойная оплата)',
        name: 'weekends-holidays-work-doubled-compensation',
        color: '#3382df',
        canEdit: true
      },
      {
        title: 'Сверхурочная работа',
        name: 'overtime-work',
        color: '#DF8633',
        canEdit: true
      },
      {
        title: 'Работа в ночное время',
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
}
