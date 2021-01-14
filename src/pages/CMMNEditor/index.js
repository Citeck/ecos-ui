import React from 'react';
import queryString from 'query-string';
import { connect } from 'react-redux';
import get from 'lodash/get';
import ModelUtil from 'cmmn-js/lib/util/ModelUtil';

import { initData, saveScenario } from '../../actions/cmmnEditor';
import { t } from '../../helpers/util';
import { SourcesId } from '../../constants';
import { InfoText, Loader } from '../../components/common';
import EcosForm from '../../components/EcosForm';
import ModelEditorWrapper from '../../components/ModelEditorWrapper';
import CMMNDesigner, { CmmnUtils } from '../../components/CMMNDesigner';

import './style.scss';

const getStateId = () => 'cmmn-' + queryString.parseUrl(window.location.href).query.recordRef;

class CMMNEditorPage extends React.Component {
  state = {
    selectedElement: undefined
  };
  designer = new CMMNDesigner();
  urlQuery = queryString.parseUrl(window.location.href).query;
  modelEditorRef = React.createRef();

  componentDidMount() {
    this.props.initData(getStateId(), this.urlQuery.recordRef);
  }

  setHeight = () => {
    const elEditor = this.modelEditorRef.current && this.modelEditorRef.current.querySelector('.ecos-cmmn-container');

    if (elEditor) {
      const indentation = elEditor.getBoundingClientRect().top;
      elEditor.setAttribute('style', `height: calc(100vh - ${indentation}px)`);
    }
  };

  get formType() {
    const { selectedElement } = this.state;
    const type = CmmnUtils.getType(selectedElement);
    const ecosType = CmmnUtils.getEcosType(selectedElement);
    console.log(type);
    console.log(ecosType);

    return ecosType || type;
  }

  get formTitle() {
    const { selectedElement } = this.state;
    return this.formType ? ModelUtil.getName(selectedElement) : null;
  }

  get formId() {
    return this.formType ? `${SourcesId.EFORM}@proc-activity-${this.formType}` : null;
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

  handleSelectItem = selectedElement => {
    this.setState({ selectedElement });
  };

  handleChangeItem = element => {
    const { selectedElement } = this.state;

    if (element && selectedElement && element.id === selectedElement.id) {
      this.setState({ selectedElement: element });
    }
  };

  handleFormChange = qqq => {
    console.log(qqq);
  };

  render() {
    const { savedScenario, title, isLoading } = this.props;
    const { selectedElement } = this.state;

    this.setHeight();

    return (
      <div className="ecos-cmmn-editor__page" ref={this.modelEditorRef}>
        {!isLoading && !savedScenario && <InfoText text={t('cmmn-editor.error.no-scenario')} />}
        {isLoading && <Loader height={100} width={100} />}
        <ModelEditorWrapper
          title={title}
          onApply={this.handleSave}
          displayButtons={{ apply: true }}
          rightSidebarTitle={this.formTitle}
          editor={
            savedScenario && (
              <this.designer.Sheet
                diagram={savedScenario}
                onSelectElement={this.handleSelectItem}
                onChangeElement={this.handleChangeItem}
              />
            )
          }
          rightSidebar={
            <EcosForm
              formId={this.formId}
              record={this.urlQuery.recordRef}
              options={{ ...get(selectedElement, 'businessObject', null) }}
              onFormChange={this.handleFormChange}
            />
          }
        />
      </div>
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
