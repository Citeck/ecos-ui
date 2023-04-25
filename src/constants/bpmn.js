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
export const ELEMENT_TYPES_FORM_DETERMINER_BY_ECOS_TASK_TYPE_MAP = new Map([[ECOS_TASK_TYPE_SET_STATUS, 'bpmn:EcosTaskSetStatus']]);

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
  'bpmn:EventBasedGateway'
];

export const TASK_TYPES = [
  'bpmn:Task',
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

export const DEFINITON_TYPE = 'bpmn:Definitions';
export const SUBPROCESS_TYPE = 'bpmn:SubProcess';
export const SEQUENCE_TYPE = 'bpmn:SequenceFlow';
export const COLLABORATION_TYPE = 'bpmn:Collaboration';
export const PARTICIPANT_TYPE = 'bpmn:Participant';

export const EDITOR_PAGE_CONTEXT = '/share/page/bpmn-editor/';

export const LOCAL_STORAGE_KEY_PAGE_POSITION = 'BpmnPagePosition';
export const LOCAL_STORAGE_KEY_REFERER_PAGE_PATHNAME = 'BpmnRefererPagePathName';

export const BPMN_DELIMITER = ':';
export const BPMN_PREFIX_UNDERLINE = 'bpmn_';
export const PREFIX_FORM_ELM = '@bpmn-type-';
export const TYPE_BPMN_PROCESS = 'bpmn:Process';
export const TYPE_BPMN_TASK = 'bpmn:Task';
export const TYPE_BPMN_SEQUENCE_FLOW = 'bpmn:SequenceFlow';
export const TYPE_BPMN_END_EVENT = 'bpmn:EndEvent';
export const TYPE_BPMN_LABEL = 'label';
export const ECOS_TASK_BASE_ELEMENT = TYPE_BPMN_TASK;

export const DISABLE_SET_STATUS_ACTION_FOR_ELEMENTS = [TYPE_BPMN_END_EVENT, TYPE_BPMN_SEQUENCE_FLOW, TYPE_BPMN_LABEL];
