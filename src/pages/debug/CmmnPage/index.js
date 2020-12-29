import React, { Component } from 'react';
import XMLViewer from 'react-xml-viewer';

import { Btn } from '../../../components/common/btns';
import { EcosModal } from '../../../components/common';
import CMMNDesigner from '../../../components/CMMNDesigner';

import 'cmmn-js/dist/assets/diagram-js.css';
import 'cmmn-js/dist/assets/cmmn-font/css/cmmn.css';
import 'cmmn-js/dist/assets/cmmn-font/css/cmmn-codes.css';
import 'cmmn-js/dist/assets/cmmn-font/css/cmmn-embedded.css';

import './style.scss';

const res = `
<?xml version="1.0" encoding="UTF-8"?>
<cmmn:definitions
    xmlns:dc="http://www.omg.org/spec/CMMN/20151109/DC"
    xmlns:cmmndi="http://www.omg.org/spec/CMMN/20151109/CMMNDI"
    xmlns:cmmn="http://www.omg.org/spec/CMMN/20151109/MODEL"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xmlns:ecos="http://www.citeck.ru/ecos/cmmn"
    id="Test"
    targetNamespace="http://bpmn.io/schema/cmmn">

  <cmmn:case id="Case_2">
    <cmmn:casePlanModel id="CasePlanModel_2" name="Another CasePlanModel"/>
  </cmmn:case>
  <cmmn:case id="Case_1">
    <cmmn:casePlanModel id="CasePlanModel_1" name="A CasePlanModel"/>
  </cmmn:case>
  <cmmndi:CMMNDI>
    <cmmndi:CMMNDiagram id="Diagram_1">
      <cmmndi:Size width="500" height="500"/>
      <cmmndi:CMMNShape id="DI_CasePlanModel_1" cmmnElementRef="CasePlanModel_1">
        <dc:Bounds x="138" y="44" width="525" height="381"/>
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

class CmmnPage extends Component {
  state = { xml: '', isOpen: false };
  designer = null;

  constructor(props) {
    super(props);

    this.designer = new CMMNDesigner();
  }

  handleClickViewXml = () => {
    if (!this.designer) {
      return;
    }

    this.designer.saveXML({
      callback: ({ xml }) => {
        if (xml) {
          this.setState({ xml, isOpen: true });
        }
      }
    });
  };

  handleHideModal = () => {
    this.setState({ isOpen: false, xml: '' });
  };

  render() {
    const { xml, isOpen } = this.state;

    return (
      <div className="cmmn-page">
        <Btn className="ecos-btn_blue" onClick={this.handleClickViewXml}>
          View XML
        </Btn>

        <this.designer.Component diagram={res} />

        <EcosModal title="XML" isOpen={isOpen} hideModal={this.handleHideModal}>
          <div className="cmmn-page__xml-viewer">{xml && <XMLViewer xml={xml} />}</div>
        </EcosModal>
      </div>
    );
  }
}

export default CmmnPage;
