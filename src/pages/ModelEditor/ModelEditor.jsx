import React from 'react';
import queryString from 'query-string';
import classNames from 'classnames';
import isEmpty from 'lodash/isEmpty';
import isString from 'lodash/isString';
import isUndefined from 'lodash/isUndefined';
import isEqual from 'lodash/isEqual';
import get from 'lodash/get';
import set from 'lodash/set';
import XMLViewer from 'react-xml-viewer';
import { flattenComponents } from 'formiojs/utils/formUtils';

import { getCurrentLocale, getMLValue, getTextByLocale, t, downloadImageAsSVG } from '../../helpers/util';
import {
  EventListeners,
  IGNORED_VALUE_COMPONENTS,
  KEY_FIELD_NAME,
  KEY_FIELD_OUTCOMES,
  KEY_FIELDS,
  LABEL_POSTFIX,
  ML_POSTFIX,
  PREFIX_FIELD
} from '../../constants/cmmn';
import {
  GATEWAY_TYPES,
  SEQUENCE_TYPE,
  TASK_TYPES,
  ELEMENT_TYPES_WITH_CUSTOM_FORM_DETERMINER,
  ELEMENT_TYPES_FORM_DETERMINER_MAP
} from '../../constants/bpmn';
import { EcosModal, InfoText, Loader } from '../../components/common';
import { FormWrapper } from '../../components/common/dialogs';
import ModelEditorWrapper from '../../components/ModelEditorWrapper';
import Records from '../../components/Records';
import { SourcesId } from '../../constants';
import { getValue } from '../../components/ModelEditor/CMMNModeler/utils';

import './ModelEditor.scss';

class ModelEditorPage extends React.Component {
  static modelType = '';

  state = {
    selectedElement: undefined,
    formFields: [],
    recordData: null,
    xmlViewerXml: '',
    xmlViewerIsOpen: false
  };
  designer;
  urlQuery = queryString.parseUrl(window.location.href).query;
  modelEditorRef = React.createRef();
  _tempFormData = {};
  _formWrapperRef = React.createRef();
  _prevValue = {};
  _labelIsEdited = false;
  _formReady = false;
  _formsCache = {};

  componentDidMount() {
    this.initModeler();
    this.props.initData();
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    this.setHeight();

    const { selectedElement } = this.state;
    const formDataId = get(this.props, 'formProps.formData.id');

    if (formDataId && selectedElement && formDataId !== selectedElement.id) {
      this.setState({ selectedElement: undefined });
    }
  }

  componentWillUnmount() {
    this.designer && this.designer.destroy();
  }

  initModeler = () => {};

  setHeight = () => {
    const elEditor = this.modelEditorRef.current && this.modelEditorRef.current.querySelector('.ecos-model-container');

    if (elEditor) {
      const indentation = elEditor.getBoundingClientRect().top;
      elEditor.setAttribute('style', `height: calc(100vh - 20px - ${indentation}px)`);
    }
  };

  get modelType() {
    return this.constructor.modelType;
  }

  get formType() {
    const { selectedElement } = this.state;

    if (selectedElement) {
      const type = selectedElement.$type || selectedElement.type;
      if (!type) {
        console.error('Type is not found for element', selectedElement);
      } else {
        return type;
      }
    }

    return undefined;
  }

  get formTitle() {
    return null;
  }

  get formId() {
    return null;
  }

  get recordRef() {
    return this.urlQuery.recordRef;
  }

  getFormType() {
    return null;
  }

  #getIncomingOutcomes = () => {
    const { selectedElement } = this.state;
    const isSequenceFlow = get(selectedElement, 'type') === SEQUENCE_TYPE;

    if (!isSequenceFlow) {
      return [];
    }

    const element = this.designer.modeler.get('elementRegistry').find(e => e.id === selectedElement.id);

    if (!GATEWAY_TYPES.includes(get(element, 'source.type', ''))) {
      return [];
    }

    const incoming = get(element, 'source.incoming', []);
    const result = [];

    for (let i = 0; i < incoming.length; i++) {
      const item = incoming[i];

      if (item.type !== SEQUENCE_TYPE || !item.source) {
        continue;
      }

      if (!TASK_TYPES.includes(item.source.type)) {
        continue;
      }

      const rawOutcomes = get(item, `source.businessObject.$attrs.${PREFIX_FIELD + KEY_FIELD_OUTCOMES}`);
      const outcomes = isEmpty(rawOutcomes) ? [] : JSON.parse(rawOutcomes);

      result.push({
        id: get(item, 'source.id'),
        name: getMLValue(getValue(item.source, KEY_FIELD_NAME)),
        outcomes: outcomes.map(item => ({
          id: item.id,
          name: getMLValue(item.name)
        }))
      });
    }

    return result;
  };

  get formOptions() {
    const { ecosType = '' } = this._tempFormData;

    return {
      editor: {
        getEcosType: () => Records.get(`${SourcesId.RESOLVED_TYPE}@${ecosType.slice(ecosType.indexOf('@') + 1)}`),
        getIncomingOutcomes: this.#getIncomingOutcomes
      }
    };
  }

  set tempFormData(data) {
    this._tempFormData = {
      ...this._tempFormData,
      ...data
    };
  }

  handleReadySheet = (...data) => {
    this.handleSelectItem(this.designer.elementDefinitions);
  };

  handleChangeElement = element => {
    const { isLoadingProps } = this.props;

    if (!element || isLoadingProps || !this._formReady) {
      return;
    }

    if (!get(this._formWrapperRef, 'current.form.submission')) {
      return;
    }

    if (get(this._formWrapperRef, 'current.props.id', null) !== element.id) {
      return;
    }

    const formFields = this.getFormFields(element);
    /**
     * Events can occur too often.
     * In order not to provoke extra renders, additionally compare the previous and current value.
     */
    if (this._formWrapperRef.current && !isEmpty(formFields) && !isEqual(this._prevValue, formFields)) {
      this._prevValue = { ...formFields };
      this._formWrapperRef.current.setValue(formFields);
    }
  };

  getFormFields(element) {
    const formFields = {};

    if (!element) {
      return formFields;
    }

    Object.keys(get(element, 'businessObject', {})).forEach(key => {
      if (KEY_FIELDS.includes(key)) {
        const value = get(element, ['businessObject', key]);

        if (!isUndefined(value)) {
          if (key === KEY_FIELD_NAME) {
            /**
             * @todo save values other locales
             */
            const formData = this.formData;
            formFields[key + ML_POSTFIX] = formData[key + ML_POSTFIX];
          } else {
            formFields[key] = value;
          }
        }
      }
    });

    return formFields;
  }

  cacheFormData() {
    const { selectedElement } = this.state;
    const data = get(this._formWrapperRef, 'current.form.submission.data');

    if (!selectedElement || !data) {
      return;
    }

    const mlNameKey = KEY_FIELD_NAME + ML_POSTFIX;

    if (selectedElement.id.endsWith(LABEL_POSTFIX)) {
      set(this._formsCache, [selectedElement.id.replace(LABEL_POSTFIX, ''), mlNameKey], data[mlNameKey]);
    } else {
      set(this._formsCache, [selectedElement.id + LABEL_POSTFIX, mlNameKey], data[mlNameKey]);
    }

    this._formsCache[selectedElement.id] = data;
  }

  handleZoomIn = () => {
    this.designer.zoomIn();
  };

  handleZoomOut = () => {
    this.designer.zoomOut();
  };

  handleZoomReset = () => {
    this.designer.zoomReset();
  };

  handleSave = (deploy = false) => {
    if (!this.designer) {
      return;
    }

    const { savedModel } = this.props;

    if (!savedModel) {
      return;
    }

    const promiseXml = new Promise((resolve, reject) =>
      this.designer.saveXML({ callback: ({ error, xml }) => (xml ? resolve(xml) : reject(error)) })
    );
    const promiseImg = new Promise((resolve, reject) =>
      this.designer.saveSVG({ callback: ({ error, svg }) => (svg ? resolve(svg) : reject(error)) })
    );

    this.cacheFormData();

    Promise.all([promiseXml, promiseImg])
      .then(([xml, img]) => {
        this.props.saveModel(xml, img, deploy);
      })
      .catch(error => {
        throw new Error(`Failure to save xml or image: ${error.message}`);
      });
  };

  handleSelectItem = element => {
    const { selectedElement: currentSelected } = this.state;
    const selectedElement = this._getBusinessObjectByDiagramElement(element);

    if (selectedElement && currentSelected && selectedElement.id === currentSelected.id) {
      return;
    }

    this.cacheFormData();

    this._formReady = false;

    const formId = this._determineFormId(selectedElement);

    this.props.getFormProps(this.getFormType(formId), selectedElement);

    this.setState({ selectedElement, selectedDiagramElement: element });
    this._labelIsEdited = false;
  };

  _determineFormId(selectedElement) {
    const elementType = selectedElement.$type || selectedElement.type;

    if (ELEMENT_TYPES_WITH_CUSTOM_FORM_DETERMINER.includes(elementType)) {
      let eventDefType = get(selectedElement, 'businessObject.eventDefinitions[0].$type');
      if (ELEMENT_TYPES_FORM_DETERMINER_MAP.has(eventDefType)) {
        return ELEMENT_TYPES_FORM_DETERMINER_MAP.get(eventDefType);
      }
    }

    return elementType;
  }

  _getBusinessObjectByDiagramElement(element) {
    return element;
  }

  handleFormReady = form => {
    this._formReady = true;
  };

  handleFormChange = (info, form) => {
    const { isLoadingProps } = this.props;
    const { selectedElement, selectedDiagramElement } = this.state;

    if (this._labelIsEdited || isLoadingProps || !this._formReady) {
      return;
    }

    if (form.id !== get(this._formWrapperRef, 'current.form.id')) {
      return;
    }

    if (info.changed && selectedElement) {
      const modelData = {};
      const ecosType = get(info, 'data.ecosType');

      if (!isUndefined(ecosType)) {
        this._tempFormData = { ecosType };
      }

      const componentsByKey = flattenComponents(form.components);

      for (let key in info.data) {
        if (isUndefined(info.data[key]) || IGNORED_VALUE_COMPONENTS.includes(get(componentsByKey, [key, 'type']))) {
          continue;
        }

        const fieldKey = KEY_FIELDS.includes(key) ? key : PREFIX_FIELD + key;
        const rawValue = info.data[key];
        let valueAsText = rawValue;

        if (valueAsText != null && !isString(valueAsText)) {
          valueAsText = JSON.stringify(valueAsText);
        }

        modelData[fieldKey] = valueAsText;

        if (KEY_FIELDS.includes(key) || key.endsWith(ML_POSTFIX)) {
          modelData[key.replace(ML_POSTFIX, '')] = getTextByLocale(rawValue);
        }
      }

      this.designer.updateProps(selectedElement, modelData);

      if (selectedDiagramElement) {
        this.designer.getEventBus().fire('element.changed', { element: selectedDiagramElement });
      }
    }
  };

  handleHideXmlViewerModal = () => {
    this.setState({ xmlViewerIsOpen: false, xmlViewerXml: '' });
  };

  handleClickViewXml = () => {
    const { savedModel } = this.props;

    if (!savedModel) {
      return;
    }

    this.cacheFormData();

    this.designer.saveXML({
      callback: ({ xml }) => {
        if (xml) {
          this.setState({ xmlViewerXml: xml, xmlViewerIsOpen: true });
        }
      }
    });
  };

  handleSaveAsSVG = () => {
    if (!this.designer) {
      return;
    }

    this.designer.saveSVG({
      callback: ({ error, svg }) => {
        const svgBlob = new Blob([svg], {
          type: 'image/svg+xml'
        });
        downloadImageAsSVG(svgBlob);
      }
    });
  };

  handleClickForm = () => {
    this._labelIsEdited = false;
  };

  handleChangeLabel = label => {
    const { selectedElement: currentSelected } = this.state;
    const selectedElement = this._getBusinessObjectByDiagramElement(currentSelected);

    if (!selectedElement) {
      return;
    }

    if (!isUndefined(label) && this._formWrapperRef.current) {
      this._labelIsEdited = true;
      this._formWrapperRef.current.setValue(
        {
          [KEY_FIELD_NAME + ML_POSTFIX]: { [getCurrentLocale()]: label || '' }
        },
        { noUpdateEvent: true }
      );

      set(this._formsCache, [selectedElement.id, KEY_FIELD_NAME + ML_POSTFIX, getCurrentLocale()], label || '');
    }
  };

  handleElementCreateEnd = event => {
    const element = get(event, 'elements.0');

    element && this.handleSelectItem(element);
  };

  handleElementUpdateId = data => {
    const element = get(data, 'element');

    element && this.handleSelectItem(element);
  };

  handleElementDelete = data => {
    const element = get(data, 'context.elements.0');

    if (element) {
      delete this._formsCache[element.id];
      delete this._formsCache[element.id + LABEL_POSTFIX];

      this.setState({ selectedElement: undefined, selectedDiagramElement: undefined });
      this.props.clearFormProps();
    }
  };

  handleDragStart = (start, end) => {
    const { selectedElement: currentSelected } = this.state;
    const selectedElement = this._getBusinessObjectByDiagramElement(start.shape);

    if (selectedElement && currentSelected && selectedElement.id === currentSelected.id) {
      return;
    }

    this.cacheFormData();
    this.setState({ selectedElement, selectedDiagramElement: start.shape });
  };

  renderEditor = () => {
    const { savedModel } = this.props;

    if (savedModel) {
      return (
        <this.designer.Sheet
          diagram={savedModel}
          onClickElement={this.handleSelectItem}
          onMounted={this.handleReadySheet}
          onChangeElement={this.handleChangeElement}
          onChangeElementLabel={this.handleChangeLabel}
          extraEvents={{
            [EventListeners.CREATE_END]: this.handleElementCreateEnd,
            [EventListeners.ELEMENT_UPDATE_ID]: this.handleElementUpdateId,
            [EventListeners.CS_ELEMENT_DELETE_POST]: this.handleElementDelete,
            [EventListeners.DRAG_START]: this.handleDragStart
          }}
        />
      );
    } else {
      return <InfoText text={t(`${this.modelType}-editor.error.no-model`)} />;
    }
  };

  get formData() {
    const formData = get(this.props, 'formProps.formData');
    const { selectedElement } = this.state;

    if (!selectedElement || !selectedElement.id || !this._formReady) {
      return formData;
    }

    return {
      ...formData,
      ...get(this._formsCache, selectedElement.id, {})
    };
  }

  render() {
    const { title, formProps, isLoading } = this.props;
    const { selectedElement, xmlViewerXml, xmlViewerIsOpen } = this.state;

    return (
      <div className="ecos-model-editor__page" ref={this.modelEditorRef}>
        {isLoading && <Loader blur height={100} width={100} />}
        <ModelEditorWrapper
          title={title}
          onApply={this.handleSave}
          onViewXml={this.handleClickViewXml}
          onSaveAndDeploy={this.handleSave}
          onSaveAsSVG={this.handleSaveAsSVG}
          onZoomIn={this.handleZoomIn}
          onZoomOut={this.handleZoomOut}
          onZoomReset={this.handleZoomReset}
          rightSidebarTitle={this.formTitle}
          editor={this.renderEditor()}
          rightSidebar={
            <>
              {!!(isEmpty(formProps) && selectedElement) && <Loader />}
              {!selectedElement && <InfoText text={t(`${this.modelType}-editor.error.no-selected-element`)} />}

              {selectedElement && (
                <FormWrapper
                  id={get(selectedElement, 'id')}
                  ref={this._formWrapperRef}
                  isVisible
                  className={classNames('ecos-model-editor-page', { 'd-none': isEmpty(formProps) })}
                  {...formProps}
                  formData={this.formData}
                  formOptions={this.formOptions}
                  onClick={this.handleClickForm}
                  onFormChange={this.handleFormChange}
                  onFormReady={this.handleFormReady}
                />
              )}
            </>
          }
        />
        <EcosModal title="XML" size="xl" isOpen={xmlViewerIsOpen} hideModal={this.handleHideXmlViewerModal}>
          <div className="ecos-model-editor-page__xml-viewer">{xmlViewerXml && <XMLViewer xml={xmlViewerXml} />}</div>
        </EcosModal>
      </div>
    );
  }
}

export default ModelEditorPage;
