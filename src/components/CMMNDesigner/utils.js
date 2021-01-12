export const GROUP_CUSTOM = 'custom';

export function getEcosType(element) {
  const definition = ((element || {}).businessObject || {}).definitionRef;

  return definition && definition.get ? definition.get('ecos:cmmnType') : '';
}

export const initialDiagram = `<?xml version="1.0" encoding="UTF-8"?>
<cmmn:definitions xmlns:dc="http://www.omg.org/spec/CMMN/20151109/DC" xmlns:cmmndi="http://www.omg.org/spec/CMMN/20151109/CMMNDI" xmlns:cmmn="http://www.omg.org/spec/CMMN/20151109/MODEL" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" id="Definitions_0uso40t" targetNamespace="http://bpmn.io/schema/cmmn" exporter="cmmn-js (https://demo.bpmn.io/cmmn)" exporterVersion="0.20.0">
  <cmmn:case id="Case_0aitqmd">
  <cmmn:casePlanModel id="CasePlanModel_1w94rbv" name="A CasePlanModel" />
  </cmmn:case>
<cmmndi:CMMNDI>
  <cmmndi:CMMNDiagram id="CMMNDiagram_1">
    <cmmndi:Size width="500" height="500" />
    <cmmndi:CMMNShape id="DI_CasePlanModel_1w94rbv" cmmnElementRef="CasePlanModel_1w94rbv">
      <dc:Bounds x="156" y="99" width="534" height="389" />
      <cmmndi:CMMNLabel />
    </cmmndi:CMMNShape>
  </cmmndi:CMMNDiagram>
</cmmndi:CMMNDI>
</cmmn:definitions>`;
