import React from 'react';
import queryString from 'query-string';
import classNames from 'classnames';
import isEmpty from 'lodash/isEmpty';
import isString from 'lodash/isString';
import isUndefined from 'lodash/isUndefined';
import isEqual from 'lodash/isEqual';
import get from 'lodash/get';
import XMLViewer from 'react-xml-viewer';

import { t, getTextByLocale, getCurrentLocale, getMLValue } from '../../helpers/util';
import {
  EventListeners,
  GATEWAY_TYPES,
  KEY_FIELD_NAME,
  KEY_FIELD_OUTCOMES,
  KEY_FIELDS,
  ML_FIELDS,
  ML_POSTFIX,
  PREFIX_FIELD,
  SEQUENCE_TYPE,
  TASK_TYPES
} from '../../constants/cmmn';
import { EcosModal, InfoText, Loader } from '../../components/common';
import { FormWrapper } from '../../components/common/dialogs';
import ModelEditorWrapper from '../../components/ModelEditorWrapper';
import Records from '../../components/Records';
import { SourcesId } from '../../constants';

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
  #tempFormData = {};
  #formWrapperRef = React.createRef();
  #prevValue = {};
  #labelIsEdited = false;

  componentDidMount() {
    this.initModeler();
    this.props.initData();
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    this.setHeight();
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
        id: item.id,
        name: item.name,
        outcomes: outcomes.map(item => ({
          id: item.id,
          name: getMLValue(item.name)
        }))
      });
    }

    return result;
  };

  get formOptions() {
    const { ecosType = '' } = this.#tempFormData;

    return {
      editor: {
        getEcosType: () => Records.get(`${SourcesId.RESOLVED_TYPE}@${ecosType.slice(ecosType.indexOf('@') + 1)}`),
        getIncomingOutcomes: this.#getIncomingOutcomes
      }
    };
  }

  set tempFormData(data) {
    this.#tempFormData = {
      ...this.#tempFormData,
      ...data
    };
  }

  handleReadySheet = (...data) => {
    this.handleSelectItem(this.designer.elementDefinitions);
  };

  handleChangeElement = element => {
    if (!element) {
      return;
    }

    const formFields = this.getFormFields(element);

    /**
     * Events can occur too often.
     * In order not to provoke extra renders, additionally compare the previous and current value.
     */
    if (this.#formWrapperRef.current && !isEmpty(formFields) && !isEqual(this.#prevValue, formFields)) {
      this.#prevValue = { ...formFields };
      this.#formWrapperRef.current.setValue(formFields);
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
          if (key === KEY_FIELD_NAME /*ML_FIELDS.includes(key)*/) {
            /**
             * @todo save values other locales
             */
            formFields[key + ML_POSTFIX] = { [getCurrentLocale()]: value || '' };
          } else {
            formFields[key] = value;
          }
        }
      }
    });

    console.warn({ formFields });

    return formFields;
  }

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

    Promise.all([promiseXml, promiseImg])
      .then(([xml, img]) => {
        this.props.saveModel(xml, img, deploy);
      })
      .catch(error => {
        console.warn({ error });
        throw new Error(`Failure to save xml or image: ${error.message}`);
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
        this.props.getFormProps(this.formId, selectedElement);
      }
    );
  };

  _getBusinessObjectByDiagramElement(element) {
    return element;
  }

  handleFormChange = info => {
    const { selectedElement, selectedDiagramElement } = this.state;

    if (this.#labelIsEdited) {
      return;
    }

    if (info.changed && selectedElement) {
      const modelData = {};

      this.#tempFormData = { ecosType: get(info, 'data.ecosType') };

      console.log('info.data => ', info.data);

      Object.keys(info.data)
        .filter(key => !isUndefined(info.data[key]))
        .forEach(key => {
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
        });

      console.log({ modelData });

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

    this.designer.saveXML({
      callback: ({ xml }) => {
        if (xml) {
          this.setState({ xmlViewerXml: xml, xmlViewerIsOpen: true });
        }
      }
    });
  };

  handleClickForm = () => {
    this.#labelIsEdited = false;
  };

  handleChangeLabel = label => {
    const { selectedElement: currentSelected } = this.state;
    const selectedElement = this._getBusinessObjectByDiagramElement(currentSelected);

    if (!selectedElement) {
      return;
    }

    if (!isUndefined(label) && this.#formWrapperRef.current) {
      this.#labelIsEdited = true;
      this.#formWrapperRef.current.setValue(
        {
          [KEY_FIELD_NAME + ML_POSTFIX]: { [getCurrentLocale()]: label || '' }
        },
        { noUpdateEvent: true }
      );
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

    if (element && this.#formWrapperRef.current) {
      this.#formWrapperRef.current.clearFromCache(element.id);
    }
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
            'directEditing.complete': () => {
              this.#labelIsEdited = false;
            }
          }}
        />
      );
    } else {
      return <InfoText text={t(`${this.modelType}-editor.error.no-model`)} />;
    }
  };

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
          rightSidebarTitle={this.formTitle}
          editor={this.renderEditor()}
          rightSidebar={
            <>
              {!!(isEmpty(formProps) && selectedElement) && <Loader />}
              {!selectedElement && <InfoText text={t(`${this.modelType}-editor.error.no-selected-element`)} />}
              <FormWrapper
                id={get(selectedElement, 'id')}
                cached
                ref={this.#formWrapperRef}
                isVisible
                className={classNames('ecos-model-editor-page', { 'd-none': isEmpty(formProps) })}
                {...formProps}
                formOptions={this.formOptions}
                onClick={this.handleClickForm}
                onFormChange={this.handleFormChange}
              />
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
