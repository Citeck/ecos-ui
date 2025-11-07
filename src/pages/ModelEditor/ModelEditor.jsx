import { is } from 'bpmn-js/lib/util/ModelUtil';
import classNames from 'classnames';
import { flattenComponents } from 'formiojs/utils/formUtils';
import debounce from 'lodash/debounce';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import isFunction from 'lodash/isFunction';
import isString from 'lodash/isString';
import isUndefined from 'lodash/isUndefined';
import set from 'lodash/set';
import queryString from 'query-string';
import React from 'react';
import XMLViewer from 'react-xml-viewer';

import { PROCESS_DEF_API_ACTIONS } from '@/api/process';
import { getEcosType, getValue } from '@/components/ModelEditor/CMMNModeler/utils';
import ModelEditorWrapper from '@/components/ModelEditorWrapper';
import { EcosModal, InfoText, Loader } from '@/components/common';
import { FormWrapper } from '@/components/common/dialogs';
import {
  DEFINITON_TYPE,
  GATEWAY_TYPES,
  SEQUENCE_TYPE,
  TASK_TYPES,
  LOOP_CHARACTERISTICS,
  COLLABORATION_TYPE,
  PARTICIPANT_TYPE,
  TYPE_BPMN_PROCESS
} from '@/constants/bpmn';
import {
  EventListeners,
  IGNORED_VALUE_COMPONENTS,
  KEY_FIELD_ID,
  KEY_FIELD_NAME,
  KEY_FIELD_OUTCOMES,
  KEY_FIELDS,
  LABEL_POSTFIX,
  ML_POSTFIX,
  PREFIX_FIELD
} from '@/constants/cmmn';
import { DMN_DEFINITIONS } from '@/constants/dmn';
import { URL as Urls } from '@/constants/index';
import { getWorkspaceId } from '@/helpers/urls';
import { getCurrentLocale, getMLValue, getTextByLocale, t, fileDownload } from '@/helpers/util';
import PageService from '@/services/PageService';
import PageTabList from '@/services/pageTabs/PageTabList';

import './ModelEditor.scss';

class ModelEditorPage extends React.Component {
  static modelType = '';

  state = {
    selectedElement: undefined,
    formFields: [],
    recordData: null,
    xmlViewerXml: '',
    xmlViewerIsOpen: false,
    errors: 0,
    warnings: 0,
    initiated: false
  };

  designer;
  urlQuery = queryString.parseUrl(window.location.href).query;
  modelEditorRef = React.createRef(null);
  _processDefId = null;
  _tabId = null;
  _tempFormData = {};
  _formWrapperRef = React.createRef(null);
  _prevValue = {};
  _cachedLabels = {};
  _labelIsEdited = false;
  _formReady = false;
  _formsCache = {};
  _cachedEditor = null;
  _lastSavedModel = null;
  _lastSectionPath = null;

  #prevMultiInstanceType = null;

  componentDidMount() {
    this._tabId = PageTabList.activeTabId;
    this.handleInit();
  }

  handleCloseEditor = (params, tabId) => {
    const initialWsIdParam = this.urlQuery.ws;
    let nameEditor = '';

    switch (this.props.location.pathname) {
      case Urls.DMN_EDITOR:
        nameEditor = 'DMN';
        break;

      case Urls.BPMN_EDITOR:
        nameEditor = 'BPMN';
        break;

      default:
        break;
    }

    return new Promise((resolve, reject) => {
      const newUrl = new URL(params.link, window.location.origin);
      const newWsId = newUrl.searchParams.get('ws') || getWorkspaceId(); // If there is no workspace, then we move to the current space

      if (newWsId !== initialWsIdParam) {
        const callback = () => {
          const confirmed = window.confirm(t('editor.warning.change-workspace', { nameEditor }));
          if (!confirmed) {
            reject(t('editor.warning.change-workspace.cancel'));
          } else {
            resolve();
          }
        };

        const tab = PageTabList.tabs.find(tab => tabId && tab.id === tabId);
        if (tab && tab.id && tab.link && tabId) {
          this.props.changeTab({
            data: { isActive: true },
            filter: { id: tab.id },
            url: tab.link,
            callback
          });
        } else {
          // if there is no tab, then the tab is already closed
          resolve();
        }
      } else {
        resolve();
      }
    });
  };

  handleInit = () => {
    this.initModeler();
    this.props.initData();
    this.setState({ initiated: true });

    if (get(this.props, 'location.pathname') !== Urls.CMMN_EDITOR) {
      PageService.registerUrlChangeGuard(this.handleCloseEditor, this._tabId || PageTabList.activeTabId);
    }
  };

  componentDidUpdate(prevProps, prevState, snapshot) {
    this.setHeight();

    const { selectedElement } = this.state;
    const formDataId = get(this.props, 'formProps.formData.id');

    if (formDataId && selectedElement && formDataId !== selectedElement.id) {
      this.setState({ selectedElement: undefined });
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (nextState.xmlViewerIsOpen !== this.state.xmlViewerIsOpen) {
      return true;
    }

    return !isEqual(this.props, nextProps);
  }

  componentWillUnmount() {
    this._cachedLabels = {};
    this._formsCache = {};
    this.designer && this.designer.destroy();
    PageService.clearUrlChangeGuard(this._tabId);
    this._tabId = null;
  }

  initModeler = () => {};

  setHeight = debounce(() => {
    const elEditor = this.modelEditorRef.current && this.modelEditorRef.current.querySelector('.ecos-model-container');

    if (elEditor) {
      const indentation = elEditor.getBoundingClientRect().top;
      elEditor.setAttribute('style', `height: calc(100vh - 20px - ${indentation}px)`);
    }
  }, 1000);

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

  getElement(element = {}) {
    return this.designer.modeler.get('elementRegistry').get(element.id);
  }

  get formData() {
    const formData = get(this.props, 'formProps.formData');
    const { selectedElement } = this.state;

    if (!selectedElement || !selectedElement.id) {
      return formData;
    }

    return {
      ...formData,
      ...get(this._formsCache, selectedElement.id, {})
    };
  }

  get extraEvents() {
    return {
      [EventListeners.CREATE_END]: this.handleElementCreateEnd,
      [EventListeners.ELEMENT_UPDATE_ID]: this.handleElementUpdateId,
      [EventListeners.CS_ELEMENT_DELETE_POST]: this.handleElementDelete,
      [EventListeners.DRAG_START]: this.handleDragStart,
      // [EventListeners.ROOT_SET]: this.handleSetRoot, // This causes cyclical updates. At first glance, it works well without it
      [EventListeners.CS_CONNECTION_CREATE_PRE_EXECUTE]: this.handleCreateConnection
    };
  }

  #getMultiInstanceType = () => {
    const { selectedElement } = this.state;
    const element = this.getElement(selectedElement);

    if (!element) {
      return null;
    }

    const loopCharacteristics = get(element, 'di.bpmnElement.loopCharacteristics');

    if (!loopCharacteristics) {
      return null;
    }

    if (loopCharacteristics.isSequential) {
      return LOOP_CHARACTERISTICS.SEQUENCE;
    }

    if (isUndefined(loopCharacteristics.isSequential)) {
      return LOOP_CHARACTERISTICS.LOOP;
    }

    if (!loopCharacteristics.isSequential) {
      return LOOP_CHARACTERISTICS.PARALLEL;
    }
  };

  #getElementType = () => {
    return this.formType;
  };

  #getElementParentType = () => {
    const { selectedElement } = this.state;
    const element = this.getElement(selectedElement);

    if (!element) {
      return undefined;
    }

    return get(element, 'businessObject.$parent.$type');
  };

  #elementIsNonInterrupting = () => {
    const { selectedElement } = this.state;
    const element = this.getElement(selectedElement);

    if (!element) {
      return undefined;
    }

    return get(element, 'businessObject.cancelActivity') === false || get(element, 'businessObject.isInterrupting') === false;
  };

  #findOutcomes = source => {
    if (isEmpty(source)) {
      return [];
    }

    const childSource = get(source, 'source.incoming[0].source');

    if (isEmpty(childSource)) {
      return [];
    }

    const rawIncomingOutcomes = get(childSource, `businessObject.$attrs["${PREFIX_FIELD + KEY_FIELD_OUTCOMES}"]`);

    if (!isEmpty(rawIncomingOutcomes)) {
      return {
        source: childSource,
        incomingOutcomes: JSON.parse(rawIncomingOutcomes)
      };
    }

    return this.#findOutcomes(get(source, 'source.incoming[0]'));
  };

  #getIncomingOutcomes = () => {
    const { selectedElement } = this.state;
    const isSequenceFlow = get(selectedElement, 'type') === SEQUENCE_TYPE;

    if (!isSequenceFlow) {
      return [];
    }

    const element = this.getElement(selectedElement);

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
        if (GATEWAY_TYPES.includes(item.source.type)) {
          const { incomingOutcomes, source = {} } = this.#findOutcomes(item);

          source.id &&
            result.push({
              id: source.id,
              name: getMLValue(getValue(source, KEY_FIELD_NAME)),
              outcomes: incomingOutcomes.map(item => ({
                id: item.id,
                name: getMLValue(item.name)
              }))
            });
        }

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
        getEcosType: () => {
          return ecosType;
        },
        getIncomingOutcomes: this.#getIncomingOutcomes,
        getMultiInstanceType: this.#getMultiInstanceType,
        getElementType: this.#getElementType,
        getElementParentType: this.#getElementParentType,
        elementIsNonInterrupting: this.#elementIsNonInterrupting
      }
    };
  }

  get keyFields() {
    return KEY_FIELDS;
  }

  get editorExtraButtons() {
    const config = [];
    const zoom = [];

    return { config, zoom };
  }

  set tempFormData(data) {
    this._tempFormData = {
      ...this._tempFormData,
      ...data
    };
  }

  handleReadySheet = () => {
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
    const currentMultiInstanceType = this.#getMultiInstanceType();

    /**
     * Events can occur too often.
     * In order not to provoke extra renders, additionally compare the previous and current value.
     */
    if (this._formWrapperRef.current && !isEmpty(formFields) && !isEqual(this._prevValue, formFields)) {
      this._prevValue = { ...formFields };
      this.#prevMultiInstanceType = currentMultiInstanceType;
      this._formWrapperRef.current.setValue(formFields);

      return;
    }

    /**
     * If the multi instance type has changed, manually redraw the form
     */
    if (!isEqual(currentMultiInstanceType, this.#prevMultiInstanceType)) {
      this.#prevMultiInstanceType = currentMultiInstanceType;
      this._formWrapperRef.current.update();
    }
  };

  getFormFields(element) {
    const formFields = {};

    if (!element) {
      return formFields;
    }

    Object.keys(get(element, 'businessObject', {})).forEach(key => {
      if (this.keyFields.includes(key)) {
        const value = get(element, ['businessObject', key]);

        if (!isUndefined(value)) {
          if (key === KEY_FIELD_NAME) {
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

  handleSave = (definitionAction = PROCESS_DEF_API_ACTIONS.SAVE) => {
    if (!this.designer) {
      return;
    }

    this.updateXMLData();

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
        this.props.saveModel(xml, img, definitionAction, this._processDefId);
      })
      .catch(error => {
        throw new Error(`Failure to save xml or image: ${error.message}`);
      });
  };

  updateXMLData = () => {
    const form = get(this._formWrapperRef, 'current.form');
    const data = get(form, 'submission.data');

    Object.keys(this._cachedLabels).forEach(id => {
      this._labelIsEdited = false;

      if (this._formsCache[id] && this.designer.modeler && isFunction(this.designer.modeler.get)) {
        const element = this.designer.modeler.get('elementRegistry').get(id);

        if (element) {
          this.handleFormChange({ data: this._formsCache[id], changed: element }, form, element, true);
        }
      }
    });

    if (form && data) {
      this.handleFormChange({ data, changed: form }, form);
    }
  };

  handleSelectItem = element => {
    const { selectedElement: currentSelected } = this.state;
    const selectedElement = this._getBusinessObjectByDiagramElement(element);

    if (selectedElement && currentSelected && selectedElement.id === currentSelected.id) {
      return;
    }
    this._formReady = false;

    if (selectedElement && selectedElement.type === COLLABORATION_TYPE) {
      const root = this.designer.modeler.getDefinitions();
      const selected = this._getBusinessObjectByDiagramElement(root);

      const type = this.getFormType(root);

      if (type) {
        this.props.getFormProps(type, selected, this._cachedLabels);
      }

      this.setState({ selectedElement: selected, selectedDiagramElement: root });
    } else {
      const type = this.getFormType(selectedElement);

      if (type) {
        this.props.getFormProps(type, selectedElement, this._cachedLabels);
      }

      this.setState({ selectedElement, selectedDiagramElement: element });
    }

    this._labelIsEdited = false;
  };

  handleFormReady = () => {
    this._formReady = true;
  };

  handleBeforeFormDestroy = ({ data }) => {
    const { selectedElement } = this.state;
    let id = selectedElement.id;

    if (data.id !== id) {
      delete this._formsCache[id];
      delete this._formsCache[id + LABEL_POSTFIX];
      id = data.id;
      this.designer.updateProps(selectedElement, { id });
    }

    const mlNameKey = KEY_FIELD_NAME + ML_POSTFIX;

    if (id.endsWith(LABEL_POSTFIX)) {
      set(this._formsCache, [id.replace(LABEL_POSTFIX, ''), mlNameKey], data[mlNameKey]);
    } else {
      set(this._formsCache, [id + LABEL_POSTFIX, mlNameKey], data[mlNameKey]);
    }

    this._formsCache[id] = data;
  };

  handleFormChange = (info, form, elementToEdit, fromCachedLabels = false) => {
    const { isLoadingProps } = this.props;
    const { selectedElement, selectedDiagramElement } = this.state;

    const element = elementToEdit || selectedElement;

    if (this._labelIsEdited || isLoadingProps || !this._formReady) {
      return;
    }

    if (form.id !== get(this._formWrapperRef, 'current.form.id')) {
      return;
    }

    if (!info.changed || !element) {
      return;
    }

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

      const fieldKey = this.keyFields.includes(key) ? key : PREFIX_FIELD + key;
      const rawValue = info.data[key];

      if (is(selectedDiagramElement, DMN_DEFINITIONS) && key === KEY_FIELD_ID) {
        modelData[PREFIX_FIELD + 'defId'] = rawValue;
      }

      if (key === 'processDefId') {
        if (is(selectedDiagramElement, DEFINITON_TYPE)) {
          modelData['id'] = rawValue;
        }

        if (is(selectedDiagramElement, TYPE_BPMN_PROCESS)) {
          const modeler = this.designer.modeler;
          const modeling = modeler.get('modeling');

          modeling.updateProperties(selectedDiagramElement, { id: rawValue }, false);
        }

        this._processDefId = rawValue;
      }

      if (is(selectedDiagramElement, PARTICIPANT_TYPE) && key === 'processRef') {
        const process = get(selectedDiagramElement, 'businessObject.processRef');

        if (is(process, TYPE_BPMN_PROCESS)) {
          const modeler = isFunction(this.designer.modeler.getActiveViewer)
            ? this.designer.modeler.getActiveViewer()
            : this.designer.modeler;
          const modeling = modeler.get('modeling');

          isFunction(modeling.updateModdleProperties) &&
            modeling.updateModdleProperties(selectedDiagramElement, process, {
              id: rawValue
            });
        }
      }

      let valueAsText = rawValue;

      if (valueAsText != null && !isString(valueAsText)) {
        valueAsText = JSON.stringify(valueAsText);
      }

      modelData[fieldKey] = valueAsText;

      if (this.keyFields.includes(key) || key.endsWith(ML_POSTFIX)) {
        modelData[key.replace(ML_POSTFIX, '')] = getTextByLocale(rawValue);
      }
    }

    this.designer.updateProps(element, modelData, !fromCachedLabels);
    this.cacheFormData();

    if (selectedDiagramElement) {
      const eventBus = this.designer.getEventBus();
      if (eventBus) {
        eventBus.fire('element.changed', { element: selectedDiagramElement });
      }
    }
  };

  handleCreateConnection = async event => {
    if (!event.context.hints) {
      const connection = event.context.connection;
      const connectionElement = this._getBusinessObjectByDiagramElement(connection);

      this.designer.updateProps(connection, {
        [`${PREFIX_FIELD}conditionType`]:
          getValue(connectionElement, 'conditionType') || getValue(connectionElement, `${PREFIX_FIELD}conditionType`) || 'NONE'
      });
    }

    this.handleSelectItem(event.context.hints ? event.context.connection : event.context.target);
  };

  handleHideXmlViewerModal = () => {
    this.setState({ xmlViewerIsOpen: false, xmlViewerXml: '' });
  };

  handleClickViewXml = () => {
    this.updateXMLData();

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
        const link = window.URL.createObjectURL(svgBlob);
        fileDownload(link, 'diagram.svg');
      }
    });
  };

  handleClickForm = () => {
    this._labelIsEdited = false;
  };

  handleChangeLabel = label => {
    const { selectedElement: currentSelected } = this.state;
    const { isTableView } = this.props;
    const selectedElement = this._getBusinessObjectByDiagramElement(currentSelected);

    if (!selectedElement || isTableView) {
      return;
    }

    if (!isUndefined(label) && this._formWrapperRef.current) {
      const prevLabel = this._formWrapperRef.current.form
        ? get(this._formWrapperRef.current.form.getValue(), ['data', KEY_FIELD_NAME + ML_POSTFIX]) || {}
        : {};
      const newName = {
        ...prevLabel,
        [getCurrentLocale()]: label || ''
      };

      this._labelIsEdited = true;
      this._formWrapperRef.current.setValue({ [KEY_FIELD_NAME + ML_POSTFIX]: newName }, { noUpdateEvent: true });

      set(this._formsCache, [selectedElement.id, KEY_FIELD_NAME + ML_POSTFIX], newName);

      set(this._cachedLabels, [selectedElement.id, KEY_FIELD_NAME + ML_POSTFIX], newName);
    }
  };

  handleElementCreateEnd = event => {
    const element = get(event, 'elements.0');

    if (element.type === PARTICIPANT_TYPE) {
      const root = this.designer.modeler.getDefinitions();
      const participant = this._getBusinessObjectByDiagramElement(element);
      const type = getEcosType(participant);

      if (participant) {
        this.designer.updateProps(
          element,
          {
            'ecos:processRef': get(participant, 'businessObject.processRef.id'),
            'ecos:ecosType': isEmpty(type) ? root.$attrs['ecos:ecosType'] : type
          },
          true
        );

        const eventBus = this.designer.getEventBus();
        if (eventBus) {
          eventBus.fire('element.changed', { element });
        }
      }
    }

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
      delete this._cachedLabels[element.id + LABEL_POSTFIX];

      this.setState({ selectedElement: undefined, selectedDiagramElement: undefined });
      this.props.clearFormProps();
    }
  };

  handleDragStart = start => {
    const isCreateEvent = !isEmpty(get(start, 'elements'));

    // If this is a creation event (drag and drop from a palette or copy-paste),
    // then it is not necessary to cache the form or change the state
    if (isCreateEvent) {
      return;
    }

    const { selectedElement: currentSelected } = this.state;
    const selectedElement = this._getBusinessObjectByDiagramElement(start.shape);

    if (selectedElement && currentSelected && selectedElement.id === currentSelected.id) {
      return;
    }

    this.cacheFormData();
    this.setState({ selectedElement, selectedDiagramElement: start.shape });
  };

  handleSetRoot = ({ element }) => {
    if (!element || !element.di) {
      return;
    }

    this.handleSelectItem(element);
  };

  renderEditor = () => {
    const { savedModel, sectionPath } = this.props;

    if (!savedModel) {
      return <InfoText text={t('editor.error.no-model')} />;
    }

    if (this._cachedEditor == null || this._lastSavedModel !== savedModel || this._lastSectionPath !== sectionPath) {
      this._cachedEditor = this.designer.renderSheet({
        diagram: savedModel,
        onClickElement: this.handleSelectItem,
        onMounted: this.handleReadySheet,
        onChangeElement: this.handleChangeElement,
        onChangeElementLabel: this.handleChangeLabel,
        extraEvents: this.extraEvents,
        sectionPath
      });

      this._lastSavedModel = savedModel;
      this._lastSectionPath = sectionPath;
    }

    return this._cachedEditor;
  };

  render() {
    const { title, formProps, isLoading, isTableView, hasDeployRights } = this.props;
    const { selectedElement, xmlViewerXml, xmlViewerIsOpen, initiated } = this.state;

    if (!initiated) {
      return null;
    }

    return (
      <div className="ecos-model-editor__page" ref={this.modelEditorRef}>
        {isLoading && <Loader blur height={100} width={100} />}
        <ModelEditorWrapper
          title={title}
          onApply={this.handleSave}
          onViewXml={this.handleClickViewXml}
          onSaveAndDeploy={this.handleSave}
          onSaveDraft={this.handleSave}
          onSaveAsSVG={this.handleSaveAsSVG}
          onZoomIn={this.handleZoomIn}
          onZoomOut={this.handleZoomOut}
          onZoomReset={this.handleZoomReset}
          rightSidebarTitle={this.formTitle}
          editor={this.renderEditor()}
          extraButtons={this.editorExtraButtons}
          isTableView={isTableView}
          hasDeployRights={hasDeployRights}
          rightSidebar={
            <>
              {!!(isEmpty(formProps) && selectedElement) && <Loader />}
              {!selectedElement && <InfoText text={t('editor.error.no-selected-element')} />}

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
                  onBeforeFormDestroy={this.handleBeforeFormDestroy}
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
