export const Statuses = {
  NOT_FILLED: 'not-filled',
  WAITING_APPROVAL: 'waiting-approval',
  NEED_IMPROVED: 'need-improved'
};

export const StatusActions = {
  FILL: 'fill',
  APPROVE: 'approve',
  VERIFY: 'verify'
};

export const CommonLabels = {
  TIMESHEET_TITLE: 'Табели учёта времени',

  HEADLINE_DELEGATION: 'Делегирование',

  MAIN_TAB_1: 'Мой табель',
  MAIN_TAB_2: 'Табели подчиненных',
  MAIN_TAB_3: 'Делегированные',

  MONTH: 'Месяц',
  YEAR: 'Год',
  ADD_DAYS: 'Добавить дни',
  SHORTENED_DAY: 'Сокращённый день',
  DAY_OFF: 'Выходной день',
  TODAY: 'Сегодня',

  STATUS_LBL: 'Статус:',
  STATUS_VAL_NOT_FILLED: 'Не заполнен',
  STATUS_VAL_WAITING_APPROVAL: 'Ожидает согласования',
  STATUS_VAL_NEED_IMPROVED: 'Требует доработки',
  STATUS_SENT_APPROVAL: 'Отправить на согласование',
  STATUS_IMPROVE: 'Доработать',

  STATUS_BTN_SENT_IMPROVE: 'На доработку',
  STATUS_BTN_APPROVE: 'Согласовать',
  STATUS_BTN_SENT_APPROVE: 'Отправить на согласование',
  STATUS_BTN_OFF_DELEGATION: 'Откл. делегирование',
  STATUS_BTN_SEND_MANAGER_APPROVE: 'На согласование',

  STATUS_TIP_SEND_MANAGER_APPROVE: 'Отправить на согласование менеджеру',

  STATUSES_VAL_NOT_FILLED: 'Не заполнены',
  STATUSES_VAL_UNDER_REVISION: 'На доработке',
  STATUSES_VAL_ON_AGREEMENT: 'На согласовании',
  STATUSES_VAL_WAITING_APPROVAL: 'Ожидают согласования',
  STATUSES_VAL_SENT_FOR_REVISION: 'Отправлены в доработку',
  STATUSES_VAL_AGREED: 'Согласованные',
  STATUSES_VAL_ON_AGREEMENT_BY_MANAGER: 'На согласовании менеджера',
  STATUSES_VAL_AGREED_BY_MANAGER: 'Согласованы менеджером',

  STATUS_ACTION_FILL_IN: 'Заполнить',
  STATUS_ACTION_TO_APPROVE: 'Согласовать',

  EVENT_TYPE_DAYTIME_WORK: 'Работа в дневное время',
  EVENT_TYPE_BUSINESS_TRIP: 'Командировка',
  EVENT_TYPE_ABSENCE: 'Отсутствие (необходимы оригиналы документов)',
  EVENT_TYPE_ANNUAL_PAID_LEAVE: 'Ежегодный основной оплачиваемый отпуск',
  EVENT_TYPE_UNPAID_LEAVE: 'Отпуск без сохранения заработной платы',
  EVENT_TYPE_LEAVE_1_OF_5: 'Отпуск 1 из 5',
  EVENT_TYPE_NORTH_PAID_LEAVE: 'Отпуск за работу в условиях крайнего севера',
  EVENT_TYPE_HARMFUL_PAID_LEAVE: 'Дополнительный отпуск за работу во вредных условиях труда',
  EVENT_TYPE_IRREGULAR_PAID_LEAVE: 'Отпуск за ненормированный рабочий день',
  EVENT_TYPE_COMPENSATORY_LEAVE: 'Отгул',
  EVENT_TYPE_WORK_ON_DAY_OFF_1: 'Работа в выходные и праздничные дни (отгул + оплата)',
  EVENT_TYPE_WORK_ON_DAY_OFF_2: 'Работа в выходные и праздничные дни (двойная оплата)',
  EVENT_TYPE_OVERTIME_WORK: 'Сверхурочная работа',
  EVENT_TYPE_NIGHT_WORK: 'Работа в ночное время',

  EVENT_HISTORY_BTN: 'История событий',
  EVENT_HISTORY_TITLE: 'История событий',

  MODAL_IN_PROGRESS: 'Загружается',

  SHOW_EVEN_HISTORY_TIP: 'Показать историю событий',
  SHOW_COMMENT_TIP: 'Показать комментарий',

  FIND_EVENT_TIP: 'Найти событие',
  FIND_EMPLOYEE_TIP: 'Найти сотрудника'
};

export const MyTimesheetLabels = {
  DELEGATION_DESCRIPTION_1: 'Табель может быть заполнен другим сотрудником, если включить делегирование',
  DELEGATION_DESCRIPTION_2: 'Ваш табель заполнит другой сотрудник',
  DELEGATION_DESCRIPTION_3: 'Внимание! Делегирование было отключено другим сотрудником',

  LOCK_DESCRIPTION_1: 'Чтобы редактировать табель, нажмите на кнопку "Доработать"',
  LOCK_DESCRIPTION_2: 'Чтобы редактировать табель, отключите делегирование на другого сотрудника',

  DELEGATION_LABEL_REJECT_OK: 'OK'
};

export const SubTimesheetLabels = {
  DELEGATION_DESCRIPTION_1: 'Табели подчиненных может заполнить другой сотрудник, если включить делегирование',

  LOCK_DESCRIPTION_1: 'Чтобы редактировать табель, отключите делегирование на другого сотрудника'
};

export const DelegateTimesheetLabels = {
  DELEGATION_DESCRIPTION_1: 'Вы можете управлять списком сотрудников, которые делегировали вам табели',

  DELEGATION_BTN_SET: 'Настроить'
};

export const VerifyTimesheetLabels = {
  TIMESHEET_TITLE: 'Табели учёта времени для проверки'
};
