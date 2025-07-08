import {
  BOUNDARY_EVENT,
  END_EVENT,
  EVENT_SUB_PROCESS,
  EVENT_SUB_PROCESS_START_EVENT,
  GATEWAY,
  INTERMEDIATE_EVENT,
  PARTICIPANT,
  SEQUENCE_FLOW,
  SUBPROCESS_EXPANDED,
  START_EVENT,
  START_EVENT_SUB_PROCESS,
  TASK as BPMN_TASK,
  TRANSACTION
} from 'bpmn-js/lib/features/replace/ReplaceOptions';

import {
  ECOS_TASK_TYPE_SET_STATUS,
  REPLACE_TO_SET_STATUS,
  REPLACE_TO_AI_TASK, ECOS_TASK_TYPE_AI_TASK
} from "@/constants/bpmn";

const TASK = [
  ...BPMN_TASK,
  {
    label: 'Set Status Task',
    actionName: REPLACE_TO_SET_STATUS,
    className: 'bpmn-icon-set-status-task',
    target: {
      type: 'bpmn:Task',
      taskType: ECOS_TASK_TYPE_SET_STATUS
    }
  },
  {
    label: 'AI Task',
    actionName: REPLACE_TO_AI_TASK,
    className: 'bpmn-icon-ai-task',
    target: {
      type: 'bpmn:Task',
      taskType: ECOS_TASK_TYPE_AI_TASK
    }
  }
];

export {
  BOUNDARY_EVENT,
  END_EVENT,
  EVENT_SUB_PROCESS,
  EVENT_SUB_PROCESS_START_EVENT,
  GATEWAY,
  INTERMEDIATE_EVENT,
  PARTICIPANT,
  SEQUENCE_FLOW,
  START_EVENT,
  START_EVENT_SUB_PROCESS,
  SUBPROCESS_EXPANDED,
  TASK,
  TRANSACTION
};
