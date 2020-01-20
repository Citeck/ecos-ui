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
import { Grid } from '../../common/grid';
import { Dropdown } from '../../common/form';
import FormManager from '../../EcosForm/FormManager';
import DropZone from './DropZone';
import Settings from './Settings';

import { t, prepareTooltipId, deepClone } from '../../../helpers/util';
import UserLocalSettingsService from '../../../services/userLocalSettings';
import { getDocumentsByType, init, toggleType, saveSettings, uploadFiles } from '../../../actions/documents';
import { selectStateByKey } from '../../../selectors/documents';
import { statusesKeys, typesStatuses, tooltips, typeStatusesByFields, tableFields } from '../../../constants/documents';
import { MIN_WIDTH_DASHLET_SMALL } from '../../../constants';
import DocumentsConverter from '../../../dto/documents';

import './style.scss';

const LABELS = {
  TITLE: 'Документы',
  SETTINGS: 'Настройка типов документов'
};

class Documents extends BaseWidget {
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
      typesFilter: '',
      tableFilter: '',
      statusFilter: statusesKeys.ALL
    };

    this.initWidget();
  }

  static getDerivedStateFromProps(props, state) {
    const newState = {};

    if (!props.dynamicTypes.find(item => item.type === state.selectedType)) {
      newState.selectedType = '';
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

  get widgetTitle() {
    const { dynamicTypes } = this.props;

    if (dynamicTypes.length === 1) {
      return dynamicTypes[0].name;
    }

    return t(LABELS.TITLE);
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

  getTypeStatus = type => {
    let status = statusesKeys.CAN_ADD_FILES;

    if (type.countDocuments === 1) {
      status = statusesKeys.FILE_ADDED;
    }

    if (type.countDocuments > 1) {
      status = statusesKeys.MULTI_FILES_ADDED;
    }

    if (type.mandatory && !type.countDocuments) {
      status = statusesKeys.NEED_ADD_FILES;
    }

    return status;
  };

  initWidget = () => {
    this.props.init(this.props.config);
  };

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
  };

  handleSelectType = selectedType => {
    if (selectedType === this.state.selectedType) {
      return;
    }

    this.props.getDocuments(selectedType);
    this.setState({ selectedType, statusFilter: statusesKeys.ALL });
  };

  handleToggleSelectType = ({ id, checked }) => {
    this.props.onToggleType(id, checked);
  };

  handleFilterTypes = (filter = '') => {
    this.setState({ typesFilter: filter.toLowerCase() });
  };

  handleToggleUploadModalByType = (type = null) => {
    // todo: remove after test
    this.setState(state => ({
      selectedTypeForLoading: type,
      isOpenUploadModal: !state.isOpenUploadModal
    }));

    return;

    if (type !== null) {
      FormManager.createRecordByVariant(
        DocumentsConverter.getDataToCreate({
          formId: type.formId,
          type: type.type,
          record: this.props.record
        })
      );
    }

    this.setState({
      selectedTypeForLoading: type,
      isOpenUploadModal: type === null
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

    this.handleSelectType(row.type);
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
    const selectedTypes = settings.map(item => DocumentsConverter.getFormattedDynamicType(availableTypes.find(type => type.id === item)));

    onSave(id, {
      config: {
        ...config,
        types: DocumentsConverter.getTypesForConfig(selectedTypes)
      }
    });
    onSaveSettings(selectedTypes);
    this.setState({ isSentSettingsToSave: true });
  };

  handleSelectUploadFiles = files => {
    const { selectedTypeForLoading } = this.state;

    this.props.onUploadFiles(files, selectedTypeForLoading);
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

        <ResizeBoxes className="ecos-timesheet__resizer" leftId={leftColumnId} rightId={rightColumnId} />
      </div>
    );
  }

  renderType = type => {
    const { id } = this.props;
    const { selectedType } = this.state;
    const target = prepareTooltipId(`${type.type}-${id}`);
    const status = typesStatuses[this.getTypeStatus(type)];

    return (
      <div
        key={type.type}
        onClick={() => this.handleSelectType(type.type)}
        className={classNames('ecos-docs__types-item', {
          'ecos-docs__types-item_selected': selectedType === type.type
        })}
      >
        <div className="ecos-docs__types-item-label">{t(type.name)}</div>
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
      </div>
    );
  };

  renderUploadButton() {
    const { dynamicTypes } = this.props;
    const { selectedType } = this.state;

    if (selectedType || dynamicTypes.length === 1) {
      const type = dynamicTypes.find(item => item.type === selectedType) || dynamicTypes[0];

      return (
        <div className="ecos-docs__panel-upload" onClick={this.handleToggleUploadModalByType.bind(this, type)}>
          <Icon className="icon-load ecos-docs__panel-upload-icon" />
        </div>
      );
    }

    return (
      <Dropdown
        isStatic
        toggleClassName="ecos-docs__panel-upload"
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

  renderTable() {
    const { dynamicTypes } = this.props;
    const { selectedType, rightColumnId } = this.state;
    let columns = tableFields.ALL.map(item => ({
      dataField: item.name,
      text: item.label
    }));

    if (selectedType || dynamicTypes.length === 1) {
      columns = tableFields.DEFAULT.map(item => ({
        dataField: item.name,
        text: item.label
      }));
    }

    return (
      <div id={rightColumnId} className="ecos-docs__column ecos-docs__column_table">
        {this.renderTablePanel()}
        <Grid
          className="ecos-docs__table"
          data={this.tableData}
          columns={columns}
          onRowClick={this.handleClickTableRow}
          scrollable
          keyField="type"
        />
      </div>
    );
  }

  renderSettings() {
    const { isLoadingSettings } = this.props;
    const { isOpenSettings } = this.state;

    return (
      <Settings
        isOpen={isOpenSettings}
        label={t(LABELS.SETTINGS)}
        isLoading={isLoadingSettings}
        types={this.availableTypes}
        onCancel={this.handleCancelSettings}
        onSave={this.handleSaveSettings}
      />
    );
  }

  renderUploadingModal() {
    const {} = this.props;
    const { selectedTypeForLoading, isOpenUploadModal } = this.state;

    return (
      <EcosModal
        title={get(selectedTypeForLoading, 'name', '')}
        isOpen={isOpenUploadModal}
        className="ecos-docs__modal-upload"
        hideModal={this.handleToggleUploadModalByType.bind(this, null)}
      >
        <DropZone onSelect={this.handleSelectUploadFiles} multiple />
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
  init: config => dispatch(init({ record: ownProps.record, config })),
  getDocuments: type => dispatch(getDocumentsByType({ record: ownProps.record, type })),
  onToggleType: (id, checked) => dispatch(toggleType({ record: ownProps.record, id, checked })),
  onSaveSettings: types => dispatch(saveSettings({ record: ownProps.record, types })),
  onUploadFiles: (files, type) => dispatch(uploadFiles({ record: ownProps.record, files, type }))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Documents);
