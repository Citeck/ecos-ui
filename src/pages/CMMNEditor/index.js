import React from 'react';
import queryString from 'query-string';
import { connect } from 'react-redux';
import classNames from 'classnames';
import isEmpty from 'lodash/isEmpty';
import isString from 'lodash/isString';
import ModelUtil from 'cmmn-js/lib/util/ModelUtil';

import { getFormProps, initData, saveScenario, setScenario } from '../../actions/cmmnEditor';
import { t, getTextByLocale } from '../../helpers/util';
import { SourcesId } from '../../constants';
import {
  KEY_FIELDS,
  ML_POSTFIX,
  PREFIX_FIELD,
  PREFIX_FORM_ELM,
  TYPE_DI_DIAGRAM,
  TYPE_ENTRY_CRITERION,
  TYPE_EXIT_CRITERION,
  TYPE_IF_PART,
  TYPE_DI_EDGE,
  TYPE_LABEL,
  TYPE_PLAN_ITEM
} from '../../constants/cmmn';
import { EcosModal, InfoText, Loader } from '../../components/common';
import { FormWrapper } from '../../components/common/dialogs';
import ModelEditorWrapper from '../../components/ModelEditorWrapper';
import CMMNDesigner from '../../components/CMMNDesigner';
import * as CmmnUtils from '../../components/CMMNDesigner/utils';
import XMLViewer from 'react-xml-viewer';

import './style.scss';

const getStateId = () => 'cmmn-' + queryString.parseUrl(window.location.href).query.recordRef;

class CMMNEditorPage extends React.Component {
  state = {
    selectedElement: undefined,
    formFields: [],
    recordData: null,
    xmlViewerXml: '',
    xmlViewerIsOpen: false
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
      const type = CmmnUtils.getEcosType(selectedElement) || selectedElement.$type || selectedElement.type;
      if (!type) {
        console.error('Type is not found for element', selectedElement);
      } else {
        return type;
      }
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
      } else {
        console.error('Xml or Img is undefined', xml, img);
        throw new Error('Xml or Img is undefined');
      }
    });
  };

  handleSelectItem = element => {
    const { selectedElement: currentSelected } = this.state;

    const selectedElement = this._getBusinessObjectByDiagramElement(element);

    if (selectedElement && currentSelected && selectedElement.id === currentSelected.id) {
      return;
    }

    this.setState(
      {
        selectedDiagramElement: element,
        selectedElement
      },
      () => {
        this.props.getFormProps(getStateId(), this.formId, selectedElement);
      }
    );
  };

  _getBusinessObjectByDiagramElement(element) {
    if (!element) {
      return element;
    }
    if (element.type === TYPE_DI_DIAGRAM) {
      element = this.designer.elementDefinitions;
    } else if (element.type === TYPE_ENTRY_CRITERION || element.type === TYPE_EXIT_CRITERION) {
      let sentry = element.businessObject.sentryRef;
      if (!sentry.ifPart) {
        const ifPart = this.designer.getCmmnFactory().create(TYPE_IF_PART);
        ifPart.$parent = sentry;
        sentry.ifPart = ifPart;
      }
      element = sentry.ifPart;
    } else if (element.type === TYPE_DI_EDGE || element.type === TYPE_LABEL) {
      element = element.businessObject.cmmnElementRef;
    } else if (element.type === TYPE_PLAN_ITEM) {
      element = element.businessObject.definitionRef;
    }

    return element;
  }

  handleFormChange = (selectedElement, selectedDiagramElement, info) => {
    if (info.changed && selectedElement) {
      const cmmnData = {};
      Object.keys(info.data).forEach(key => {
        const cmmnKey = KEY_FIELDS.includes(key) ? key : PREFIX_FIELD + key;
        const rawValue = info.data[key];
        let valueAsText = rawValue;
        if (valueAsText != null && !isString(valueAsText)) {
          valueAsText = JSON.stringify(valueAsText);
        }
        cmmnData[cmmnKey] = valueAsText;
        if (key.endsWith(ML_POSTFIX)) {
          cmmnData[key.replace(ML_POSTFIX, '')] = getTextByLocale(rawValue);
        }
      });
      this.designer.updateProps(selectedElement, cmmnData);
      if (selectedDiagramElement) {
        this.designer.getEventBus().fire('element.changed', { element: selectedDiagramElement });
      }
    }
  };

  handleHideXmlViewerModal = () => {
    this.setState({ xmlViewerIsOpen: false, xmlViewerXml: '' });
  };

  handleClickViewXml = () => {
    this.designer.saveXML({
      callback: ({ xml }) => {
        if (xml) {
          this.setState({ xmlViewerXml: xml, xmlViewerIsOpen: true });
        }
      }
    });
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
    const { selectedElement, selectedDiagramElement, xmlViewerXml, xmlViewerIsOpen } = this.state;
    const handleFormChange = info => this.handleFormChange(selectedElement, selectedDiagramElement, info);

    return (
      <div className="ecos-cmmn-editor__page" ref={this.modelEditorRef}>
        {isLoading && <Loader blur height={100} width={100} />}
        <ModelEditorWrapper
          title={title}
          onApply={savedScenario && this.handleSave}
          onViewXml={savedScenario && this.handleClickViewXml}
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
                onFormChange={handleFormChange}
              />
            </>
          }
        />
        <EcosModal title="XML" modalSize="xl" isOpen={xmlViewerIsOpen} hideModal={this.handleHideXmlViewerModal}>
          <div className="ecos-cmmn-editor-page__xml-viewer">{xmlViewerXml && <XMLViewer xml={xmlViewerXml} />}</div>
        </EcosModal>
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
  getFormProps: (stateId, formId, element) => dispatch(getFormProps({ stateId, formId, element }))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CMMNEditorPage);
