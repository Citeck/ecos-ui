import React from 'react';
import queryString from 'query-string';
import { connect } from 'react-redux';

import { initData, saveScenario } from '../../actions/cmmnEditor';
import { t } from '../../helpers/util';
import { SourcesId } from '../../constants';
import { InfoText, Loader } from '../../components/common';
import ModelEditor from '../../components/ModelEditor';
import CMMNDesigner from '../../components/CMMNDesigner';

import './style.scss';

const getStateId = () => 'cmmn-' + queryString.parseUrl(window.location.href).query.recordRef;

class CMMNEditorPage extends React.Component {
  state = {
    type: undefined
  };
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
          this.props.saveScenario(getStateId(), this.urlQuery.recordRef, xml, img);
        } else throw new Error();
      })
      .catch(() => this.props.saveScenario(getStateId(), this.urlQuery.recordRef));
  };

  render() {
    const { savedScenario, title, isLoading } = this.props;
    const { type } = this.state;

    return (
      <>
        {!isLoading && !savedScenario && <InfoText text={t('cmmn-editor.error.no-scenario')} />}
        {isLoading && <Loader height={100} width={100} />}
        <ModelEditor
          title={title}
          formId={`${SourcesId.EFORM}@proc-activity-${type}`}
          record={this.urlQuery.recordRef}
          onApply={this.handleSave}
          displayButtons={{ apply: true }}
          formOptions={{ definition: savedScenario }}
        >
          {savedScenario && <this.designer.Sheet diagram={savedScenario} />}
        </ModelEditor>
      </>
    );
  }
}

const mapStateToProps = (store, props) => {
  const ownStore = store.cmmnEditor[getStateId()] || {};

  return {
    isMobile: store.view.isMobile,
    title: ownStore.title,
    savedScenario: ownStore.scenario,
    isLoading: ownStore.isLoading
  };
};

const mapDispatchToProps = (dispatch, props) => {
  return {
    initData: (stateId, record) => dispatch(initData({ stateId, record })),
    saveScenario: (stateId, record, xml, img) => dispatch(saveScenario({ stateId, record, xml, img }))
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CMMNEditorPage);
