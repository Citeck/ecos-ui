import React, { Component } from 'react';
import CmmnModeler from 'cmmn-js/lib/Modeler';

import customModuleAction from './modules/action';

import 'cmmn-js/dist/assets/diagram-js.css';
import 'cmmn-js/dist/assets/cmmn-font/css/cmmn.css';
import 'cmmn-js/dist/assets/cmmn-font/css/cmmn-codes.css';
import 'cmmn-js/dist/assets/cmmn-font/css/cmmn-embedded.css';

const res = `
<?xml version="1.0" encoding="UTF-8"?>
<cmmn:definitions xmlns:dc="http://www.omg.org/spec/CMMN/20151109/DC" xmlns:di="http://www.omg.org/spec/CMMN/20151109/DI" xmlns:cmmndi="http://www.omg.org/spec/CMMN/20151109/CMMNDI" xmlns:cmmn="http://www.omg.org/spec/CMMN/20151109/MODEL" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" id="Test" targetNamespace="http://bpmn.io/schema/cmmn">
  <cmmn:case id="Case_1">
    <cmmn:casePlanModel id="CasePlanModel_1" name="A CasePlanModel">
      <cmmn:planItem id="PlanItem_1" definitionRef="Task_1" />
      <cmmn:task id="Task_1" />
    </cmmn:casePlanModel>
  </cmmn:case>
  <cmmndi:CMMNDI>
    <cmmndi:CMMNDiagram id="_5a66685b-5f57-4e2f-b1d1-acca4fae04b2">
      <cmmndi:Size xsi:type="dc:Dimension" width="500" height="500" />
      <cmmndi:CMMNShape id="DI_CasePlanModel_1" cmmnElementRef="CasePlanModel_1">
        <dc:Bounds x="114" y="63" width="534" height="389" />
        <cmmndi:CMMNLabel />
      </cmmndi:CMMNShape>
      <cmmndi:CMMNShape id="PlanItem_1_di" cmmnElementRef="PlanItem_1">
        <dc:Bounds x="150" y="96" width="100" height="80" />
        <cmmndi:CMMNLabel />
      </cmmndi:CMMNShape>
    </cmmndi:CMMNDiagram>
  </cmmndi:CMMNDI>
</cmmn:definitions>
`;

class CmmnPage extends Component {
  containerRef = React.createRef();

  componentDidMount() {
    this.initCmmn();
  }

  initCmmn = async () => {
    const container = this.containerRef.current;

    if (!container) {
      return;
    }

    const viewer = new CmmnModeler({
      container,
      additionalModules: [customModuleAction]
    });

    viewer.importXML(res, function(err) {
      if (err) {
        console.error('error rendering', err);
      } else {
        console.warn('rendered');
      }
    });
  };

  render() {
    return <div ref={this.containerRef} style={{ width: '100vw', height: '100vh' }} />;
  }
}

export default CmmnPage;
