import React, { Component } from 'react';
import XMLViewer from 'react-xml-viewer';

import { Btn } from '../../../components/common/btns';
import { EcosModal } from '../../../components/common';
import CMMNModeler from '../../../components/ModelEditor/CMMNModeler';

import 'cmmn-js/dist/assets/diagram-js.css';
import 'cmmn-js/dist/assets/cmmn-font/css/cmmn.css';
import 'cmmn-js/dist/assets/cmmn-font/css/cmmn-codes.css';
import 'cmmn-js/dist/assets/cmmn-font/css/cmmn-embedded.css';

import './style.scss';
import { anotherDiagram, initialDiagram } from './testData';

class CmmnPage extends Component {
  state = { xml: '', isOpen: false };
  designer = null;

  constructor(props) {
    super(props);

    this.designer = new CMMNModeler();
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
          View current XML Diagram
        </Btn>
        {`  |  `}
        <Btn className="ecos-btn_blue" onClick={() => this.designer.setDiagram(anotherDiagram)}>
          Set another XML Diagram
        </Btn>
        {`  |  `}
        <Btn className="ecos-btn_blue" onClick={() => this.designer.setCustomContainer('#ownSheet')}>
          Set own Sheet
        </Btn>

        <div id="ownSheet" />
        <this.designer.Sheet diagram={initialDiagram} />

        <EcosModal title="XML" isOpen={isOpen} hideModal={this.handleHideModal}>
          <div className="cmmn-page__xml-viewer">{xml && <XMLViewer xml={xml} />}</div>
        </EcosModal>
      </div>
    );
  }
}

export default CmmnPage;
