import React from 'react';
import queryString from 'query-string';
import { connect } from 'react-redux';
import ModelUtil from 'cmmn-js/lib/util/ModelUtil';

import { initData, saveRecordData, saveScenario, setScenario } from '../../actions/cmmnEditor';
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
    selectedElement: undefined,
    formFields: [],
    recordData: null
  };
  designer = new CMMNDesigner();
  urlQuery = queryString.parseUrl(window.location.href).query;
  modelEditorRef = React.createRef();

  componentDidMount() {
    this.props.initData(getStateId(), this.recordRef);
  }

  setHeight = () => {
    const elEditor = this.modelEditorRef.current && this.modelEditorRef.current.querySelector('.ecos-cmmn-container');

    if (elEditor) {
      const indentation = elEditor.getBoundingClientRect().top;
      elEditor.setAttribute('style', `height: calc(100vh - 20px - ${indentation}px)`);
    }
  };

  get formType() {
    return CmmnUtils.getEcosType(this.state.selectedElement) || CmmnUtils.getType(this.state.selectedElement);
  }

  get formTitle() {
    return this.formType ? ModelUtil.getName(this.state.selectedElement) : null;
  }

  get formId() {
    return this.formType ? `${SourcesId.EFORM}@proc-activity-${this.formType}` : null;
  }

  get recordRef() {
    return this.urlQuery.recordRef;
  }

  get formOptions() {
    const { selectedElement, formFields } = this.state;

    if (!selectedElement) {
      return {};
    }

    const _cmmnData_ = {};
    const businessObject = ModelUtil.getBusinessObject(selectedElement);

    formFields.forEach(key => {
      if (key === 'name') {
        _cmmnData_.name = ModelUtil.getName(selectedElement);
      } else {
        _cmmnData_[key] = businessObject.get(key);
      }
    });

    return { _cmmnData_ };
  }

  handleSave = () => {
    if (!this.formId && this.state.recordData) {
      this.props.saveRecord(getStateId(), this.recordRef, this.state.recordData);
    }

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
          this.props.saveScenario(getStateId(), this.recordRef, xml, img);
        } else throw new Error();
      })
      .catch(() => this.props.saveScenario(getStateId(), this.recordRef));
  };

  handleSelectItem = selectedElement => {
    this.setState({ selectedElement });
  };

  handleChangeItem = element => {
    const { selectedElement } = this.state;

    if (element && selectedElement && element.id === selectedElement.id) {
      this.setState({ selectedElement: element });
    }

    this.designer.saveXML({ callback: ({ xml }) => xml && this.props.setScenario(getStateId(), xml) });
  };

  handleFormChange = (...args) => {
    const formData = args.pop() || {};

    if (this.formId) {
      const { selectedElement } = this.state;
      const { _cmmnData_, ...data } = formData.data;

      if (formData.changed) {
        this.designer.updateProps(selectedElement, data);
      }
    } else {
      this.setState(state => ({ recordData: { ...state.recordData, ...formData.data } }));
    }
  };

  handleFormReady = (form = {}) => {
    if (this.formId) {
      const { _cmmnData_, ...data } = form.data || {};
      this.setState({ formFields: Object.keys(data) });
    }
  };

  render() {
    const { savedScenario, title, isLoading } = this.props;

    this.setHeight();

    return (
      <div className="ecos-cmmn-editor__page" ref={this.modelEditorRef}>
        {!isLoading && !savedScenario && <InfoText text={t('cmmn-editor.error.no-scenario')} />}
        {isLoading && <Loader blur height={100} width={100} />}
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
              record={this.recordRef}
              options={this.formOptions}
              onFormChange={this.handleFormChange}
              onReady={this.handleFormReady}
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

const mapDispatchToProps = (dispatch, props) => ({
  initData: (stateId, record) => dispatch(initData({ stateId, record })),
  saveRecord: (stateId, record, data) => dispatch(saveRecordData({ stateId, record, data })),
  saveScenario: (stateId, record, xml, img) => dispatch(saveScenario({ stateId, record, xml, img })),
  setScenario: (stateId, scenario) => dispatch(setScenario({ stateId, scenario }))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CMMNEditorPage);
