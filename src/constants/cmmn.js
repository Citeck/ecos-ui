export const PREFIX_FIELD = 'ecos:';
export const ML_POSTFIX = '_ml';

export const PREFIX_FORM_ELM = '@cmmn-type-';

export const GROUP_CUSTOM = 'custom';
export const TYPE_CUSTOM = 'ecos:cmmnType';

export const TYPE_DI_DIAGRAM = 'cmmndi:CMMNDiagram';
export const TYPE_DI_EDGE = 'cmmndi:CMMNEdge';
export const TYPE_LABEL = 'label';

export const TYPE_IF_PART = 'cmmn:IfPart';
export const TYPE_ENTRY_CRITERION = 'cmmn:EntryCriterion';
export const TYPE_EXIT_CRITERION = 'cmmn:ExitCriterion';
export const TYPE_PLAN_ITEM = 'cmmn:PlanItem';

export const KEY_FIELD_NAME = 'name';
export const KEY_FIELDS = [KEY_FIELD_NAME];

// eslint-disable-next-line
export const initialDiagram = `<?xml version="1.0" encoding="UTF-8"?>
<cmmn:definitions
xmlns:dc="http://www.omg.org/spec/CMMN/20151109/DC"
xmlns:cmmndi="http://www.omg.org/spec/CMMN/20151109/CMMNDI"
xmlns:cmmn="http://www.omg.org/spec/CMMN/20151109/MODEL"
xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
xmlns:ecos="http://www.citeck.ru/ecos/cmmn"
id="Definitions_0uso40t" targetNamespace="http://bpmn.io/schema/cmmn" exporter="cmmn-js (https://demo.bpmn.io/cmmn)" exporterVersion="0.20.0">
  <cmmn:case id="Case_0aitqmd">
    <cmmn:casePlanModel id="CasePlanModel_1w94rbv" name="A CasePlanModel" />
  </cmmn:case>
  <cmmn:case id="Case_00b21zh">
    <cmmn:casePlanModel id="CasePlanModel_0dl1sfc">
      <cmmn:planItem id="PlanItem_1hiokxy" definitionRef="Task_1can4r7" />
      <cmmn:task id="Task_1can4r7" name="Action" ecos:cmmnType="Action" />
    </cmmn:casePlanModel>
  </cmmn:case>
  <cmmndi:CMMNDI>
    <cmmndi:CMMNDiagram id="CMMNDiagram_1">
      <cmmndi:Size width="500" height="500" />
      <cmmndi:CMMNShape id="CasePlanModel_0dl1sfc_di" cmmnElementRef="CasePlanModel_0dl1sfc">
        <dc:Bounds x="264" y="331" width="400" height="250" />
        <cmmndi:CMMNLabel />
      </cmmndi:CMMNShape>
      <cmmndi:CMMNShape id="PlanItem_1hiokxy_di" cmmnElementRef="PlanItem_1hiokxy">
        <dc:Bounds x="375" y="415" width="100" height="80" />
        <cmmndi:CMMNLabel />
      </cmmndi:CMMNShape>
    </cmmndi:CMMNDiagram>
  </cmmndi:CMMNDI>
</cmmn:definitions>
`;

export const EventListeners = {
  CREATE_END: 'create.end',
  ELEMENT_UPDATE_ID: 'element.updateId',
  CS_ELEMENT_DELETE_POST: 'commandStack.elements.delete.postExecuted'
};
