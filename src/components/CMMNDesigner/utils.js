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
<cmmn:definitions xmlns:dc="http://www.omg.org/spec/CMMN/20151109/DC" xmlns:cmmndi="http://www.omg.org/spec/CMMN/20151109/CMMNDI" xmlns:cmmn="http://www.omg.org/spec/CMMN/20151109/MODEL" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" id="Definitions_0uso40t" targetNamespace="http://bpmn.io/schema/cmmn" exporter="cmmn-js (https://demo.bpmn.io/cmmn)" exporterVersion="0.20.0">
  <cmmn:case id="Case_0aitqmd">
  <cmmn:casePlanModel id="CasePlanModel_1w94rbv" name="A CasePlanModel" />
  </cmmn:case>
<cmmndi:CMMNDI>
  <cmmndi:CMMNDiagram id="CMMNDiagram_1">
    <cmmndi:Size width="500" height="500" />

  </cmmndi:CMMNDiagram>
</cmmndi:CMMNDI>
</cmmn:definitions>`;

export default {
  initialDiagram,
  getEcosType,
  getType
};
