import React from 'react';
import queryString from 'query-string';
import classNames from 'classnames';
import isEmpty from 'lodash/isEmpty';
import isString from 'lodash/isString';
import isUndefined from 'lodash/isUndefined';
import isEqual from 'lodash/isEqual';
import get from 'lodash/get';
import XMLViewer from 'react-xml-viewer';

import { t, getTextByLocale, getCurrentLocale } from '../../helpers/util';
import { KEY_FIELD_NAME, KEY_FIELDS, ML_POSTFIX, PREFIX_FIELD } from '../../constants/cmmn';
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

  get formOptions() {
    const { ecosType = '' } = this.#tempFormData;

    return {
      editor: {
        getEcosType: () => Records.get(`${SourcesId.RESOLVED_TYPE}@${ecosType.slice(ecosType.indexOf('@') + 1)}`)
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
          if (key === KEY_FIELD_NAME) {
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

    return formFields;
  }

  handleSave = (deploy = false) => {
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

    if (info.changed && selectedElement) {
      const modelData = {};

      this.#tempFormData = { ecosType: get(info, 'data.ecosType') };

      Object.keys(info.data).forEach(key => {
        const fieldKey = KEY_FIELDS.includes(key) ? key : PREFIX_FIELD + key;
        const rawValue = info.data[key];
        let valueAsText = rawValue;

        if (valueAsText != null && !isString(valueAsText)) {
          valueAsText = JSON.stringify(valueAsText);
        }

        modelData[fieldKey] = valueAsText;

        if (key.endsWith(ML_POSTFIX)) {
          modelData[key.replace(ML_POSTFIX, '')] = getTextByLocale(rawValue);
        }
      });

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
    this.designer.saveXML({
      callback: ({ xml }) => {
        if (xml) {
          this.setState({ xmlViewerXml: xml, xmlViewerIsOpen: true });
        }
      }
    });
  };

  handleChangeLabel = label => {
    const { selectedElement: currentSelected } = this.state;
    const selectedElement = this._getBusinessObjectByDiagramElement(currentSelected);

    if (!selectedElement) {
      return;
    }

    if (!isUndefined(label) && this.#formWrapperRef.current) {
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
            'create.end': this.handleElementCreateEnd,
            'element.updateId': this.handleElementUpdateId
          }}
        />
      );
    } else {
      return <InfoText text={t(`${this.modelType}-editor.error.no-model`)} />;
    }
  };

  render() {
    const { savedModel, title, formProps, isLoading } = this.props;
    const { selectedElement, xmlViewerXml, xmlViewerIsOpen } = this.state;

    return (
      <div className="ecos-model-editor__page" ref={this.modelEditorRef}>
        {isLoading && <Loader blur height={100} width={100} />}
        <ModelEditorWrapper
          title={title}
          onApply={savedModel && (() => this.handleSave(false))}
          onViewXml={savedModel && this.handleClickViewXml}
          onSaveAndDeploy={() => this.handleSave(true)}
          rightSidebarTitle={this.formTitle}
          editor={this.renderEditor()}
          rightSidebar={
            <>
              {!!(isEmpty(formProps) && selectedElement) && <Loader />}
              {!selectedElement && <InfoText text={t(`${this.modelType}-editor.error.no-selected-element`)} />}
              <FormWrapper
                ref={this.#formWrapperRef}
                isVisible
                className={classNames('ecos-model-editor-page', { 'd-none': isEmpty(formProps) })}
                {...formProps}
                formOptions={this.formOptions}
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
