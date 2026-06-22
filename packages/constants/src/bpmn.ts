export const Labels = {
  ADD_CATEGORY: 'bpmn-designer.add-category',
  TOTAL: 'bpmn-designer.total',
  Views: {
    CARDS: 'bpmn-designer.view-mode.cards',
    LIST: 'bpmn-designer.view-mode.list'
  }
};

export const ViewTypes = {
  CARDS: 'cards',
  LIST: 'list',
  TABLE: 'table'
};

export const ECOS_TASK_TYPE_SET_STATUS = 'setStatus';
export const ECOS_TASK_TYPE_AI_TASK = 'aiTask';
export const REPLACE_TO_SET_STATUS = 'replace-with-set-status-task';
export const REPLACE_TO_AI_TASK = 'replace-with-ai-task';

export const EVENT_BASED_GATEWAY = 'bpmn:EventBasedGateway';

export const ELEMENT_TYPES_WITH_CUSTOM_FORM_DETERMINER = [
  'bpmn:IntermediateCatchEvent',
  'bpmn:IntermediateThrowEvent',
  'bpmn:StartEvent',
  'bpmn:EndEvent',
  'bpmn:BoundaryEvent',
  'bpmn:Task'
];
export const ELEMENT_TYPES_FORM_DETERMINER_BY_DEF_TYPE_MAP = new Map([
  ['bpmn:TimerEventDefinition', 'bpmn:TimerEvent'],
  ['bpmn:MessageEventDefinition', 'bpmn:MessageEvent'],
  ['bpmn:SignalEventDefinition', 'bpmn:SignalEvent'],
  ['bpmn:ConditionalEventDefinition', 'bpmn:ConditionalEvent'],
  ['bpmn:LinkEventDefinition', 'bpmn:LinkEvent'],
  ['bpmn:CompensateEventDefinition', 'bpmn:CompensateEvent'],
  ['bpmn:EscalationEventDefinition', 'bpmn:EscalationEvent'],
  ['bpmn:TerminateEventDefinition', 'bpmn:TerminateEvent'],
  ['bpmn:ErrorEventDefinition', 'bpmn:ErrorEvent']
]);
export const ECOS_TASK_TYPES = [ECOS_TASK_TYPE_SET_STATUS, ECOS_TASK_TYPE_AI_TASK];
export const ELEMENT_TYPES_FORM_DETERMINER_BY_ECOS_TASK_TYPE_MAP = new Map([
  [ECOS_TASK_TYPE_SET_STATUS, 'bpmn:EcosTaskSetStatus'],
  [ECOS_TASK_TYPE_AI_TASK, 'bpmn:EcosTaskAiTask']
]);

export const LOOP_CHARACTERISTICS = {
  LOOP: 'loop',
  SEQUENCE: 'sequence',
  PARALLEL: 'parallel'
};

export const GATEWAY_TYPES = [
  'bpmn:ExclusiveGateway',
  'bpmn:ParallelGateway',
  'bpmn:InclusiveGateway',
  'bpmn:ComplexGateway',
  EVENT_BASED_GATEWAY
];

export const BPMN_TASK_TYPES = [
  'bpmn:SendTask',
  'bpmn:ReceiveTask',
  'bpmn:UserTask',
  'bpmn:ManualTask',
  'bpmn:BusinessRuleTask',
  'bpmn:ServiceTask',
  'bpmn:ScriptTask',
  'bpmn:CallActivity',
  'bpmn:SubProcess'
];

export const TASK_TYPES = ['bpmn:Task', ...BPMN_TASK_TYPES];

export const DEFINITON_TYPE = 'bpmn:Definitions';
export const SUBPROCESS_TYPE = 'bpmn:SubProcess';
export const SEQUENCE_TYPE = 'bpmn:SequenceFlow';
export const COLLABORATION_TYPE = 'bpmn:Collaboration';
export const PARTICIPANT_TYPE = 'bpmn:Participant';

export const EDITOR_PAGE_CONTEXT = '/share/page/bpmn-editor/';

export const LOCAL_STORAGE_KEY_PAGE_POSITION = 'BpmnPagePosition';
export const LOCAL_STORAGE_KEY_REFERER_PAGE_PATHNAME = 'BpmnRefererPagePathName';

export const BPMN_MODELS_PAGE_MAX_ITEMS = 8;

export const SEARCH_MIN_LENGTH = 2;

export const BPMN_DELIMITER = ':';
export const BPMN_PREFIX_UNDERLINE = 'bpmn_';
export const PREFIX_FORM_ELM = '@bpmn-type-';
export const TYPE_BPMN_PROCESS = 'bpmn:Process';
export const TYPE_BPMN_TASK = 'bpmn:Task';
export const TYPE_BPMN_EVENT = 'bpmn:Event';
export const TYPE_BPMN_SEQUENCE_FLOW = 'bpmn:SequenceFlow';
export const TYPE_BPMN_ANNOTATION = 'bpmn:TextAnnotation';
export const TYPE_BPMN_END_EVENT = 'bpmn:EndEvent';
export const TYPE_BPMN_LABEL = 'label';
export const ECOS_TASK_BASE_ELEMENT = TYPE_BPMN_TASK;

export const DISABLE_SET_STATUS_ACTION_FOR_ELEMENTS = [TYPE_BPMN_END_EVENT, TYPE_BPMN_SEQUENCE_FLOW, TYPE_BPMN_LABEL, EVENT_BASED_GATEWAY];

export const PERMISSION_DEPLOY_PROCESS = 'permissions._has.bpmn-process-def-deploy?bool!true';
export const PERMISSION_VIEW_REPORTS = 'permissions._has.bpmn-process-def-report-view?bool';

export const PERMISSION_BPMN_INSTANCE_RUN = 'permissions._has.bpmn-process-instance-run?bool';
export const PERMISSION_BPMN_INSTANCE_EDIT = 'permissions._has.bpmn-process-instance-edit?bool';
export const PERMISSION_BPMN_INSTANCE_READ = 'permissions._has.bpmn-process-instance-read?bool';
export const PERMISSION_BPMN_INSTANCE_MIGRATE = 'permissions._has.bpmn-process-instance-migrate?bool';

export const PERMISSION_BPMN_SECTION_CREATE_SUBSECTION = 'permissions._has.bpmn-section-create-subsection?bool';
export const PERMISSION_BPMN_SECTION_CREATE_DEF = 'permissions._has.bpmn-section-create-process-def?bool';
export const PERMISSION_BPMN_SECTION_EDIT_DEF = 'permissions._has.bpmn-section-edit-process-def?bool';

export const STATUS_CHANGE_ICON_PATH =
  'm22 2zm-5 4.67c0 0 0 4.66 0 4.66 0 0 2.39-2.27 2.39-2.27 0 0 .94.94 .94.94 0 0-4 4-4 4 0 0-4-4-4-4 0 0 .95-.94.95-.94 0 0 2.39 2.27 2.39 2.27 0 0 0-4.66 0-4.66 0-.37-.3-.67-.67-.67 0 0-8 0-8 0-.37 0-.67.3-.67.67 0 0 0 7.33 0 7.33 0 0-1.33 0-1.33 0 0 0 0-7.33 0-7.33 0-1.11.9-2 2-2 0 0 8 0 8 0 1.1 0 2 .89 2 2 0 0 0 0 0 0zm-.67 15.33c-1.84 0-3.33-1.49-3.33-3.33 0-1.84 1.49-3.34 3.33-3.34 1.84 0 3.34 1.5 3.34 3.34-.01 1.84-1.5 3.33-3.34 3.33 0 0 0 0 0 0zm0-5.33c-1.1 0-2 .89-2 2 0 1.1.9 2 2 2 1.11 0 2-.9 2-2 0-1.11-.89-2-2-2 0 0 0 0 0 0zm-10.66 5.33c-1.84 0-3.34-1.49-3.34-3.33 0-1.84 1.5-3.34 3.34-3.34 1.84 0 3.33 1.5 3.33 3.34 0 1.84-1.49 3.33-3.33 3.33 0 0 0 0 0 0zm0-5.33c-1.11 0-2 .89-2 2 0 1.1.89 2 2 2 1.1 0 2-.9 2-2 0-1.11-.9-2-2-2 0 0 0 0 0 0z';
export const AI_ICON_PATH = 'M15.142,1.451L15.142,1.451c0.693,7.098,6.31,12.714,13.408,13.408l0,0c0.171,0.017,0.171,0.267,0,0.283l0,0\tc-7.098,0.693-12.714,6.31-13.408,13.408l0,0c-0.017,0.171-0.267,0.171-0.283,0l0,0c-0.693-7.098-6.31-12.714-13.408-13.408l0,0\tc-0.171-0.017-0.171-0.267,0-0.283l0,0c7.098-0.693,12.714-6.31,13.408-13.408l0,0C14.875,1.279,15.125,1.279,15.142,1.451z'

export const LABEL_STYLE = {
  fontFamily: 'Arial, sans-serif',
  fontSize: '12px',
  lineHeight: '1.2',
  color: '#444444'
};
