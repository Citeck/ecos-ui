export const initialDiagram = `
<?xml version="1.0" encoding="UTF-8"?>
<cmmn:definitions xmlns:dc="http://www.omg.org/spec/CMMN/20151109/DC" xmlns:cmmndi="http://www.omg.org/spec/CMMN/20151109/CMMNDI" xmlns:cmmn="http://www.omg.org/spec/CMMN/20151109/MODEL" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:ecos="http://www.citeck.ru/ecos/cmmn" id="Test" targetNamespace="http://bpmn.io/schema/cmmn">
  <cmmn:case id="Case_2">
    <cmmn:casePlanModel id="CasePlanModel_2" name="Another CasePlanModel"/>
  </cmmn:case>
  <cmmn:case id="Case_1">
    <cmmn:casePlanModel id="CasePlanModel_1" name="A CasePlanModel">
      <cmmn:planItem id="PlanItem_1pd97ga" definitionRef="Task_1x0evny"/>
      <cmmn:planItem id="PlanItem_11celgp" definitionRef="EventListener_0amc35r"/>
      <cmmn:task id="Task_1x0evny" ecos:cmmnType="SetCaseStatusAction"/>
      <cmmn:eventListener id="EventListener_0amc35r" name=""/>
    </cmmn:casePlanModel>
  </cmmn:case>
  <cmmndi:CMMNDI>
    <cmmndi:CMMNDiagram id="Diagram_1">
      <cmmndi:Size width="500" height="500"/>
      <cmmndi:CMMNShape id="DI_CasePlanModel_1" cmmnElementRef="CasePlanModel_1">
        <dc:Bounds x="138" y="44" width="525" height="381"/>
      </cmmndi:CMMNShape>
      <cmmndi:CMMNShape id="PlanItem_1pd97ga_di" cmmnElementRef="PlanItem_1pd97ga">
        <dc:Bounds x="271" y="190" width="100" height="80"/>
        <cmmndi:CMMNLabel/>
      </cmmndi:CMMNShape>
      <cmmndi:CMMNShape id="PlanItem_11celgp_di" cmmnElementRef="PlanItem_11celgp">
        <dc:Bounds x="258" y="70" width="36" height="36"/>
        <cmmndi:CMMNLabel>
          <dc:Bounds x="276" y="106" width="0" height="0"/>
        </cmmndi:CMMNLabel>
      </cmmndi:CMMNShape>
    </cmmndi:CMMNDiagram>
    <cmmndi:CMMNDiagram id="Diagram_2">
      <cmmndi:Size width="500" height="500"/>
      <cmmndi:CMMNShape id="DI_CasePlanModel_2" cmmnElementRef="CasePlanModel_2">
        <dc:Bounds x="50" y="50" width="400" height="250"/>
      </cmmndi:CMMNShape>
    </cmmndi:CMMNDiagram>
  </cmmndi:CMMNDI>
</cmmn:definitions>
`;

export const anotherDiagram = `
<?xml version="1.0" encoding="UTF-8"?>
<cmmn:definitions xmlns:dc="http://www.omg.org/spec/CMMN/20151109/DC" xmlns:cmmndi="http://www.omg.org/spec/CMMN/20151109/CMMNDI" xmlns:cmmn="http://www.omg.org/spec/CMMN/20151109/MODEL" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:ecos="http://www.citeck.ru/ecos/cmmn" id="Test" targetNamespace="http://bpmn.io/schema/cmmn">
  <cmmn:case id="Case_2">
    <cmmn:casePlanModel id="CasePlanModel_2" name="Another CasePlanModel"/>
  </cmmn:case>
  <cmmn:case id="Case_1">
    <cmmn:casePlanModel id="CasePlanModel_1" name="A CasePlanModel">
      <cmmn:planItem id="PlanItem_15qa454" definitionRef="Task_13oirt0"/>
      <cmmn:task id="Task_13oirt0" name="ЗАДАча"/>
    </cmmn:casePlanModel>
  </cmmn:case>
  <cmmndi:CMMNDI>
    <cmmndi:CMMNDiagram id="Diagram_1">
      <cmmndi:Size width="500" height="500"/>
      <cmmndi:CMMNShape id="DI_CasePlanModel_1" cmmnElementRef="CasePlanModel_1">
        <dc:Bounds x="138" y="44" width="525" height="381"/>
      </cmmndi:CMMNShape>
      <cmmndi:CMMNShape id="PlanItem_15qa454_di" cmmnElementRef="PlanItem_15qa454">
        <dc:Bounds x="275" y="139" width="100" height="80"/>
        <cmmndi:CMMNLabel/>
      </cmmndi:CMMNShape>
    </cmmndi:CMMNDiagram>
    <cmmndi:CMMNDiagram id="Diagram_2">
      <cmmndi:Size width="500" height="500"/>
      <cmmndi:CMMNShape id="DI_CasePlanModel_2" cmmnElementRef="CasePlanModel_2">
        <dc:Bounds x="50" y="50" width="400" height="250"/>
      </cmmndi:CMMNShape>
    </cmmndi:CMMNDiagram>
  </cmmndi:CMMNDI>
</cmmn:definitions>
`;
