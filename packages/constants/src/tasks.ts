export const AssignActions = {
  RELEASE: 'release',
  CLAIM: 'claim'
};

export const AssignTo = {
  ASSIGN_ME: 'me',
  ASSIGN_GROUP: 'group',
  ASSIGN_SMB: 'someone',
  UNASSIGNED: 'none'
};

export const ReassignTaskAction = 'uiserv/action@edit-task-assignee';
export const ViewBusinessProcessTaskAction = 'uiserv/action@view-business-process';
export const TaskActions = [ReassignTaskAction, ViewBusinessProcessTaskAction];
