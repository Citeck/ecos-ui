import ModelUtil from 'cmmn-js/lib/util/ModelUtil';

export const GROUP_CUSTOM = 'custom';

function getType(element) {
  const definition = ModelUtil.getDefinition(element);
  return definition && definition.$type;
}

function getEcosType(element) {
  const definition = ModelUtil.getDefinition(element);
  return definition && definition.get ? definition.get('ecos:cmmnType') : '';
}

const initialDiagram = `<?xml version="1.0" encoding="UTF-8"?>
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

export default {
  initialDiagram,
  getEcosType,
  getType
};
