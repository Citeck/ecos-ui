import React from 'react';
import isEmpty from 'lodash/isEmpty';
import get from 'lodash/get';
import debounce from 'lodash/debounce';

import Dashlet from '../../Dashlet';
import { connect } from 'react-redux';
import {
  selectAvailableTypes,
  selectDocumentsByTypes,
  selectDynamicTypes,
  selectFilteredTypes,
  selectStateId,
  selectUploadingFileStatus,
  selectWidgetTitle
} from '../../../selectors/documents';
import { getStateId } from '../../../helpers/redux';
import Panel from './Panel';
import Base from './Base';
import { execRecordsAction, getDocumentsByTypes, initStore, uploadFiles } from '../../../actions/documents';
import TypeItem from './TypeItem';
import DocumentItem from './DocumentItem';
import { documentFields } from '../../../constants/documents';
import { FileStatuses } from '../../../helpers/ecosXhr';

class MobileDocuments extends Base {
  constructor(props) {
    super(props);

    this.state = {
      ...this.state,
      actionInProgress: false,
      uploadPercent: null,
      typeFilter: ''
    };
  }

  componentDidUpdate(prevProps, prevState) {
    // super.componentDidUpdate(prevProps, prevState);

    if (prevProps.isUploadingFile && !this.props.isUploadingFile && (prevState.isOpenUploadModal || prevState.isDragFiles)) {
      this.uploadingComplete();
      // this.props.getDocumentsByTypes();
    }

    if (!prevProps.stateId && this.props.stateId) {
      this.props.getDocumentsByTypes();
    }

    if (prevState.actionInProgress && !this.state.actionInProgress) {
      this.props.getDocumentsByTypes();
    }

    if (prevState.uploadPercent !== 100 && this.state.uploadPercent === 100) {
      this.clearUploadStatus();
    }
  }

  componentWillUnmount() {
    super.componentWillUnmount();
    this.clearUploadStatus.cancel();
  }

  get filteredDynamicTypes() {
    const { dynamicTypes } = this.props;
    const { typeFilter, statusFilter } = this.state;
    const text = typeFilter.trim().toLowerCase();

    return selectFilteredTypes(dynamicTypes, text, statusFilter);
  }

  clearUploadStatus = debounce(() => {
    this.setState({
      selectedTypeForLoading: '',
      uploadPercent: null
    });
  }, 500);

  updateUploadStatus = data => {
    const { uploadPercent } = this.state;
    let percent = data.percent;

    switch (data.status) {
      case FileStatuses.UPLOADING:
        percent = percent === 100 ? uploadPercent : percent;
        break;
      case FileStatuses.HEADERS_RECEIVED:
        percent = percent === 100 ? uploadPercent : percent;
        break;
      case FileStatuses.DONE:
        percent = 100;
        break;
      default:
        percent = data.percent;
    }

    this.setState({ uploadPercent: percent });
  };

  handleEndAction = () => {
    this.setState({ actionInProgress: false });
  };

  handleClickAction = (record, action) => {
    if (!record) {
      return;
    }

    this.setState({ actionInProgress: true });

    this.props.execRecordsAction(record, action, this.handleEndAction);
  };

  handleSelectUploadFiles = files => {
    const { selectedTypeForLoading } = this.state;

    this.setState({ isOpenUploadModal: false });

    if (this.getformId(selectedTypeForLoading)) {
      this.props.onUploadFiles({
        files,
        type: get(selectedTypeForLoading, 'type'),
        openForm: this.openForm,
        callback: this.updateUploadStatus
      });

      return;
    }

    this.props.onUploadFiles({
      files,
      type: get(selectedTypeForLoading, 'type'),
      callback: this.updateUploadStatus
    });
  };

  handleFilterTypes = typeFilter => {
    this.setState({ typeFilter });
  };

  renderPanel() {
    const { dynamicTypes } = this.props;
    const { selectedType, statusFilter, typesStatuses, typeFilter } = this.state;

    return (
      <Panel
        isMobile
        dynamicTypes={dynamicTypes}
        selectedType={selectedType}
        statusFilter={statusFilter}
        typesStatuses={typesStatuses}
        searchText={typeFilter}
        renderUploadButton={this.renderUploadButton}
        onSearch={this.handleFilterTypes}
        onChangeFilter={this.handleChangeTypeFilter}
        forwardedRef={this._tablePanel}
        // scrollbarHeightMax={this.tableHeight}
      />
    );
  }

  renderTypes() {
    const { documentsByTypes, isUploadingFile } = this.props;
    const { isLoadingUploadingModal, uploadPercent, selectedTypeForLoading } = this.state;

    if (isEmpty(this.filteredDynamicTypes)) {
      return null;
    }

    return this.filteredDynamicTypes.map(item => (
      <TypeItem
        key={item.type}
        type={item}
        canUploaded={!isUploadingFile}
        onUpload={this.handleToggleUploadModalByType}
        uploadPercent={get(selectedTypeForLoading, 'type') === item.type ? uploadPercent : null}
      >
        {get(documentsByTypes, [item.type, 'documents'], []).map(document => (
          <DocumentItem
            canUploaded={!isLoadingUploadingModal}
            key={document[documentFields.id]}
            {...document}
            onClickAction={this.handleClickAction}
          />
        ))}
      </TypeItem>
    ));
  }

  render() {
    const { dragHandleProps, canDragging, widgetTitle } = this.props;
    const { isCollapsed } = this.state;

    return (
      <Dashlet
        className="ecos-docs ecos-docs_mobile"
        title={widgetTitle}
        needGoTo={false}
        canDragging={canDragging}
        resizable
        // contentMaxHeight={this.calculatedClientHeight}
        onResize={this.handleResize}
        dragHandleProps={dragHandleProps}
        onChangeHeight={this.handleChangeHeight}
        getFitHeights={this.setFitHeights}
        onToggleCollapse={this.handleToggleContent}
        isCollapsed={isCollapsed}
        setRef={this.setDashletRef}
      >
        {this.renderPanel()}
        {this.renderTypes()}
        {this.renderUploadingModal()}
      </Dashlet>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const baseParams = [state, getStateId(ownProps)];

  return {
    stateId: selectStateId(...baseParams),
    widgetTitle: selectWidgetTitle(...baseParams),
    dynamicTypes: selectDynamicTypes(...baseParams),
    documentsByTypes: selectDocumentsByTypes(...baseParams),
    availableTypes: selectAvailableTypes(...baseParams),
    isUploadingFile: selectUploadingFileStatus(...baseParams),
    isMobile: state.view.isMobile
  };
};

const mapDispatchToProps = (dispatch, ownProps) => {
  const baseParams = {
    record: ownProps.record,
    key: getStateId(ownProps)
  };

  return {
    initStore: () => dispatch(initStore({ ...baseParams, config: ownProps.config })),
    getDocumentsByTypes: () => dispatch(getDocumentsByTypes({ ...baseParams })),
    execRecordsAction: (records, action, callback) => dispatch(execRecordsAction({ ...baseParams, records, action, callback })),
    onUploadFiles: data => dispatch(uploadFiles({ ...baseParams, ...data }))
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(MobileDocuments);
