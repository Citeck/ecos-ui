import React from 'react';
import queryString from 'query-string';
import { connect } from 'react-redux';
import classNames from 'classnames';
import ModelUtil from 'cmmn-js/lib/util/ModelUtil';
import isEmpty from 'lodash/isEmpty';

import { getFormProps, initData, saveScenario, setScenario } from '../../actions/cmmnEditor';
import { t } from '../../helpers/util';
import { SourcesId } from '../../constants';
import { KEY_FIELDS, PREFIX_FIELD, PREFIX_FORM_ELM, ROOT_TYPE_ELM } from '../../constants/cmmn';
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
    const { selectedElement } = this.state;

    if (selectedElement) {
      return CmmnUtils.getEcosType(selectedElement) || CmmnUtils.getType(selectedElement) || selectedElement.$type;
    }

    return undefined;
  }

  get formTitle() {
    return this.formType ? ModelUtil.getName(this.state.selectedElement) : null;
  }

  get formId() {
    return this.formType ? `${SourcesId.EFORM}${PREFIX_FORM_ELM}${this.formType}` : null;
  }

  get recordRef() {
    return this.urlQuery.recordRef;
  }

  handleReadySheet = () => {
    this.handleSelectItem(this.designer.elementDefinitions);
  };

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

    Promise.all([promiseXml, promiseImg]).then(([xml, img]) => {
      if (xml && img) {
        this.props.saveScenario(getStateId(), this.recordRef, xml, img);
      } else throw new Error();
    });
  };

  handleSelectItem = element => {
    const { selectedElement: currentSelected } = this.state;
    let selectedElement = element;

    if (element && element.type === ROOT_TYPE_ELM) {
      selectedElement = this.designer.elementDefinitions;
    }

    if (selectedElement && currentSelected && selectedElement.id === currentSelected.id) {
      return;
    }

    this.setState({ selectedElement }, () => {
      this.props.getFormProps(getStateId(), this.recordRef, this.formId, selectedElement);
    });
  };

  handleFormChange = info => {
    const { selectedElement } = this.state;

    if (info.changed && selectedElement) {
      const cmmnData = {};
      Object.keys(info.data).forEach(key => {
        const cmmnKey = KEY_FIELDS.includes(key) ? key : PREFIX_FIELD + key;
        cmmnData[cmmnKey] = info.data[key];
      });
      this.designer.updateProps(selectedElement, cmmnData);
    }
  };

  renderEditor = () => {
    const { savedScenario } = this.props;

    if (savedScenario) {
      return <this.designer.Sheet diagram={savedScenario} onClickElement={this.handleSelectItem} onMounted={this.handleReadySheet} />;
    } else {
      return <InfoText text={t('cmmn-editor.error.no-scenario')} />;
    }
  };

  render() {
    const { savedScenario, title, formProps, isLoading } = this.props;
    const { selectedElement } = this.state;

    return (
      <div className="ecos-cmmn-editor__page" ref={this.modelEditorRef}>
        {isLoading && <Loader blur height={100} width={100} />}
        <ModelEditorWrapper
          title={title}
          onApply={savedScenario && this.handleSave}
          rightSidebarTitle={this.formTitle}
          editor={this.renderEditor()}
          rightSidebar={
            <>
              {!!(isEmpty(formProps) && selectedElement) && <Loader />}
              {!selectedElement && <InfoText text={t('cmmn-editor.error.no-selected-element')} />}
              <FormWrapper
                isVisible
                className={classNames('ecos-cmmn-editor-page', { 'd-none': isEmpty(formProps) })}
                {...formProps}
                onFormChange={this.handleFormChange}
              />
            </>
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
    formProps: ownStore.formProps,
    isLoading: ownStore.isLoading
  };
};

const mapDispatchToProps = (dispatch, props) => ({
  initData: (stateId, record) => dispatch(initData({ stateId, record })),
  saveScenario: (stateId, record, xml, img) => dispatch(saveScenario({ stateId, record, xml, img })),
  setScenario: (stateId, scenario) => dispatch(setScenario({ stateId, scenario })),
  getFormProps: (stateId, record, formId, element) => dispatch(getFormProps({ stateId, record, formId, element }))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CMMNEditorPage);
