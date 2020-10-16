import React from 'react';
import isEmpty from 'lodash/isEmpty';
import get from 'lodash/get';
import set from 'lodash/set';
import debounce from 'lodash/debounce';
import cloneDeep from 'lodash/cloneDeep';
import { connect } from 'react-redux';

import Dashlet from '../../Dashlet';
import { selectFilteredTypes, selectMobileStateByKey } from '../../../selectors/documents';
import { getStateId } from '../../../helpers/redux';
import Panel from './parts/Panel';
import BaseDocuments from './_BaseDocuments';
import { execRecordsAction, getDocumentsByTypes, getTypeSettings, initStore, saveSettings, uploadFiles } from '../../../actions/documents';
import TypeItem from './parts/TypeItem';
import DocumentItem from './parts/DocumentItem';
import { FileStatuses } from '../../../helpers/ecosXhr';
import { ActionTypes } from '../../Records/actions';
import { t } from '../../../helpers/export/util';
import { documentFields, Labels } from '../../../constants/documents';

class MobileDocuments extends BaseDocuments {
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
    if (prevProps.isUploadingFile && !this.props.isUploadingFile && (prevState.isOpenUploadModal || prevState.isDragFiles)) {
      this.uploadingComplete();
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

  handleClickAction = (record, data) => {
    if (!record) {
      return;
    }

    this.setState({ actionInProgress: true });

    const action = cloneDeep(data);

    if (action.type === ActionTypes.DELETE) {
      set(action, 'config.withoutConfirm', true);
    }

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

    if (isEmpty(dynamicTypes)) {
      return null;
    }

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
      />
    );
  }

  renderTypes() {
    const { documentsByTypes, isUploadingFile, isLoading } = this.props;
    const { isLoadingUploadingModal, uploadPercent, selectedTypeForLoading } = this.state;
    const { typeFilter, statusFilter } = this.state;

    if (isEmpty(this.filteredDynamicTypes)) {
      if (!isLoading && (typeFilter || statusFilter)) {
        return <div className="ecos-docs-m__panel">{t(Labels.NOTHING_FOUND)}</div>;
      }

      return null;
    }

    return this.filteredDynamicTypes.map(item => (
      <TypeItem
        key={item.type}
        type={item}
        canUploaded={!isUploadingFile}
        onUpload={this.handleToggleUploadModalByType}
        tooltip={this.renderCountStatus(item, 'type')}
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
        {this.renderSettings()}
        {this.renderEmptyStub('ecos-docs-m__empty')}
        {this.renderLoader()}
      </Dashlet>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const baseParams = [state, getStateId(ownProps)];
  const ownState = selectMobileStateByKey(...baseParams);

  return {
    ...ownState,
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
    onUploadFiles: data => dispatch(uploadFiles({ ...baseParams, ...data })),
    onSaveSettings: (types, config) => dispatch(saveSettings({ ...baseParams, types, config })),
    getTypeSettings: type => dispatch(getTypeSettings({ ...baseParams, type }))
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(MobileDocuments);
