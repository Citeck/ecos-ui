import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classNames from 'classnames';
import { UncontrolledTooltip } from 'reactstrap';
import uniqueId from 'lodash/uniqueId';
import get from 'lodash/get';
import debounce from 'lodash/debounce';
import { Scrollbars } from 'react-custom-scrollbars';

import BaseWidget from '../BaseWidget';
import Dashlet from '../../Dashlet/Dashlet';
import { DefineHeight, EcosModal, Icon, Loader, ResizeBoxes, Search, Tooltip } from '../../common';
import { Dropdown } from '../../common/form';
import { Btn } from '../../common/btns';
import { Grid, InlineTools } from '../../common/grid';
import FormManager from '../../EcosForm/FormManager';
import DropZone from './DropZone';
import Settings from './Settings';
import UserLocalSettingsService, { DashletProps } from '../../../services/userLocalSettings';
import DocumentsConverter from '../../../dto/documents';
import {
  execRecordsAction,
  getDocumentsByType,
  initStore,
  saveSettings,
  setError,
  setInlineTools,
  uploadFiles
} from '../../../actions/documents';
import { selectStateByKey } from '../../../selectors/documents';
import { errorTypes, statusesKeys, tableFields, tooltips, typesStatuses, typeStatusesByFields } from '../../../constants/documents';
import { MIN_WIDTH_DASHLET_SMALL } from '../../../constants';
import { deepClone, prepareTooltipId, t, closest, objectCompare } from '../../../helpers/util';
import { AvailableTypeInterface, DocumentInterface, DynamicTypeInterface, GrouppedTypeInterface } from './propsInterfaces';

import './style.scss';

const Labels = {
  TITLE: 'documents-widget.title',
  SETTINGS: 'documents-widget.settings.title',
  UPLOAD_DROPZONE: 'documents-widget.upload.title',
  UPLOAD_MESSAGE: 'documents-widget.upload.message',
  NOT_CONFIGURATION_LABEL: 'documents-widget.label.not-configuration',
  OPEN_SETTINGS_BUTTON: 'documents-widget.btn.settings',
  ERROR_UPLOAD: 'documents-widget.error.upload-filed',
  ERROR_ONLY_ONE_FILE: 'documents-widget.error.only-one-file'
};

class Documents extends BaseWidget {
  #documentsColumns = tableFields.DEFAULT.map(item => ({
    dataField: item.name,
    text: t(item.label)
  }));
  scrollPosition = {};

  static propTypes = {
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    stateId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,

    dragHandleProps: PropTypes.object,
    grouppedAvailableTypes: PropTypes.arrayOf(PropTypes.shape(GrouppedTypeInterface)),
    availableTypes: PropTypes.arrayOf(PropTypes.shape(AvailableTypeInterface)),
    dynamicTypes: PropTypes.arrayOf(PropTypes.shape(DynamicTypeInterface)),
    documents: PropTypes.arrayOf(PropTypes.shape(DocumentInterface)),
    actions: PropTypes.object,

    uploadError: PropTypes.string,
    countFilesError: PropTypes.string,

    canDragging: PropTypes.bool,
    isMobile: PropTypes.bool,
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
    execRecordsAction: PropTypes.func,
    setInlineTools: PropTypes.func
  };

  static defaultProps = {
    canDragging: false,
    maxHeightByContent: true,
    dragHandleProps: {}
  };

  constructor(props) {
    super(props);

    UserLocalSettingsService.checkOldData(props.id);

    this.state = {
      leftColumnId: uniqueId('leftColumn_'),
      rightColumnId: uniqueId('rightColumn_'),
      selectedType: '',
      selectedTypeForLoading: '',
      fitHeights: {},
      contentHeight: null,
      width: MIN_WIDTH_DASHLET_SMALL,
      userHeight: UserLocalSettingsService.getDashletHeight(props.id),
      isCollapsed: UserLocalSettingsService.getDashletProperty(props.id, DashletProps.IS_COLLAPSED),
      isOpenSettings: false,
      isSentSettingsToSave: false,
      isOpenUploadModal: false,
      isDragFiles: false,
      autoHide: false,
      typesFilter: '',
      tableFilter: '',
      statusFilter: statusesKeys.ALL,
      typesStatuses: typeStatusesByFields.map(type => ({
        ...type,
        value: t(type.value)
      })),
      isLoadingUploadingModal: true,
      isHoverLastRow: false
    };

    this._tablePanel = React.createRef();
    this._tableRef = React.createRef();
    this._typesList = React.createRef();
    this._emptyStubRef = React.createRef();
    this._counterRef = React.createRef();
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
      newState.selectedType = props.dynamicTypes[0].type;
    }

    if (!state.selectedTypeForLoading && props.dynamicTypes.length === 1) {
      newState.selectedTypeForLoading = props.dynamicTypes[0];
    }

    if (!props.isLoadingSettings && state.isOpenSettings && state.isSentSettingsToSave) {
      newState.isOpenSettings = false;
      newState.isSentSettingsToSave = false;
    }

    if (!Object.keys(newState).length) {
      return null;
    }

    return newState;
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.isUploadingFile && !this.props.isUploadingFile && (prevState.isOpenUploadModal || prevState.isDragFiles)) {
      this.uploadingComplete();
    }

    if (prevState.selectedType !== this.state.selectedType) {
      this.scrollPosition = {};
      this.setContentHeight(this.calculatedClientHeight);
    }
  }

  componentWillUnmount() {
    this.handleRowMouseLeave.cancel();
  }

  get tablePanelHeight() {
    return get(this._tablePanel, 'current.offsetHeight', 0);
  }

  get tableHeight() {
    return get(this._tableRef, 'current.offsetHeight', 0);
  }

  get typesListHeight() {
    return get(this._typesList, 'current.offsetHeight', 0);
  }

  get emptyStubHeight() {
    return get(this._emptyStubRef, 'current.offsetHeight', 0);
  }

  get calculatedTablePanelHeight() {
    const { userHeight } = this.state;
    let calculatedHeight = this.tablePanelHeight;

    if (userHeight < calculatedHeight) {
      calculatedHeight = userHeight;
    }

    return calculatedHeight;
  }

  get needTablePanelScroll() {
    const { userHeight } = this.state;

    return userHeight <= this.tablePanelHeight;
  }

  get calculatedClientHeight() {
    if (!this.props.maxHeightByContent) {
      return null;
    }

    return Math.max(this.tablePanelHeight + this.tableHeight, this.typesListHeight, this.emptyStubHeight);
  }

  get calculatedTypesHeight() {
    const { userHeight } = this.state;

    return userHeight !== undefined ? userHeight : this.typesListHeight;
  }

  get calculatedEmptyHeight() {
    const { userHeight } = this.state;

    return userHeight !== undefined ? userHeight : this.emptyStubHeight;
  }

  get calculatedTableMinHeight() {
    const { userHeight } = this.state;

    return userHeight !== undefined ? userHeight - this.tablePanelHeight : this.tableHeight;
  }

  get widgetTitle() {
    const { dynamicTypes } = this.props;

    if (dynamicTypes.length === 1) {
      return dynamicTypes[0].name;
    }

    return t(Labels.TITLE);
  }

  get availableTypes() {
    const { grouppedAvailableTypes } = this.props;
    const { typesFilter } = this.state;

    if (!typesFilter) {
      return grouppedAvailableTypes;
    }

    const check = originTypes => {
      const types = deepClone(originTypes);
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

    return check(grouppedAvailableTypes);
  }

  get tableData() {
    const { documents, dynamicTypes } = this.props;
    const { tableFilter, selectedType, statusFilter } = this.state;
    const data = selectedType || dynamicTypes.length === 1 ? documents : dynamicTypes;
    const filter = (data = []) => {
      if (!data.length) {
        return [];
      }

      const fields = tableFields[selectedType ? 'DEFAULT' : 'ALL'];

      return data.filter(item => {
        const byStatus = statusFilter === statusesKeys.ALL ? true : this.getTypeStatus(item) === statusFilter;
        const byText = fields
          .map(field =>
            get(item, [field.name], '')
              .toLowerCase()
              .includes(tableFilter)
          )
          .includes(true);

        return byText && byStatus;
      });
    };

    return filter(data);
  }

  get dynamicTypes() {
    const { dynamicTypes } = this.props;
    const { statusFilter } = this.state;

    if (statusFilter === statusesKeys.ALL) {
      return dynamicTypes;
    }

    return dynamicTypes.filter(type => this.getTypeStatus(type) === statusFilter);
  }

  get dashletActionsConfig() {
    const actions = {};

    actions.reload = {
      onClick: this.initWidget
    };

    actions.settings = {
      onClick: this.handleToggleTypesSettings,
      text: t(tooltips.SETTINGS)
    };

    return actions;
  }

  get uploadingSettings() {
    const { dynamicTypes } = this.props;
    const { selectedTypeForLoading } = this.state;
    const defaultSettings = {
      miltiple: false
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

  getTypeStatus = type => {
    let status = statusesKeys.CAN_ADD_FILE;

    if (type.countDocuments === 1) {
      status = statusesKeys.FILE_ADDED;
    }

    if (type.countDocuments > 1) {
      status = statusesKeys.MULTI_FILES_ADDED;
    }

    if (type.mandatory && !type.countDocuments) {
      status = type.multiple ? statusesKeys.NEED_ADD_FILES : statusesKeys.NEED_ADD_FILE;
    }

    if (!type.countDocuments && !type.mandatory) {
      status = type.multiple ? statusesKeys.CAN_ADD_FILES : statusesKeys.CAN_ADD_FILE;
    }

    return status;
  };

  getDynamicType = (id = '') => {
    const { dynamicTypes, availableTypes } = this.props;

    if (!id) {
      return null;
    }

    let type = dynamicTypes.find(type => type.type === id);

    if (!type) {
      type = availableTypes.find(type => type.id === id);

      if (!type) {
        return null;
      }

      type = DocumentsConverter.getDynamicType(type);
    }

    return deepClone(type);
  };

  initWidget = () => {
    this.props.initStore();
    this.setState({
      isDragFiles: false
    });
  };

  uploadingComplete() {
    this.setState({
      isOpenUploadModal: false,
      isDragFiles: false
    });
  }

  handleReloadData = () => {
    this.props.initStore();
  };

  handleToggleTypesSettings = event => {
    event.stopPropagation();
    this.setState(state => ({
      isOpenSettings: !state.isOpenSettings,
      typesFilter: ''
    }));
  };

  handleClearSelectedType = () => {
    this.setState({ selectedType: '' });
    this.scrollPosition = {};
  };

  handleSelectType = (selectedType = {}) => {
    const { type } = selectedType;

    if (type === this.state.selectedType) {
      return;
    }

    this.props.getDocuments(type);
    this.setState(state => ({
      isDragFiles: false,
      selectedType: type,
      statusFilter: statusesKeys.ALL,
      selectedTypeForLoading: selectedType
    }));
    this.scrollPosition = {};
  };

  handleFilterTypes = (filter = '') => {
    this.setState({ typesFilter: filter.toLowerCase() });
  };

  handleToggleUploadModalByType = (type = null) => {
    this.setState({ isLoadingUploadingModal: false });

    if (type === null) {
      this.setState({
        selectedTypeForLoading: '',
        isOpenUploadModal: false
      });

      return;
    }

    const formId = get(type, 'formId', null);

    if (formId !== null) {
      this.openForm(DocumentsConverter.getDataToCreate({ ...type, record: this.props.record }));
    }

    this.setState({
      selectedTypeForLoading: type,
      isOpenUploadModal: formId === null
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

  handleClickTableRow = row => {
    if (this.state.selectedType) {
      return;
    }

    this.handleSelectType(row);
  };

  handleChangeHeight = height => {
    let userHeight = height;

    if (this.state.userHeight === userHeight) {
      return;
    }

    if (userHeight < 0) {
      userHeight = 0;
    }

    UserLocalSettingsService.setDashletHeight(this.props.id, userHeight);
    this.setState({ userHeight });
  };

  handleCancelSettings = () => {
    this.setState({
      isOpenSettings: false,
      isSentSettingsToSave: false
    });
  };

  handleSaveSettings = ({ types, isLoadChecklist = false }) => {
    const { availableTypes, onSave, id, config, onSaveSettings } = this.props;
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
    onSaveSettings(selectedTypes, newConfig);
    this.setState({ isSentSettingsToSave: true });
  };

  handleSelectUploadFiles = (files, callback) => {
    const { selectedTypeForLoading } = this.state;

    if (selectedTypeForLoading.formId) {
      this.props.onUploadFiles({ files, type: selectedTypeForLoading.type, openForm: this.openForm, callback });

      return;
    }

    this.props.onUploadFiles({ files, type: selectedTypeForLoading.type, callback });
  };

  handleUploadedFiles = () => {
    this.setState({ isLoadingUploadingModal: true });
  };

  handleDropRejected = () => {
    this.setState({ isDragFiles: false });
  };

  handleDragIn = event => {
    const dataTypes = get(event, 'dataTransfer.types', []);

    event.preventDefault();
    event.stopPropagation();

    if (!dataTypes.includes('Files')) {
      return;
    }

    this.setState({ isDragFiles: true });
  };

  handleDragOut = event => {
    event.preventDefault();
    event.stopPropagation();

    this.setState({ isDragFiles: false });
  };

  handleRowDrop = data => {
    const { files = [], type = {} } = data;

    if (!files.length) {
      return;
    }

    if (!type.multiple && files.length > 1) {
      this.setState({ selectedTypeForLoading: type });

      this.props.setError(errorTypes.COUNT_FILES, t(Labels.ERROR_ONLY_ONE_FILE));

      return false;
    }

    if (type.formId) {
      this.props.onUploadFiles({ files, type: type.type, openForm: this.openForm });
    } else {
      this.props.onUploadFiles({ files, type: type.type });
    }

    this.setState({ selectedTypeForLoading: type });
  };

  handleRowDragEnter = event => {
    if (this.props.uploadError) {
      this.props.setError(errorTypes.UPLOAD, '');
    }

    if (this.props.countFilesError) {
      this.props.setError(errorTypes.COUNT_FILES, '');
    }

    this.handleTypeRowMouseEnter(event);
  };

  handleSubmitForm = () => {
    const { selectedTypeForLoading } = this.state;

    this.props.getDocuments(selectedTypeForLoading.type);
    this.uploadingComplete();
  };

  handleMouseLeaveTable = () => {
    this.setToolsOptions();
    this.setState({ isHoverLastRow: false });
  };

  handleHoverRow = data => {
    const options = deepClone(data);
    let actions = deepClone(this.props.actions);
    const id = options.row.id;

    delete options.row;

    if (actions[id]) {
      actions[id].forEach(action => {
        action.onClick = () => {
          this.props.execRecordsAction([id], action, this.handleSuccessRecordsAction);
        };
      });

      this.setToolsOptions({
        ...data,
        actions: actions[id]
      });
    }
  };

  handleSuccessRecordsAction = () => {
    this.props.getDocuments(this.state.selectedType);
    this.setToolsOptions();
  };

  handleScollingTable = event => {
    this.scrollPosition = event;
  };

  /**
   * To recalculate the need for scroll bars
   */
  handleCompleteResizeColumns = () => {
    this.setState({ autoHide: true }, () => this.setState({ autoHide: false }));
  };

  handleMouseEnterInlineTools = () => {
    this.handleRowMouseLeave.cancel();
  };

  handleRowMouseEnter = event => {
    this.setState({ isHoverLastRow: false });
    this.handleTypeRowMouseEnter(event, 'ecos-grid__row');
    this.handleRowMouseLeave.cancel();
  };

  handleRowMouseLeave = debounce(() => {
    this.setState({ isHoverLastRow: false });
    this.setToolsOptions();
  }, 300);

  handleTypeRowMouseEnter = (event, rowSelector = 'ecos-docs__table-row') => {
    const row = closest(event.target, rowSelector);

    if (!row) {
      this.setState({ isHoverLastRow: false });
      return;
    }

    const table = closest(event.target, 'ecos-grid__table');

    if (!table) {
      this.setState({ isHoverLastRow: false });
      return;
    }

    const index = [...table.rows].findIndex(item => item === row);

    this.setState({ isHoverLastRow: index === table.rows.length - 1 });
  };

  handleTypeRowMouseLeave = () => this.setState({ isHoverLastRow: false });

  setToolsOptions = (options = {}) => {
    this.props.setInlineTools(options);
  };

  openForm = (data = {}) => {
    FormManager.createRecordByVariant(data, {
      onSubmit: this.handleSubmitForm
    });
  };

  countFormatter = (...params) => {
    const { uploadError, countFilesError, id } = this.props;
    const { selectedTypeForLoading } = this.state;
    const target = prepareTooltipId(`grid-label-${params[1].type}-${id}`);
    const style = {};
    let label = t(Labels.UPLOAD_MESSAGE);
    let hasTooltip = false;
    let hasError = false;

    if (params[1].type === selectedTypeForLoading.type) {
      if (uploadError) {
        label = t(Labels.ERROR_UPLOAD);
        hasTooltip = true;
        hasError = true;
      }

      if (countFilesError) {
        hasError = true;
        label = t(countFilesError);
      }
    }

    if (this._counterRef.current) {
      style['--label-right-indent'] = `${this._counterRef.current.offsetWidth}px`;
    }

    return (
      <div className="ecos-docs__table-count-status">
        <div
          id={target}
          className={classNames('ecos-docs__table-upload-label', {
            'ecos-docs__table-upload-label_error': hasError
          })}
          style={style}
        >
          {label}
        </div>
        {hasTooltip && (
          <UncontrolledTooltip
            placement="top"
            boundariesElement="window"
            className="ecos-base-tooltip"
            innerClassName="ecos-base-tooltip-inner"
            arrowClassName="ecos-base-tooltip-arrow"
            target={target}
          >
            {uploadError}
          </UncontrolledTooltip>
        )}
        {this.renderCountStatus(params[1], 'grid')}
      </div>
    );
  };

  renderTypes() {
    const { dynamicTypes } = this.props;
    const { selectedType, leftColumnId, rightColumnId } = this.state;

    if (dynamicTypes.length < 2) {
      return null;
    }

    return (
      <div id={leftColumnId} className="ecos-docs__column ecos-docs__column_types">
        <Scrollbars
          style={{ height: this.calculatedTypesHeight || '100%' }}
          hideTracksWhenNotNeeded
          renderTrackVertical={props => <div {...props} className="ecos-grid__v-scroll" />}
        >
          <div className="ecos-docs__types" ref={this._typesList}>
            <div
              onClick={this.handleClearSelectedType}
              className={classNames('ecos-docs__types-item', {
                'ecos-docs__types-item_selected': !selectedType
              })}
            >
              <div className="ecos-docs__types-item-label">{t('Все типы')}</div>
            </div>

            {dynamicTypes.map(this.renderType)}
          </div>
        </Scrollbars>

        <ResizeBoxes
          className="ecos-docs__resizer"
          leftId={leftColumnId}
          rightId={rightColumnId}
          notCountAtRight
          onResizeComplete={this.handleCompleteResizeColumns}
        />
      </div>
    );
  }

  renderType = item => {
    const { selectedType } = this.state;
    const id = prepareTooltipId(`type-${item.type}`);

    return (
      <div
        key={item.type}
        onClick={() => this.handleSelectType(item)}
        className={classNames('ecos-docs__types-item', {
          'ecos-docs__types-item_selected': selectedType === item.type
        })}
      >
        <Tooltip target={id} text={t(item.name)} uncontrolled showAsNeeded autohide>
          <div id={id} className="ecos-docs__types-item-label">
            {t(item.name)}
          </div>
        </Tooltip>

        {this.renderCountStatus(item)}
      </div>
    );
  };

  renderCountStatus = (type, keyPostfix = '') => {
    const { id } = this.props;
    const target = prepareTooltipId(`${type.type}-${id}-${keyPostfix}`);
    const status = typesStatuses[this.getTypeStatus(type)];

    return (
      <>
        <div
          id={target}
          ref={this._counterRef}
          className={classNames('ecos-docs__types-item-status', {
            'ecos-docs__types-item-status_files-need': !type.countDocuments && type.mandatory,
            'ecos-docs__types-item-status_files-can': !type.countDocuments && !type.mandatory
          })}
        >
          <Icon
            className={classNames('ecos-docs__types-item-status-icon', {
              'icon-check': type.countDocuments,
              'icon-close': !type.countDocuments
            })}
          />
          <div className="ecos-docs__types-item-status-counter">{type.countDocuments}</div>
        </div>
        <UncontrolledTooltip
          placement="top"
          boundariesElement="window"
          className="ecos-base-tooltip"
          innerClassName="ecos-base-tooltip-inner"
          arrowClassName="ecos-base-tooltip-arrow"
          target={target}
        >
          {t(status)}
        </UncontrolledTooltip>
      </>
    );
  };

  renderUploadButton() {
    const { dynamicTypes } = this.props;
    const { selectedType, contentHeight } = this.state;

    if (selectedType || dynamicTypes.length === 1) {
      const type = dynamicTypes.find(item => item.type === selectedType) || dynamicTypes[0];

      return (
        <div
          className={classNames('ecos-docs__panel-upload', {
            'ecos-docs__panel-upload_not-available': !dynamicTypes.length
          })}
          onClick={this.handleToggleUploadModalByType.bind(this, type)}
        >
          <Icon className="icon-load ecos-docs__panel-upload-icon" />
        </div>
      );
    }

    return (
      <Dropdown
        isStatic
        withScrollbar
        toggleClassName={classNames('ecos-docs__panel-upload', {
          'ecos-docs__panel-upload_not-available': !dynamicTypes.length
        })}
        valueField="type"
        titleField="name"
        source={dynamicTypes}
        onChange={this.handleToggleUploadModalByType}
        scrollbarHeightMax={contentHeight - this.tablePanelHeight}
      >
        <Icon className="icon-load ecos-docs__panel-upload-icon" />
      </Dropdown>
    );
  }

  renderPanel = React.memo(props => {
    const { dynamicTypes, statusFilter, selectedType, typesStatuses, contentHeight, tableFilter } = props;

    return (
      <div className="ecos-docs__panel" ref={this._tablePanel}>
        {this.renderUploadButton()}
        <Search
          text={tableFilter}
          cleaner
          liveSearch
          searchWithEmpty
          onSearch={this.handleFilterTable}
          className="ecos-docs__panel-search"
        />
        {!selectedType && dynamicTypes.length > 1 && (
          <Dropdown
            withScrollbar
            valueField="key"
            titleField="value"
            value={statusFilter}
            source={typesStatuses}
            className="ecos-docs__panel-filter"
            controlClassName="ecos-docs__panel-filter-control"
            onChange={this.handleChangeTypeFilter}
            scrollbarHeightMax={contentHeight - this.tablePanelHeight}
          />
        )}
      </div>
    );
  });

  renderTablePanel() {
    const { dynamicTypes } = this.props;
    const { selectedType, statusFilter, typesStatuses, contentHeight, tableFilter } = this.state;

    if (!selectedType && !dynamicTypes.length) {
      return null;
    }

    if (this.needTablePanelScroll) {
      return (
        <Scrollbars
          style={{ height: this.calculatedTablePanelHeight || '100%' }}
          hideTracksWhenNotNeeded
          renderTrackVertical={props => <div {...props} className="ecos-grid__v-scroll" />}
        >
          <this.renderPanel
            dynamicTypes={dynamicTypes}
            selectedType={selectedType}
            statusFilter={statusFilter}
            typesStatuses={typesStatuses}
            contentHeight={contentHeight}
            tableFilter={tableFilter}
          />
        </Scrollbars>
      );
    }

    return (
      <this.renderPanel
        dynamicTypes={dynamicTypes}
        selectedType={selectedType}
        statusFilter={statusFilter}
        typesStatuses={typesStatuses}
        contentHeight={contentHeight}
        tableFilter={tableFilter}
      />
    );
  }

  renderInlineTools = () => {
    const { stateId } = this.props;

    if (!stateId) {
      return null;
    }

    const actionsProps = {
      onMouseEnter: this.handleMouseEnterInlineTools
    };

    return (
      <InlineTools
        className="ecos-docs__table-inline-tools"
        stateId={stateId}
        reduxKey="documents"
        toolsKey="tools"
        withTooltip
        actionsProps={actionsProps}
      />
    );
  };

  renderDocumentsTable = () => {
    const { dynamicTypes, isUploadingFile } = this.props;
    const { selectedType, isDragFiles, autoHide, isHoverLastRow } = this.state;

    if (!selectedType && dynamicTypes.length !== 1) {
      return null;
    }

    const isShowDropZone = isDragFiles;

    return (
      <div style={{ height: '100%' }} onDragEnter={this.handleDragIn} onDragLeave={this.handleDragOut}>
        <Grid
          scrollable
          fixedHeader
          scrollAutoHide={autoHide}
          forwardedRef={this._tableRef}
          autoHeight
          minHeight={this.calculatedTableMinHeight}
          keyField="id"
          className={classNames('ecos-docs__table ecos-docs__table_documents', {
            'ecos-docs__table_hidden': isShowDropZone || isUploadingFile,
            'ecos-docs__table_without-after-element': isHoverLastRow
          })}
          data={this.tableData}
          columns={this.#documentsColumns}
          onChangeTrOptions={this.handleHoverRow}
          onScrolling={this.handleScollingTable}
          inlineTools={this.renderInlineTools}
          scrollPosition={this.scrollPosition}
          onRowMouseLeave={this.handleRowMouseLeave}
          onMouseEnter={this.handleRowMouseEnter}
          onMouseLeave={this.handleMouseLeaveTable}
          onGridMouseEnter={this.handleMouseLeaveTable}
        />

        <DropZone
          withoutButton
          style={{
            height: `${this.calculatedTableMinHeight - 2 * 19}px`
          }}
          label={t(Labels.UPLOAD_DROPZONE)}
          className={classNames('ecos-docs__table-dropzone', {
            'ecos-docs__table-dropzone_hidden': !isShowDropZone
          })}
          onSelect={this.handleSelectUploadFiles}
          onDropRejected={this.handleDropRejected}
          isLoading={isUploadingFile}
          {...this.uploadingSettings}
        />
      </div>
    );
  };

  renderTypesTable = React.memo(
    props => {
      const { dynamicTypes, selectedType, autoHide, isHoverLastRow, forwardedRef, minHeight, tableData, scrollPosition } = props;

      if (selectedType || !dynamicTypes.length) {
        return null;
      }

      const columns = tableFields.ALL.map(item => {
        const { name, label, ...other } = item;
        const extended = {};

        if (name === 'count') {
          extended.customFormatter = this.countFormatter;
        }

        return {
          dataField: name,
          text: t(label),
          ...other,
          ...extended
        };
      });

      return (
        <Grid
          className={classNames('ecos-docs__table ecos-docs__table_types', {
            'ecos-docs__table_without-after-element': isHoverLastRow
          })}
          rowClassName="ecos-docs__table-row"
          data={tableData}
          columns={columns}
          scrollable
          fixedHeader
          scrollAutoHide={autoHide}
          forwardedRef={forwardedRef}
          autoHeight
          minHeight={minHeight}
          keyField="type"
          onScrolling={this.handleScollingTable}
          onRowClick={this.handleClickTableRow}
          onRowDrop={this.handleRowDrop}
          onRowDragEnter={this.handleRowDragEnter}
          onMouseEnter={this.handleTypeRowMouseEnter}
          onRowMouseLeave={this.handleTypeRowMouseLeave}
          scrollPosition={scrollPosition}
        />
      );
    },
    (prevProps, nextProps) => {
      return objectCompare(prevProps, nextProps, { exclude: ['forwardedRef'] });
    }
  );

  renderTableLoader() {
    const { isLoading, isLoadingTableData, isUploadingFile } = this.props;
    const { selectedType } = this.state;

    if ((!isLoading && isLoadingTableData) || (isUploadingFile && !selectedType)) {
      return <Loader zIndex={999} blur />;
    }

    return null;
  }

  renderTable() {
    const { dynamicTypes } = this.props;

    if (!dynamicTypes.length) {
      return null;
    }

    const { rightColumnId, selectedType, autoHide, isHoverLastRow } = this.state;

    return (
      <div id={rightColumnId} className="ecos-docs__column ecos-docs__column_table">
        {this.renderTablePanel()}
        {this.renderDocumentsTable()}
        <this.renderTypesTable
          dynamicTypes={dynamicTypes}
          selectedType={selectedType}
          autoHide={autoHide}
          isHoverLastRow={isHoverLastRow}
          forwardedRef={this._tableRef}
          minHeight={this.calculatedTableMinHeight + 2}
          scrollPosition={this.scrollPosition}
          tableData={this.tableData}
        />
        {this.renderTableLoader()}
      </div>
    );
  }

  renderSettings() {
    const { isLoadingSettings, isLoadChecklist } = this.props;
    const { isOpenSettings } = this.state;

    return (
      <Settings
        isOpen={isOpenSettings}
        title={t(Labels.SETTINGS)}
        isLoading={isLoadingSettings}
        types={this.availableTypes}
        isLoadChecklist={isLoadChecklist}
        onCancel={this.handleCancelSettings}
        onSave={this.handleSaveSettings}
      />
    );
  }

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

    return <Loader className="ecos-docs__loader" blur />;
  }

  renderEmptyStub() {
    const { dynamicTypes } = this.props;
    const { selectedType } = this.state;

    if (selectedType || dynamicTypes.length) {
      return null;
    }

    return (
      <Scrollbars
        style={{ height: this.calculatedEmptyHeight || '100%' }}
        hideTracksWhenNotNeeded
        renderTrackVertical={props => <div {...props} className="ecos-grid__v-scroll" />}
      >
        <div className="ecos-docs__empty-stub" ref={this._emptyStubRef}>
          <div className="ecos-docs__empty-stub-label">{t(Labels.NOT_CONFIGURATION_LABEL)}</div>

          <Btn className="ecos-btn_blue ecos-btn_hover_light-blue ecos-docs__empty-stub-button" onClick={this.handleToggleTypesSettings}>
            {t(Labels.OPEN_SETTINGS_BUTTON)}
          </Btn>
        </div>
      </Scrollbars>
    );
  }

  render() {
    const { dragHandleProps, canDragging } = this.props;
    const { isCollapsed, userHeight } = this.state;

    return (
      <div>
        <Dashlet
          className="ecos-docs"
          title={this.widgetTitle}
          needGoTo={false}
          actionConfig={this.dashletActionsConfig}
          canDragging={canDragging}
          resizable
          contentMaxHeight={this.calculatedClientHeight}
          onResize={this.handleResize}
          dragHandleProps={dragHandleProps}
          onChangeHeight={this.handleChangeHeight}
          getFitHeights={this.setFitHeights}
          onToggleCollapse={this.handleToggleContent}
          isCollapsed={isCollapsed}
        >
          <DefineHeight
            className="ecos-docs__container"
            fixHeight={userHeight || null}
            maxHeight={this.calculatedClientHeight}
            minHeight={1}
            getOptimalHeight={this.setContentHeight}
          >
            <div>
              <div className="ecos-docs__body" ref={this.contentRef}>
                {this.renderTypes()}
                {this.renderTable()}
                {this.renderEmptyStub()}
                {this.renderLoader()}
              </div>
            </div>
            {this.renderSettings()}
            {this.renderUploadingModal()}
          </DefineHeight>
        </Dashlet>
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => ({
  ...selectStateByKey(state, ownProps.id),
  isMobile: state.view.isMobile
});
const mapDispatchToProps = (dispatch, ownProps) => ({
  initStore: () =>
    dispatch(
      initStore({
        record: ownProps.record,
        config: ownProps.config,
        key: ownProps.id
      })
    ),
  getDocuments: (type = '') =>
    dispatch(
      getDocumentsByType({
        record: ownProps.record,
        type,
        key: ownProps.id
      })
    ),
  onSaveSettings: (types, config) =>
    dispatch(
      saveSettings({
        record: ownProps.record,
        types,
        config,
        key: ownProps.id
      })
    ),
  onUploadFiles: data =>
    dispatch(
      uploadFiles({
        record: ownProps.record,
        ...data,
        key: ownProps.id
      })
    ),
  setError: (type, message = '') =>
    dispatch(
      setError({
        record: ownProps.record,
        type,
        message,
        key: ownProps.id
      })
    ),
  execRecordsAction: (records, action, callback) =>
    dispatch(
      execRecordsAction({
        record: ownProps.record,
        records,
        action,
        callback,
        key: ownProps.id
      })
    ),
  setInlineTools: tools =>
    dispatch(
      setInlineTools({
        record: ownProps.record,
        tools,
        key: ownProps.id
      })
    )
});

export default connect(mapStateToProps, mapDispatchToProps)(Documents);
