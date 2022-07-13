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

export const ELEMENT_TYPES_WITH_CUSTOM_FORM_DETERMINER = ['bpmn:IntermediateCatchEvent', 'bpmn:StartEvent', 'bpmn:BoundaryEvent'];

export const ELEMENT_TYPES_FORM_DETERMINER_MAP = new Map([['bpmn:TimerEventDefinition', 'bpmn:TimerEvent']]);

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

export const SEQUENCE_TYPE = 'bpmn:SequenceFlow';

export const SORT_FILTER_LAST_MODIFIED = 0;
export const SORT_FILTER_OLD = 1;
export const SORT_FILTER_AZ = 2;
export const SORT_FILTER_ZA = 3;

export const EDITOR_PAGE_CONTEXT = '/share/page/bpmn-editor/';

export const LOCAL_STORAGE_KEY_PAGE_POSITION = 'BpmnPagePosition';
export const LOCAL_STORAGE_KEY_REFERER_PAGE_PATHNAME = 'BpmnRefererPagePathName';

export const PREFIX_FORM_ELM = '@bpmn-type-';
export const TYPE_BPMN_PROCESS = 'bpmn:Process';
