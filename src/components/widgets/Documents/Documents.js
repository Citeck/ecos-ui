import React from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';
import { UncontrolledTooltip } from 'reactstrap';
import uniqueId from 'lodash/uniqueId';
import get from 'lodash/get';
import { Scrollbars } from 'react-custom-scrollbars';

import BaseWidget from '../BaseWidget';
import Dashlet from '../../Dashlet/Dashlet';
import { Icon, ResizeBoxes, EcosModal, Search, DefineHeight, Loader } from '../../common';
import { Dropdown } from '../../common/form';
import FormManager from '../../EcosForm/FormManager';
import DropZone from './DropZone';
import Settings from './Settings';
import { Grid } from '../../common/grid';
import InlineTools from '../../common/grid/InlineTools';
import UserLocalSettingsService from '../../../services/userLocalSettings';
import DocumentsConverter from '../../../dto/documents';
import {
  getDocumentsByType,
  init,
  saveSettings,
  uploadFiles,
  setError,
  execRecordsAction,
  setInlineTools
} from '../../../actions/documents';
import { selectStateByKey } from '../../../selectors/documents';
import { statusesKeys, typesStatuses, tooltips, typeStatusesByFields, tableFields, errorTypes } from '../../../constants/documents';
import { MIN_WIDTH_DASHLET_SMALL } from '../../../constants';
import { t, prepareTooltipId, deepClone } from '../../../helpers/util';

import './style.scss';

const Labels = {
  TITLE: 'Документы',
  SETTINGS: 'Настройка типов документов',
  UPLOAD_DROPZONE: 'Добавить файлы',
  UPLOAD_MESSAGE: 'Перетяните сюда файл',
  ERROR_UPLOAD: 'Не удалось загрузить файл',
  ERROR_ONLY_ONE_FILE: 'Можно загрузить только один файл'
};

class Documents extends BaseWidget {
  scrollPosition = {};

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
      isCollapsed: UserLocalSettingsService.getProperty(props.id, 'isCollapsed'),
      isOpenSettings: false,
      isSentSettingsToSave: false,
      isOpenUploadModal: false,
      isDragFiles: false,
      typesFilter: '',
      tableFilter: '',
      statusFilter: statusesKeys.ALL
    };
  }

  componentDidMount() {
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

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (prevProps.isUploadingFile && !this.props.isUploadingFile && (prevState.isOpenUploadModal || prevState.isDragFiles)) {
      this.uploadingComplete();
    }

    if (prevState.selectedType !== this.state.selectedType) {
      this.scrollPosition = {};
    }
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
    this.props.init();
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
    this.props.init();
  };

  handleToggleTypesSettings = event => {
    const { id, onSave, config, dynamicTypes } = this.props;
    const { isOpenSettings } = this.state;

    event.stopPropagation();
    this.setState({
      isOpenSettings: !isOpenSettings,
      typesFilter: ''
    });

    if (isOpenSettings) {
      onSave(id, {
        config: {
          ...config,
          types: DocumentsConverter.getTypesForConfig(dynamicTypes)
        }
      });
    }
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
    this.setState({
      isDragFiles: false,
      selectedType: type,
      statusFilter: statusesKeys.ALL,
      selectedTypeForLoading: selectedType
    });
    this.scrollPosition = {};
  };

  handleFilterTypes = (filter = '') => {
    this.setState({ typesFilter: filter.toLowerCase() });
  };

  handleToggleUploadModalByType = (type = null) => {
    if (type === null) {
      this.setState({
        electedTypeForLoading: null,
        isOpenUploadModal: false
      });

      return;
    }

    const formId = get(type, 'formId', null);

    if (formId !== null) {
      this.openForm(type);
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
    UserLocalSettingsService.setDashletHeight(this.props.id, height);
    this.setState({ userHeight: height });
  };

  handleCancelSettings = () => {
    this.setState({
      isOpenSettings: false,
      isSentSettingsToSave: false
    });
  };

  handleSaveSettings = settings => {
    const { availableTypes, onSave, id, config, onSaveSettings } = this.props;
    const selectedTypes = settings.map(item => {
      const type = availableTypes.find(type => type.id === item.id);

      return DocumentsConverter.getFormattedDynamicType({
        ...type,
        ...item
      });
    });
    const newConfig = {
      ...config,
      types: DocumentsConverter.getTypesForConfig(selectedTypes)
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

  handleDropRejected = () => {
    this.setState({ isDragFiles: false });
  };

  handleDragIn = event => {
    event.preventDefault();
    event.stopPropagation();

    this.setState({ isDragFiles: true });
  };

  handleDragOut = event => {
    event.preventDefault();
    event.stopPropagation();

    this.setState({ isDragFiles: false });
  };

  handleRowDrop = data => {
    const { files = [], type = {} } = data;

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

  handleRowDragEnter = () => {
    if (this.props.uploadError) {
      this.props.setError(errorTypes.UPLOAD, '');
    }

    if (this.props.countFilesError) {
      this.props.setError(errorTypes.COUNT_FILES, '');
    }
  };

  handleSubmitForm = () => {
    const { selectedTypeForLoading } = this.state;

    this.props.getDocuments(selectedTypeForLoading.type);
    this.uploadingComplete();
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

      this.props.setInlineTools({
        ...data,
        actions: actions[id]
      });
    }
  };

  handleSuccessRecordsAction = () => {
    this.props.getDocuments(this.state.selectedType);
    this.props.setInlineTools();
  };

  handleScollingTable = event => {
    this.scrollPosition = event;
  };

  openForm = (type, files = []) => {
    FormManager.createRecordByVariant(
      DocumentsConverter.getDataToCreate({
        formId: type.formId,
        type: type.type,
        record: this.props.record,
        files
      }),
      {
        onSubmit: this.handleSubmitForm
      }
    );
  };

  countFormatter = (...params) => {
    const { uploadError, countFilesError, id } = this.props;
    const { selectedTypeForLoading } = this.state;
    const target = prepareTooltipId(`grid-label-${params[1].type}-${id}`);
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

    return (
      <div className="ecos-docs__table-count-status">
        <div
          id={target}
          className={classNames('ecos-docs__table-upload-label', {
            'ecos-docs__table-upload-label_error': hasError
          })}
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
        <div className="ecos-docs__types">
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

        <ResizeBoxes className="ecos-docs__resizer" leftId={leftColumnId} rightId={rightColumnId} />
      </div>
    );
  }

  renderType = type => {
    const { selectedType } = this.state;

    return (
      <div
        key={type.type}
        onClick={() => this.handleSelectType(type)}
        className={classNames('ecos-docs__types-item', {
          'ecos-docs__types-item_selected': selectedType === type.type
        })}
      >
        <div className="ecos-docs__types-item-label" title={t(type.name)}>
          {t(type.name)}
        </div>
        {this.renderCountStatus(type)}
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
          {status}
        </UncontrolledTooltip>
      </>
    );
  };

  renderUploadButton() {
    const { dynamicTypes } = this.props;
    const { selectedType } = this.state;

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
        toggleClassName={classNames('ecos-docs__panel-upload', {
          'ecos-docs__panel-upload_not-available': !dynamicTypes.length
        })}
        valueField="type"
        titleField="name"
        source={dynamicTypes}
        onChange={this.handleToggleUploadModalByType}
      >
        <Icon className="icon-load ecos-docs__panel-upload-icon" />
      </Dropdown>
    );
  }

  renderTablePanel() {
    const { dynamicTypes } = this.props;
    const { statusFilter, selectedType } = this.state;

    return (
      <div className="ecos-docs__panel">
        {this.renderUploadButton()}
        <Search cleaner liveSearch searchWithEmpty onSearch={this.handleFilterTable} className="ecos-docs__panel-search" />
        {!selectedType && dynamicTypes.length > 1 && (
          <Dropdown
            className="ecos-docs__panel-filter"
            controlClassName="ecos-docs__panel-filter-control"
            valueField="key"
            titleField="value"
            value={statusFilter}
            source={typeStatusesByFields}
            onChange={this.handleChangeTypeFilter}
          />
        )}
      </div>
    );
  }

  renderInlineTools = () => {
    const { stateId } = this.props;

    return <InlineTools className="ecos-docs__table-inline-tools" stateId={stateId} reduxKey="documents" toolsKey="tools" />;
  };

  renderDocumentsTable() {
    const { dynamicTypes, isUploadingFile } = this.props;
    const { selectedType, isDragFiles } = this.state;

    if (!selectedType && dynamicTypes.length !== 1) {
      return null;
    }

    const columns = tableFields.DEFAULT.map(item => ({
      dataField: item.name,
      text: item.label
    }));
    const isShowDropZone = isDragFiles;

    return (
      <div style={{ height: '100%' }} onDragEnter={this.handleDragIn} onDragLeave={this.handleDragOut}>
        <Grid
          scrollable
          fixedHeader
          keyField="id"
          className={classNames('ecos-docs__table', {
            'ecos-docs__table_hidden': isShowDropZone || isUploadingFile
          })}
          data={this.tableData}
          columns={columns}
          onChangeTrOptions={this.handleHoverRow}
          onScrolling={this.handleScollingTable}
          inlineTools={this.renderInlineTools}
          scrollPosition={this.scrollPosition}
        />

        <DropZone
          withoutButton
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
  }

  renderTypesTable() {
    const { selectedType } = this.state;

    if (selectedType) {
      return null;
    }

    const columns = tableFields.ALL.map(item => {
      const { name, label, ...other } = item;
      const extended = {};

      if (name === 'count') {
        extended.formatter = this.countFormatter;
      }

      return {
        dataField: name,
        text: label,
        ...other,
        ...extended
      };
    });

    return (
      <Grid
        changeTrOptionsByRowClick
        className="ecos-docs__table"
        data={this.tableData}
        columns={columns}
        scrollable
        keyField="type"
        onRowClick={this.handleClickTableRow}
        onRowDrop={this.handleRowDrop}
        onRowDragEnter={this.handleRowDragEnter}
      />
    );
  }

  renderTableLoader() {
    const { isLoading, isLoadingTableData, isUploadingFile } = this.props;
    const { selectedType } = this.state;

    if ((!isLoading && isLoadingTableData) || (isUploadingFile && !selectedType)) {
      return <Loader zIndex={999} blur />;
    }

    return null;
  }

  renderTable() {
    const { rightColumnId } = this.state;

    return (
      <div id={rightColumnId} className="ecos-docs__column ecos-docs__column_table">
        {this.renderTablePanel()}
        {this.renderDocumentsTable()}
        {this.renderTypesTable()}
        {this.renderTableLoader()}
      </div>
    );
  }

  renderSettings() {
    const { isLoadingSettings } = this.props;
    const { isOpenSettings } = this.state;

    return (
      <Settings
        isOpen={isOpenSettings}
        label={t(Labels.SETTINGS)}
        isLoading={isLoadingSettings}
        types={this.availableTypes}
        onCancel={this.handleCancelSettings}
        onSave={this.handleSaveSettings}
      />
    );
  }

  renderUploadingModal() {
    const { isUploadingFile } = this.props;
    const { selectedTypeForLoading, isOpenUploadModal } = this.state;

    return (
      <EcosModal
        title={get(selectedTypeForLoading, 'name', '')}
        isOpen={isOpenUploadModal}
        className="ecos-docs__modal-upload"
        hideModal={this.handleToggleUploadModalByType.bind(this, null)}
      >
        <DropZone onSelect={this.handleSelectUploadFiles} isLoading={isUploadingFile} {...this.uploadingSettings} />
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

  render() {
    const { dragHandleProps, canDragging } = this.props;
    const { isCollapsed, contentHeight, fitHeights, userHeight } = this.state;

    return (
      <div>
        <Dashlet
          className="ecos-docs"
          title={this.widgetTitle}
          needGoTo={false}
          actionConfig={this.dashletActionsConfig}
          canDragging={canDragging}
          resizable
          contentMaxHeight={this.clientHeight}
          onResize={this.handleResize}
          dragHandleProps={dragHandleProps}
          onChangeHeight={this.handleChangeHeight}
          getFitHeights={this.setFitHeights}
          onToggleCollapse={this.handleToggleContent}
          isCollapsed={isCollapsed}
        >
          <Scrollbars
            style={{ height: contentHeight || '100%' }}
            renderTrackVertical={props => <div {...props} className="ecos-current-task-list__v-scroll" />}
          >
            <DefineHeight
              className="ecos-docs__container"
              fixHeight={userHeight}
              maxHeight={fitHeights.max}
              minHeight={1}
              getOptimalHeight={this.setContentHeight}
            >
              <div className="ecos-docs__body" ref={this.contentRef}>
                {this.renderTypes()}
                {this.renderTable()}
                {this.renderSettings()}
                {this.renderUploadingModal()}
                {this.renderLoader()}
              </div>
            </DefineHeight>
          </Scrollbars>
        </Dashlet>
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => ({
  ...selectStateByKey(state, ownProps.record),
  isMobile: state.view.isMobile
});
const mapDispatchToProps = (dispatch, ownProps) => ({
  init: () => dispatch(init({ record: ownProps.record, config: ownProps.config })),
  getDocuments: (type = '') => dispatch(getDocumentsByType({ record: ownProps.record, type })),
  onSaveSettings: (types, config) => dispatch(saveSettings({ record: ownProps.record, types, config })),
  onUploadFiles: data => dispatch(uploadFiles({ record: ownProps.record, ...data })),
  setError: (type, message = '') => dispatch(setError({ record: ownProps.record, type, message })),
  execRecordsAction: (records, action, callback) => dispatch(execRecordsAction({ record: ownProps.record, records, action, callback })),
  setInlineTools: tools => dispatch(setInlineTools({ record: ownProps.record, tools }))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Documents);
