export const ActivityTypes = {
  CALL: 'call-activity',
  EMAIL: 'email-activity',
  MEETING: 'meeting-activity',
  COMMENT: 'comment-activity',
  ASSIGNMENT: 'assignment-activity'
};

export const PLANNED_ACTIVITY_TYPE = 'planned-activity';
export const IMMEDIATE_ACTIVITY_TYPE = 'immediate_activity'; // comment and assignment activities

export const optionsPrioritySelect = [
  {
    id: 1,
    label: 'activities-widget.priority.high'
  },
  {
    id: 2,
    label: 'activities-widget.priority.middle'
  },
  {
    id: 3,
    label: 'activities-widget.priority.low'
  }
];
