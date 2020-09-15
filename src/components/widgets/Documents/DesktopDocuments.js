import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classNames from 'classnames';
import { UncontrolledTooltip } from 'reactstrap';
import uniqueId from 'lodash/uniqueId';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import debounce from 'lodash/debounce';
import { Scrollbars } from 'react-custom-scrollbars';

import Dashlet from '../../Dashlet';
import { Loader, ResizeBoxes, Tooltip } from '../../common';
import { Grid, InlineTools } from '../../common/grid';
import DropZone from './parts/DropZone';
import DocumentsConverter from '../../../dto/documents';
import {
  execRecordsAction,
  getDocumentsByType,
  getTypeSettings,
  initStore,
  saveSettings,
  setError,
  setInlineTools,
  uploadFiles
} from '../../../actions/documents';
import { selectStateByKey } from '../../../selectors/documents';
import { documentFields, errorTypes, statusesKeys, tableFields, typeStatusesByFields } from '../../../constants/documents';
import { closest, deepClone, prepareTooltipId, t } from '../../../helpers/util';
import { getStateId } from '../../../helpers/redux';
import Panel from './parts/Panel';
import TypesTable from './parts/TypesTable';
import BaseDocuments from './_BaseDocuments';
import { Labels } from '../../../constants/documents';
import { AvailableTypeInterface, DocumentInterface, DynamicTypeInterface, GrouppedTypeInterface } from './propsInterfaces';

class DesktopDocuments extends BaseDocuments {
  scrollPosition = {};

  static propTypes = {
    ...super.propTypes,
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
    maxHeightByContent: false,
    dragHandleProps: {}
  };

  constructor(props) {
    super(props);

    this.state = {
      ...this.state,
      leftColumnId: uniqueId('leftColumn_'),
      rightColumnId: uniqueId('rightColumn_'),
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
      typesStatuses: typeStatusesByFields.map(type => ({
        ...type,
        value: t(type.value)
      })),
      isLoadingUploadingModal: true,
      isHoverLastRow: false,
      needRefreshGrid: false
    };

    this._tablePanel = React.createRef();
    this._tableRef = React.createRef();
    this._typesList = React.createRef();
    this._emptyStubRef = React.createRef();
    this._counterRef = React.createRef();
  }

  componentDidUpdate(prevProps, prevState) {
    super.componentDidUpdate(prevProps, prevState);

    if (prevProps.isUploadingFile && !this.props.isUploadingFile && (prevState.isOpenUploadModal || prevState.isDragFiles)) {
      this.uploadingComplete();
    }

    if (prevState.selectedType !== this.state.selectedType) {
      this.scrollPosition = {};
      this.setContentHeight(this.calculatedClientHeight);
    }

    if (prevState.selectedType !== this.state.selectedType) {
      this.refreshGrid();
    }
  }

  componentWillUnmount() {
    super.componentWillUnmount();
    this.handleRowMouseLeave.cancel();
  }

  get contentWidth() {
    return get(this.contentRef, 'current.offsetWidth', 0);
  }

  get tablePanelHeight() {
    return get(this._tablePanel, 'current.offsetHeight', 0);
  }

  get tableHeight() {
    return get(this._tableRef, 'current.offsetHeight', 0);
  }

  get tableWidth() {
    const tableWrapper = document.querySelector(`#${this.state.leftColumnId}`);

    return `calc(${this.contentWidth}px - ${get(tableWrapper, 'offsetWidth', 0)}px)`;
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

  get calculatedTableMinHeight() {
    const { userHeight } = this.state;

    return userHeight !== undefined ? userHeight - this.tablePanelHeight : this.tableHeight;
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

  get documentTableColumns() {
    const { dynamicTypes } = this.props;
    const { selectedType } = this.state;
    const type = dynamicTypes.find(item => item.type === selectedType);
    const columns = get(type, 'columns', []);

    if (isEmpty(columns)) {
      return [];
    }

    return columns;
  }

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

  refreshGrid() {
    this.setState({ needRefreshGrid: true }, () => this.setState({ needRefreshGrid: false }));
  }

  handleReloadData = () => {
    this.props.initStore();
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

    this.getDocumentsByType(type);
    this.setState(state => ({
      isDragFiles: false,
      selectedType: type,
      statusFilter: statusesKeys.ALL,
      selectedTypeForLoading: selectedType
    }));
    this.scrollPosition = {};
  };

  getDocumentsByType = debounce(
    type => {
      this.props.getDocuments(type);
    },
    350,
    { leading: true, trailing: true }
  );

  handleClickTableRow = row => {
    if (this.state.selectedType) {
      return;
    }

    this.handleSelectType(row);
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

    if (!type.canDropUpload) {
      return false;
    }

    if (!type.multiple && files.length > 1) {
      this.setState({ selectedTypeForLoading: type });

      this.props.setError(errorTypes.COUNT_FILES, t(Labels.ERROR_ONLY_ONE_FILE));

      return false;
    }

    if (this.getformId(type)) {
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

  handleMouseLeaveTable = () => {
    this.setToolsOptions();
    this.setState({ isHoverLastRow: false });
  };

  handleHoverRow = data => {
    const options = deepClone(data);
    let actions = deepClone(this.props.actions);
    const id = options.row[documentFields.id];

    delete options.row;

    if (actions[id]) {
      actions[id].forEach(action => {
        action.onClick = () => {
          this.props.execRecordsAction(id, action, this.handleSuccessRecordsAction);
        };
      });

      this.setToolsOptions({
        ...data,
        actions: actions[id]
      });
    }
  };

  handleScrollingTable = event => {
    this.scrollPosition = event;
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
  }, 100);

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

  handleCheckDropPermissions = type => get(type, 'canDropUpload', false);

  setToolsOptions = (options = {}) => {
    this.props.setInlineTools(options);
  };

  countFormatter = (...params) => {
    const { uploadError, countFilesError, id } = this.props;
    const { selectedTypeForLoading } = this.state;
    const type = params[1];
    const target = prepareTooltipId(`grid-label-${type.type}-${id}`);
    const style = {};
    let label = t(Labels.UPLOAD_MESSAGE);
    let hasTooltip = false;
    let hasError = false;

    if (type.type === selectedTypeForLoading.type) {
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

    if (!type.canDropUpload) {
      label = t('documents-widget.dnd.disabled');
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
          className="ecos-docs__scroll ecos-docs__scroll_only-v"
          renderTrackVertical={props => <div {...props} className="ecos-grid__v-scroll" />}
          {...this.scrollbarProps}
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
    const id = prepareTooltipId(`type-${this.props.stateId}-${item.type}`);

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
          <Panel
            dynamicTypes={dynamicTypes}
            selectedType={selectedType}
            statusFilter={statusFilter}
            typesStatuses={typesStatuses}
            searchText={tableFilter}
            renderUploadButton={this.renderUploadButton}
            onSearch={this.handleFilterTable}
            onChangeFilter={this.handleChangeTypeFilter}
            forwardedRef={this._tablePanel}
            scrollbarHeightMax={this.tableHeight}
          />
        </Scrollbars>
      );
    }

    return (
      <Panel
        dynamicTypes={dynamicTypes}
        selectedType={selectedType}
        statusFilter={statusFilter}
        typesStatuses={typesStatuses}
        contentHeight={contentHeight}
        tableFilter={tableFilter}
        renderUploadButton={this.renderUploadButton}
        onSearch={this.handleFilterTable}
        onChangeFilter={this.handleChangeTypeFilter}
        forwardedRef={this._tablePanel}
        scrollbarHeightMax={this.tableHeight}
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
    const { dynamicTypes, isUploadingFile, isLoadingTableData } = this.props;
    const { selectedType, isDragFiles, autoHide, isHoverLastRow, needRefreshGrid } = this.state;
    const { formRef } = this.getFormCreateVariants(selectedType);

    if (
      (!selectedType && dynamicTypes.length !== 1) ||
      needRefreshGrid ||
      isLoadingTableData // This is necessary to remove twitching and artifacts of old data when switching type
    ) {
      return null;
    }

    const isShowDropZone = isDragFiles && !formRef;

    return (
      <div
        className="ecos-docs__table-container"
        style={{ maxWidth: this.tableWidth }}
        onDragEnter={this.handleDragIn}
        onDragLeave={this.handleDragOut}
      >
        <Grid
          scrollable
          sortable={false}
          fixedHeader
          scrollAutoHide={autoHide}
          forwardedRef={this._tableRef}
          autoHeight
          maxHeight={this.tableMaxHeight}
          keyField={documentFields.id}
          className={classNames('ecos-docs__table ecos-docs__table_documents', {
            'ecos-docs__table_hidden': isShowDropZone || isUploadingFile,
            'ecos-docs__table_without-after-element': isHoverLastRow
          })}
          data={this.tableData}
          columns={this.documentTableColumns}
          onChangeTrOptions={this.handleHoverRow}
          onScrolling={this.handleScrollingTable}
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
        <TypesTable
          dynamicTypes={dynamicTypes}
          selectedType={selectedType}
          autoHide={autoHide}
          isHoverLastRow={isHoverLastRow}
          forwardedRef={this._tableRef}
          scrollPosition={this.scrollPosition}
          tableData={this.tableData}
          countFormatter={this.countFormatter}
          minWidth={this.tableWidth}
          onScrolling={this.handleScollingTable}
          onRowClick={this.handleClickTableRow}
          onRowDrop={this.handleRowDrop}
          onRowDragEnter={this.handleRowDragEnter}
          onMouseEnter={this.handleTypeRowMouseEnter}
          onRowMouseLeave={this.handleTypeRowMouseLeave}
          onCheckDropPermission={this.handleCheckDropPermissions}
          maxHeight={this.tableMaxHeight}
        />
        {this.renderTableLoader()}
      </div>
    );
  }

  render() {
    const { dragHandleProps, canDragging } = this.props;
    const { isCollapsed } = this.state;

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
          setRef={this.setDashletRef}
        >
          <div className="ecos-docs__container">
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
          </div>
        </Dashlet>
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => ({
  ...selectStateByKey(state, getStateId(ownProps)),
  isMobile: state.view.isMobile
});
const mapDispatchToProps = (dispatch, ownProps) => {
  const baseParams = {
    record: ownProps.record,
    key: getStateId(ownProps)
  };

  return {
    initStore: () => dispatch(initStore({ ...baseParams, config: ownProps.config })),
    getDocuments: (type = '') => dispatch(getDocumentsByType({ ...baseParams, type })),
    onSaveSettings: (types, config) => dispatch(saveSettings({ ...baseParams, types, config })),
    onUploadFiles: data => dispatch(uploadFiles({ ...baseParams, ...data })),
    setError: (type, message = '') => dispatch(setError({ ...baseParams, type, message })),
    execRecordsAction: (records, action, callback) => dispatch(execRecordsAction({ ...baseParams, records, action, callback })),
    setInlineTools: tools => dispatch(setInlineTools({ ...baseParams, tools })),
    getTypeSettings: type => dispatch(getTypeSettings({ ...baseParams, type }))
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(DesktopDocuments);
