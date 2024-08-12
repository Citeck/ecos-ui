export const ActivityTypes = {
  CALL: 'call-activity',
  EMAIL: 'email-activity',
  MEETING: 'meeting-activity',
  COMMENT: 'comment-activity',
  ASSIGNMENT: 'assignment-activity'
};

export const PLANNED_ACTIVITY = [ActivityTypes.CALL, ActivityTypes.EMAIL, ActivityTypes.MEETING];
export const IMMEDIATE_ACTIVITY = [ActivityTypes.COMMENT, ActivityTypes.ASSIGNMENT];

export const optionsActivitySelect = [
  {
    id: ActivityTypes.CALL,
    displayName: 'activities-widget.type-call'
  },
  {
    id: ActivityTypes.EMAIL,
    displayName: 'activities-widget.type-email'
  },
  {
    id: ActivityTypes.MEETING,
    displayName: 'activities-widget.type-meeting'
  },
  {
    id: ActivityTypes.COMMENT,
    displayName: 'activities-widget.type-comment'
  },
  {
    id: ActivityTypes.ASSIGNMENT,
    displayName: 'activities-widget.type-assigment'
  }
];
