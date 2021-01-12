import React from 'react';
import queryString from 'query-string';
import { connect } from 'react-redux';

import { initData, saveDiagram } from '../../actions/cmmnEditor';
import { t } from '../../helpers/util';
import { InfoText } from '../../components/common';
import ModelEditor from '../../components/ModelEditor';
import CMMNDesigner from '../../components/CMMNDesigner';

import './style.scss';

const getStateId = () => 'cmmn-' + queryString.parseUrl(window.location.href).query.recordRef;

class CMMNEditorPage extends React.Component {
  designer = new CMMNDesigner();
  urlQuery = queryString.parseUrl(window.location.href).query;

  componentDidMount() {
    this.props.initData(getStateId(), this.urlQuery.recordRef);
  }

  handleSave = () => {
    if (!this.designer) {
      return;
    }

    const promiseXml = new Promise((resolve, reject) =>
      this.designer.saveXML({ callback: ({ error, xml }) => (xml ? resolve(xml) : reject(error)) })
    );
    const promiseImg = new Promise((resolve, reject) =>
      this.designer.saveSVG({ callback: ({ error, svg }) => (svg ? resolve(svg) : reject(error)) })
    );

    Promise.all([promiseXml, promiseImg])
      .then(([xml, img]) => {
        if (xml && img) {
          this.props.saveDiagram(getStateId(), this.urlQuery.recordRef, xml, img);
        } else throw new Error();
      })
      .catch(() => this.props.saveDiagram(getStateId(), this.urlQuery.recordRef));
  };

  render() {
    const { savedDiagram, title } = this.props;

    return (
      <ModelEditor
        title={title}
        type="cmmn:Stage"
        record={this.urlQuery.recordRef}
        onApply={this.handleSave}
        displayButtons={{ apply: true }}
      >
        {savedDiagram && <this.designer.Sheet diagram={savedDiagram} />}
        {!savedDiagram && <InfoText text={t('cmmn-editor.error.no-diagram')} />}
      </ModelEditor>
    );
  }
}

const mapStateToProps = (store, props) => {
  const ownStore = store.cmmnEditor[getStateId()] || {};

  return {
    isMobile: store.view.isMobile,
    title: ownStore.title,
    savedDiagram: ownStore.diagram
  };
};

const mapDispatchToProps = (dispatch, props) => {
  return {
    initData: (stateId, record) => dispatch(initData({ stateId, record })),
    saveDiagram: (stateId, record, xml, img) => dispatch(saveDiagram({ stateId, record, xml, img }))
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CMMNEditorPage);
