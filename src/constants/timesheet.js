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

export const MaxAttempts = {
  STATUS: 3
};

export const GroupedStatuses = {
  APPROVED: [ServerStatusKeys.APPROVED_BY_MANAGER, ServerStatusKeys.APPROVED_BY_HR]
};

export const StatusActionFilters = {
  FILL: 'filling',
  APPROVE: 'approval'
};

export const TimesheetTypes = {
  DELEGATED: 'delegated',
  MINE: 'mine',
  SUBORDINATES: 'subordinates',
  VERIFICATION: 'verification'
};
