import React from 'react';
import queryString from 'query-string';
import { connect } from 'react-redux';
import ModelUtil from 'cmmn-js/lib/util/ModelUtil';

import { getFormProps, initData, saveScenario, setScenario } from '../../actions/cmmnEditor';
import { t } from '../../helpers/util';
import { SourcesId } from '../../constants';
import { InfoText, Loader } from '../../components/common';
import { FormWrapper } from '../../components/common/dialogs';
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

  componentDidUpdate(prevProps, prevState, snapshot) {
    this.setHeight();
  }

  componentWillUnmount() {
    this.designer && this.designer.destroy();
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
          this.props.saveScenario(getStateId(), this.recordRef, xml, img);
        } else throw new Error();
      })
      .catch(() => this.props.saveScenario(getStateId(), this.recordRef));
  };

  handleSelectItem = selectedElement => {
    this.setState({ selectedElement }, () => {
      this.props.getFormData(getStateId(), this.recordRef, this.formId, selectedElement);
    });
  };

  handleChangeItem = element => {
    const { selectedElement } = this.state;
    //todo add check with form data
    if (element && selectedElement && element.id === selectedElement.id) {
      this.setState({ selectedElement: element });
    }
  };

  handleFormChange = info => {
    const { selectedElement } = this.state;

    if (info.changed && selectedElement) {
      this.designer.updateProps(selectedElement, info.data);
    }
  };

  renderEditor = () => {
    const { savedScenario, isLoading } = this.props;

    if (isLoading) {
      return <Loader blur height={100} width={100} />;
    } else if (savedScenario) {
      return <this.designer.Sheet diagram={savedScenario} onClickElement={this.handleSelectItem} onChangeElement={this.handleChangeItem} />;
    } else {
      return <InfoText text={t('cmmn-editor.error.no-scenario')} />;
    }
  };

  render() {
    const { savedScenario, title, formProps } = this.props;

    return (
      <div className="ecos-cmmn-editor__page" ref={this.modelEditorRef}>
        <ModelEditorWrapper
          title={title}
          onApply={savedScenario && this.handleSave}
          rightSidebarTitle={this.formTitle}
          editor={this.renderEditor()}
          rightSidebar={<FormWrapper isVisible {...formProps} onFormChange={this.handleFormChange} />}
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
    formProps: ownStore.formProps,
    isLoading: ownStore.isLoading
  };
};

const mapDispatchToProps = (dispatch, props) => ({
  initData: (stateId, record) => dispatch(initData({ stateId, record })),
  saveScenario: (stateId, record, xml, img) => dispatch(saveScenario({ stateId, record, xml, img })),
  setScenario: (stateId, scenario) => dispatch(setScenario({ stateId, scenario })),
  getFormData: (stateId, record, formId, element) => dispatch(getFormProps({ stateId, record, formId, element }))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CMMNEditorPage);
