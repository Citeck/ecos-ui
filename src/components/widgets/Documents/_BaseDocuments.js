import classNames from 'classnames';
import cloneDeep from 'lodash/cloneDeep';
import get from 'lodash/get';
import head from 'lodash/head';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import PropTypes from 'prop-types';
import React from 'react';
import { Scrollbars } from 'react-custom-scrollbars';

import { DocumentsApi } from '../../../api/documents';
import { MAX_DEFAULT_HEIGHT_DASHLET } from '../../../constants';
import { Labels, statusesKeys, tooltips, typesStatuses, typeStatusesByFields } from '../../../constants/documents';
import DocumentsConverter from '../../../dto/documents';
import { t } from '../../../helpers/export/util';
import { prepareTooltipId } from '../../../helpers/util';
import { selectTypeStatus } from '../../../selectors/documents';
import DAction from '../../../services/DashletActionService';
import UserLocalSettingsService from '../../../services/userLocalSettings';
import FormManager from '../../EcosForm/FormManager';
import { EcosModal, Icon, Loader, Tooltip } from '../../common';
import { Btn } from '../../common/btns';
import { Dropdown } from '../../common/form';
import BaseWidget from '../BaseWidget';

import Badge from './parts/Badge';
import DropZone from './parts/DropZone';
import Settings from './parts/Settings';
import { AvailableTypeInterface, DynamicTypeInterface } from './propsInterfaces';

import { NotificationManager } from '@/services/notifications';

import './style.scss';

const documentsApi = new DocumentsApi();

class BaseDocuments extends BaseWidget {
  scrollPosition = {};

  static propTypes = {
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    stateId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,

    dragHandleProps: PropTypes.object,
    availableTypes: PropTypes.arrayOf(PropTypes.shape(AvailableTypeInterface)),
    dynamicTypes: PropTypes.arrayOf(PropTypes.shape(DynamicTypeInterface)),

    uploadError: PropTypes.string,
    countFilesError: PropTypes.string,

    canDragging: PropTypes.bool,
    isMobile: PropTypes.bool,
    isAdmin: PropTypes.bool,
    isLoading: PropTypes.bool,
    isUploadingFile: PropTypes.bool,
    isLoadingSettings: PropTypes.bool,
    isLoadingTableData: PropTypes.bool,
    maxHeightByContent: PropTypes.bool,

    initStore: PropTypes.func,
    getDocuments: PropTypes.func,
    onSaveSettings: PropTypes.func,
    onUploadFiles: PropTypes.func,
    setError: PropTypes.func,
    execRecordsAction: PropTypes.func
  };

  static defaultProps = {
    canDragging: false,
    maxHeightByContent: false,
    dragHandleProps: {}
  };

  constructor(props) {
    super(props);

    this.state = {
      ...this.state,
      selectedType: '',
      selectedTypeForLoading: '',
      isOpenSettings: false,
      isSentSettingsToSave: false,
      isOpenUploadModal: false,
      isDragFiles: false,
      autoHide: false,
      typesFilter: '',
      tableFilter: '',
      statusFilter: statusesKeys.ALL,
      typesStatuses: typeStatusesByFields.map(type => ({ ...type, value: t(type.value) })),
      isLoadingUploadingModal: true,
      needRefreshGrid: false
    };

    this._emptyStubRef = React.createRef();
    this._counterRef = React.createRef();
    this.observableFieldsToUpdateWithDefault = ['documents-hash'];
  }

  componentDidMount() {
    super.componentDidMount();
    this.initWidget();
  }

  static getDerivedStateFromProps(props, state) {
    const newState = {};

    if (!props.dynamicTypes.find(item => item.type === state.selectedType)) {
      newState.selectedType = '';
    }

    if (!state.selectedType && props.dynamicTypes.length === 1) {
      newState.selectedType = head(props.dynamicTypes).type;
    }

    if (!state.selectedTypeForLoading && props.dynamicTypes.length === 1) {
      newState.selectedTypeForLoading = head(props.dynamicTypes);
    }

    if (!props.isLoadingSettings && state.isOpenSettings && state.isSentSettingsToSave) {
      newState.isOpenSettings = false;
      newState.isSentSettingsToSave = false;
    }

    if (state.selectedTypeForLoading) {
      const selectedType = props.dynamicTypes.find(item => item.type === get(state.selectedTypeForLoading, 'type'));

      if (!isEqual(state.selectedTypeForLoading, selectedType)) {
        newState.selectedTypeForLoading = selectedType;
      }
    }

    if (!Object.keys(newState).length) {
      return null;
    }

    return newState;
  }

  get availableTypes() {
    const { groupedAvailableTypes } = this.props;
    const { typesFilter } = this.state;

    if (!typesFilter) {
      return groupedAvailableTypes;
    }

    const check = originTypes => {
      const types = cloneDeep(originTypes);
      const checkName = type => type.name.toLowerCase().includes(typesFilter);

      return types
        .map(type => {
          if (!type.items.length) {
            if (checkName(type)) {
              return type;
            }

            return null;
          }

          const items = check(type.items);

          if (!items.length) {
            type.items = [];

            return checkName(type) ? type : null;
          }

          return {
            ...type,
            items
          };
        })
        .filter(item => item !== null);
    };

    return check(groupedAvailableTypes);
  }

  get emptyStubHeight() {
    return get(this._emptyStubRef, 'current.offsetHeight', 0);
  }

  get calculatedEmptyHeight() {
    const { userHeight } = this.state;

    return userHeight !== undefined ? userHeight : this.emptyStubHeight;
  }

  get widgetTitle() {
    const { dynamicTypes } = this.props;

    if (dynamicTypes.length === 1) {
      return head(dynamicTypes).name;
    }

    return t(Labels.TITLE);
  }

  get dashletActionsConfig() {
    return {
      [DAction.Actions.RELOAD]: {
        onClick: this.initWidget
      },
      [DAction.Actions.SETTINGS]: {
        onClick: this.handleToggleTypesSettings,
        text: t(tooltips.SETTINGS)
      }
    };
  }

  get uploadingSettings() {
    const { dynamicTypes } = this.props;
    const { selectedTypeForLoading } = this.state;
    const defaultSettings = {
      multiple: false
    };

    if (dynamicTypes.length === 1) {
      return {
        ...defaultSettings,
        multiple: get(dynamicTypes, '[0].multiple', false)
      };
    }

    if (!selectedTypeForLoading) {
      return defaultSettings;
    }

    return {
      ...defaultSettings,
      multiple: get(selectedTypeForLoading, 'multiple', false)
    };
  }

  get tableMaxHeight() {
    return MAX_DEFAULT_HEIGHT_DASHLET - this.dashletOtherHeight - this.tablePanelHeight;
  }

  getTypeStatus = type => {
    return selectTypeStatus(type);
  };

  uploadingComplete() {
    this.setState({
      isOpenUploadModal: false,
      isDragFiles: false
    });
  }

  handleFilterTypes = (filter = '') => {
    this.setState({ typesFilter: filter.toLowerCase() });
  };

  getFormId = (type = {}) => {
    const createVariants = this.getFormCreateVariants(type);

    return type.formId || createVariants.formRef;
  };

  getFormCreateVariants = (type = {}) => {
    const { availableTypes } = this.props;
    const typeId = typeof type === 'string' ? type : type.type;

    return (
      get(
        availableTypes.find(item => item.id === typeId),
        'createVariants',
        {}
      ) || {}
    );
  };

  handleToggleUploadModalByType = async (type = null) => {
    this.setState({ isLoadingUploadingModal: false });

    if (type === null) {
      this.setState({
        selectedTypeForLoading: '',
        isOpenUploadModal: false
      });

      return;
    }

    const { formId = null } = type;
    let createVariants = this.getFormCreateVariants(type);
    const hasForm = formId !== null || !isEmpty(createVariants.formRef);
    let isFormOpens = false;

    if (!createVariants || isEmpty(createVariants)) {
      await documentsApi.getCreateVariants(typeof type === 'string' ? type : type.type).then(variants => {
        createVariants = variants;
      });
    }

    if (hasForm) {
      isFormOpens = true;
      this.openForm(DocumentsConverter.getDataToCreate({ ...type, record: this.props.record, ...createVariants }));
    }

    this.setState({
      selectedTypeForLoading: type,
      isOpenUploadModal: !isFormOpens
    });
  };

  handleFilterTable = (filter = '') => {
    this.setState({ tableFilter: filter.toLowerCase() });
  };

  handleChangeTypeFilter = (status = statusesKeys.ALL) => {
    this.setState({
      statusFilter: status.key
    });
  };

  handleChangeHeight = height => {
    let userHeight = height;

    if (this.state.userHeight === userHeight) {
      return;
    }

    if (userHeight < 0) {
      userHeight = 0;
    }

    UserLocalSettingsService.setDashletHeight(this.state.lsId, userHeight);
    this.setState({ userHeight });
  };

  handleSelectUploadFiles = (files, callback) => {
    const { selectedTypeForLoading } = this.state;

    if (this.getFormId(selectedTypeForLoading)) {
      this.props.onUploadFiles({ files, type: get(selectedTypeForLoading, 'type'), openForm: this.openForm, callback });

      return;
    }

    this.props.onUploadFiles({ files, type: get(selectedTypeForLoading, 'type'), callback });
  };

  handleUploadedFiles = () => {
    this.setState({ isLoadingUploadingModal: true });
  };

  handleSubmitForm = () => {
    const { selectedTypeForLoading } = this.state;

    this.props.getDocuments(get(selectedTypeForLoading, 'type'));
    this.uploadingComplete();
    NotificationManager.success(t('documents-widget.notification.add-one.success'));
  };

  handleSuccessRecordsAction = () => {
    this.props.getDocuments(this.state.selectedType);
    this.setToolsOptions();
  };

  handleToggleTypesSettings = event => {
    const { availableTypes, getAvailableTypes } = this.props;
    const { isOpenSettings } = this.state;

    if (isEmpty(availableTypes) && !isOpenSettings) {
      getAvailableTypes();
    }

    event.stopPropagation();
    this.setState(state => ({
      isOpenSettings: !state.isOpenSettings,
      typesFilter: ''
    }));
  };

  /**
   * To recalculate the need for scroll bars
   */
  handleCompleteResizeColumns = () => {
    this.setState({ autoHide: true }, () => this.setState({ autoHide: false }));
  };

  handleUpdate() {
    super.handleUpdate();
    this.initWidget();
  }

  handleCancelSettings = () => {
    this.setState({
      isOpenSettings: false,
      isSentSettingsToSave: false
    });
  };

  handleSaveSettings = ({ types, isLoadChecklist = false }) => {
    const { availableTypes, onSave, id, config, onSaveSettings } = this.props;
    const { selectedType } = this.state;
    const selectedTypes = types.map(item => {
      const type = availableTypes.find(type => type.id === item.id);

      return DocumentsConverter.getFormattedDynamicType({
        ...type,
        ...item
      });
    });

    const newConfig = {
      ...config,
      types: DocumentsConverter.getTypesForConfig(selectedTypes),
      isLoadChecklist
    };

    onSave(id, { config: newConfig });
    onSaveSettings(selectedTypes, newConfig, selectedType);
    this.setState({ isSentSettingsToSave: true });
  };

  handleOpenTypeSettings = type => {
    this.props.getTypeSettings(type);
  };

  initWidget = () => {
    this.props.initStore();
    this.setState({ isDragFiles: false });
  };

  openForm = (data = {}, options = {}) => {
    FormManager.createRecordByVariant(data, {
      ...options,
      onSubmit: this.handleSubmitForm
    });
  };

  renderCountStatus = (type, keyPostfix = '') => {
    const { id, stateId } = this.props;
    const target = prepareTooltipId(`${type.type}-${id}-${stateId}-${keyPostfix}`);
    const status = typesStatuses[this.getTypeStatus(type)];

    return (
      <Tooltip
        target={target}
        text={t(status)}
        uncontrolled
        showAsNeeded
        autohide
        modifiers={[
          {
            name: 'offset',
            enabled: true,
            options: {
              offset: [0, 10]
            }
          }
        ]}
      >
        <Badge type={type} target={target} forwardedRef={this._counterRef} />
      </Tooltip>
    );
  };

  renderUploadButton = () => {
    const { dynamicTypes } = this.props;
    const { selectedType, contentHeight } = this.state;
    const allowedTypes = dynamicTypes.filter(type => type.canUpload);

    if (selectedType) {
      const type = allowedTypes.find(item => item.type === selectedType);

      return (
        <div
          className={classNames('ecos-docs__panel-upload', {
            'ecos-docs__panel-upload_not-available': !type
          })}
          onClick={() => this.handleToggleUploadModalByType(type)}
        >
          <Icon className="icon-upload ecos-docs__panel-upload-icon" />
        </div>
      );
    }

    return (
      <Dropdown
        isStatic
        withScrollbar
        toggleClassName={classNames('ecos-docs__panel-upload', {
          'ecos-docs__panel-upload_not-available': !allowedTypes.length
        })}
        valueField="type"
        titleField="name"
        source={allowedTypes}
        onChange={this.handleToggleUploadModalByType}
        scrollbarHeightMax={contentHeight - this.tablePanelHeight}
      >
        <Icon className="icon-upload ecos-docs__panel-upload-icon" />
      </Dropdown>
    );
  };

  renderUploadingModal() {
    const { isUploadingFile } = this.props;
    const { selectedTypeForLoading, isOpenUploadModal, isLoadingUploadingModal } = this.state;

    return (
      <EcosModal
        title={get(selectedTypeForLoading, 'name', '')}
        isOpen={isOpenUploadModal}
        isLoading={isLoadingUploadingModal}
        className="ecos-docs__modal-upload"
        hideModal={this.handleToggleUploadModalByType.bind(this, null)}
      >
        <DropZone
          onSelect={this.handleSelectUploadFiles}
          onUploaded={this.handleUploadedFiles}
          isLoading={isUploadingFile}
          {...this.uploadingSettings}
        />
      </EcosModal>
    );
  }

  renderLoader() {
    const { isLoading } = this.props;

    if (!isLoading) {
      return null;
    }

    return <Loader className="ecos-docs__loader" blur rounded />;
  }

  renderSettings() {
    const { isLoadingSettings, isLoadChecklist, typeSettings, isLoadingTypeSettings, isLoadingAvailableTypes } = this.props;
    const { isOpenSettings } = this.state;

    return (
      <Settings
        isOpen={isOpenSettings}
        title={t(Labels.SETTINGS)}
        types={this.availableTypes}
        typeSettings={typeSettings}
        isLoading={isLoadingSettings || isLoadingAvailableTypes}
        isLoadChecklist={isLoadChecklist}
        isLoadingTypeSettings={isLoadingTypeSettings}
        onCancel={this.handleCancelSettings}
        onSave={this.handleSaveSettings}
        onEditType={this.handleOpenTypeSettings}
      />
    );
  }

  renderEmptyStub(className = '') {
    const { dynamicTypes, isLoading, isAdmin } = this.props;
    const { selectedType } = this.state;

    if (isLoading || selectedType || dynamicTypes.length) {
      return null;
    }

    return (
      <Scrollbars
        autoHeight={!Boolean(this.calculatedEmptyHeight)}
        style={{
          height: this.calculatedEmptyHeight || '100%'
        }}
        hideTracksWhenNotNeeded
        renderTrackVertical={props => <div {...props} className="ecos-grid__v-scroll" />}
      >
        <div className={classNames('ecos-docs__empty-stub', className)} ref={this._emptyStubRef}>
          <div className="ecos-docs__empty-stub-label">{t(Labels.NOT_CONFIGURATION_LABEL)}</div>

          {isAdmin && (
            <Btn className="ecos-btn_blue ecos-btn_hover_light-blue ecos-docs__empty-stub-button" onClick={this.handleToggleTypesSettings}>
              {t(Labels.OPEN_SETTINGS_BUTTON)}
            </Btn>
          )}
        </div>
      </Scrollbars>
    );
  }
}

export default BaseDocuments;
