export const ServerStatusKeys = {
  NULL: null,
  NOT_FILLED: 'Not_Started',
  CORRECTION: 'Correction',
  MANAGER_APPROVAL: 'Manager_Approval',
  APPROVED_BY_MANAGER: 'Approved_By_Manager',
  APPROVED_BY_HR: 'Approved_By_HR',
  SENT_TO_ACCOUNTING_SYSTEM: 'Sent_To_Accounting_System'
};

export const ServerStatusOutcomeKeys = {
  TASK_DONE: 'Task_Done',
  SEND_BACK: 'Send_Back',
  APPROVE: 'Approve',
  HR_APPROVE: 'HR_Approve'
};

export const ServerEventTypes = {
  DAYTIME_WORK: 'daytime-work',
  BUSINESS_TRIP: 'business-trip',
  ABSENCE: 'absence',
  ANNUAL_BASIC_PAID_LEAVE: 'annual-basic-paid-leave',
  BASIC_UNPAID_LEAVE: 'basic-unpaid-leave',
  ONE_OF_FIVE: 'one-of-five',
  NORTH_PAID_LEAVE: 'north-paid-leave',
  IRREGULAR_PAID_LEAVE: 'irregular-paid-leave',
  COMPENSATORY_LEAVE: 'compensatory-leave',
  WEEKENDS_HOLIDAYS_WORK_HOLIDAY_AND_COMPENSATION: 'weekends-holidays-work-holiday-and-compensation',
  WEEKENDS_HOLIDAYS_WORK_DOUBLED_COMPENSATION: 'weekends-holidays-work-doubled-compensation',
  OVERTIME_WORK: 'overtime-work',
  NIGHT_WORK: 'night-work',
  HARMFUL_PAID_LEAVE: 'harmful-paid-leave'
};

export const ServerDateFormats = {
  DDMMYYYY: 'DD.MM.YYYY'
};

export const GroupedStatuses = {
  APPROVED: [ServerStatusKeys.APPROVED_BY_MANAGER, ServerStatusKeys.APPROVED_BY_HR]
};

export const StatusActionFilters = {
  FILL: 'fill',
  APPROVE: 'approve'
};

export const TimesheetTypes = {
  DELEGATED: 'delegated',
  MINE: 'mine',
  SUBORDINATES: 'subordinates',
  VERIFICATION: 'verification'
};

export const CommonLabels = {
  TIMESHEET_TITLE: 'timesheets.allForms.title',

  HEADLINE_DELEGATION: 'timesheets.allForms.delegation',

  NOTICE: 'Уведомление',

  MAIN_TAB_1: 'timesheets.tabs.myTimesheetTab',
  MAIN_TAB_2: 'timesheets.tabs.mySubordinatesTab',
  MAIN_TAB_3: 'timesheets.tabs.delegated',

  NO_DATA: 'Нет данных',

  MONTH: 'timesheets.allForms.month',
  YEAR: 'timesheets.allForms.year',
  SHORTENED_DAY: 'timesheets.allForms.shortenedDay',
  DAY_OFF: 'timesheets.allForms.dayOff',
  TODAY: 'timesheets.allForms.today',
  ADD_DAYS: 'timesheets.allForms.addDays',

  STATUS_LBL: 'timesheets.allForms.status',

  STATUS_VAL_NONE: 'Неизвестный',
  STATUS_VAL_NOT_FILLED: 'timesheets.allForms.status.notFilled',
  STATUS_VAL_WAITING_APPROVAL: 'timesheets.allForms.status.waitingForApproval',
  STATUS_VAL_NEED_IMPROVED: 'timesheets.allForms.status.sendBack',
  STATUS_VAL_APPROVED: 'Согласован',

  STATUS_BTN_SENT_IMPROVE: 'timesheets.allForms.buttons.sentBack',
  STATUS_BTN_APPROVE: 'timesheets.allForms.buttons.approve',
  STATUS_BTN_SENT_APPROVE: 'timesheets.allForms.buttons.sendToApproval',
  STATUS_BTN_OFF_DELEGATION: 'timesheets.allForms.buttons.declineDelegation',
  STATUS_BTN_SEND_MANAGER_APPROVE: 'timesheets.allForms.buttons.toApproval',

  STATUS_TIP_SENT_IMPROVE_1: 'timesheets.allForms.buttons.sentBack.tip',
  STATUS_TIP_APPROVE_1: 'timesheets.allForms.buttons.approve.tip',
  STATUS_TIP_APPROVE_2: 'timesheets.allForms.buttons.approve.withoutManager.tip',
  STATUS_TIP_SEND_MANAGER_APPROVE_1: 'timesheets.allForms.buttons.sendToApproval.tip',

  STATUSES_VAL_NOT_FILLED: 'timesheets.allForms.statuses.notFilled',
  STATUSES_VAL_UNDER_REVISION: 'timesheets.allForms.statuses.reworking',
  STATUSES_VAL_ON_AGREEMENT: 'timesheets.allForms.statuses.onApproval',
  STATUSES_VAL_WAITING_APPROVAL: 'timesheets.allForms.statuses.waitingForApproval',
  STATUSES_VAL_SENT_FOR_REVISION: 'timesheets.allForms.statuses.sentBack',
  STATUSES_VAL_AGREED: 'timesheets.allForms.statuses.approved',
  STATUSES_VAL_ON_AGREEMENT_BY_MANAGER: 'timesheets.allForms.statuses.onManagerApproval',
  STATUSES_VAL_AGREED_BY_MANAGER: 'timesheets.allForms.statuses.approvedByManager',

  STATUS_ACTION_FILL_IN: 'timesheets.allForms.status.action.fillIn',
  STATUS_ACTION_TO_APPROVE: 'timesheets.allForms.status.action.approve',

  EVENT_TYPE_DAYTIME_WORK: 'timesheets.allForms.eventType.dayTimeWork',
  EVENT_TYPE_BUSINESS_TRIP: 'timesheets.allForms.eventType.businessTrip',
  EVENT_TYPE_ABSENCE: 'timesheets.allForms.eventType.absence',
  EVENT_TYPE_ANNUAL_PAID_LEAVE: 'timesheets.allForms.eventType.annualPaidLeave',
  EVENT_TYPE_UNPAID_LEAVE: 'timesheets.allForms.eventType.unpaidLeave',
  EVENT_TYPE_LEAVE_1_OF_5: 'timesheets.allForms.eventType.oneOfFive',
  EVENT_TYPE_NORTH_PAID_LEAVE: 'timesheets.allForms.eventType.nortPaidLeave',
  EVENT_TYPE_HARMFUL_PAID_LEAVE: 'timesheets.allForms.eventType.harmfulPaidLeave',
  EVENT_TYPE_IRREGULAR_PAID_LEAVE: 'timesheets.allForms.eventType.irregularPaidLeave',
  EVENT_TYPE_COMPENSATORY_LEAVE: 'timesheets.allForms.eventType.compensatoryLeave',
  EVENT_TYPE_WORK_ON_DAY_OFF_1: 'timesheets.allForms.eventType.workOnDayOfLeavePlusPayment',
  EVENT_TYPE_WORK_ON_DAY_OFF_2: 'timesheets.allForms.eventType.workOnDayOfLeaveDoublePayment',
  EVENT_TYPE_OVERTIME_WORK: 'timesheets.allForms.eventType.overtimeWork',
  EVENT_TYPE_NIGHT_WORK: 'timesheets.allForms.eventType.nightWork',

  EVENT_HISTORY_BTN: 'timesheets.allForms.eventHistory.button',
  EVENT_HISTORY_TITLE: 'timesheets.allForms.eventHistory.title',

  MODAL_IN_PROGRESS: 'timesheets.allForms.modal.inProgress',

  SHOW_EVEN_HISTORY_TIP: 'timesheets.allForms.tips.showEventHistory',
  SHOW_COMMENT_TIP: 'timesheets.allForms.tips.showComment',
  TO_READ_COMMENT_BTN: 'Прочитать комментарий',

  FIND_EVENT_TIP: 'timesheets.allForms.tips.findEventType',
  FIND_EMPLOYEE_TIP: 'timesheets.allForms.tips.findEmployee',

  FILTER_BY_PEOPLE: 'timesheets.allForms.filter.people',
  FILTER_BY_EVENTS: 'timesheets.allForms.filter.events',
  FILTER_BY_COMPANIES: 'timesheets.allForms.filter.companies'
};

export const MyTimesheetLabels = {
  DELEGATION_DESCRIPTION_1: 'timesheets.myTimesheetForm.descriptions.delegationIsOff',
  DELEGATION_DESCRIPTION_2: 'timesheets.myTimesheetForm.descriptions.delegationIsOn',
  DELEGATION_DESCRIPTION_3: 'timesheets.myTimesheetForm.descriptions.delegationWasCanceled',

  LOCK_DESCRIPTION_1: 'timesheets.allForms.descriptions.lockedByStatus',
  LOCK_DESCRIPTION_2: 'timesheets.allForms.descriptions.lockedByDelegation',

  DELEGATION_LABEL_REJECT_OK: 'timesheets.allForms.descriptions.delegationRejectedButton'
};

export const SubTimesheetLabels = {
  DELEGATION_DESCRIPTION_1: 'timesheets.subordinatesForm.descriptions.delegationIsOff',

  LOCK_DESCRIPTION_1: 'timesheets.subordinatesForm.descriptions.delegationIsOn'
};

export const DelegateTimesheetLabels = {
  DELEGATION_DESCRIPTION_1: 'timesheets.delegatedForApprovalForm.descriptions.manageDeligatedTimesheets',

  DELEGATION_BTN_SET: 'timesheets.delegatedForApprovalForm.button.setUpTimsheetList'
};

export const VerifyTimesheetLabels = {
  TIMESHEET_TITLE: 'timesheets.allForms.timesheetsForVerification.title'
};

export const TimesheetMessages = {
  ERROR_SAVE_STATUS: 'Ошибка обновления статуса',
  ERROR_SAVE_EVENT_HOURS: 'Ошибка обновления часов'
};
