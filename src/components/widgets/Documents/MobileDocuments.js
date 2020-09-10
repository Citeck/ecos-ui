import React from 'react';
import isEmpty from 'lodash/isEmpty';
import get from 'lodash/get';

import BaseWidget from '../BaseWidget';
import Dashlet from '../../Dashlet';
import { connect } from 'react-redux';
import {
  selectAvailableTypes,
  selectDocumentsByTypes,
  selectDynamicTypes,
  selectStateByKey,
  selectStateId,
  selectWidgetTitle
} from '../../../selectors/documents';
import { getStateId } from '../../../helpers/redux';
import Panel from './Panel';
import Base from './Base';
import { execRecordsAction, getDocumentsByTypes, initStore, uploadFiles } from '../../../actions/documents';
import TypeItem from './TypeItem';
import DocumentItem from './DocumentItem';
import { documentFields } from '../../../constants/documents';

class MobileDocuments extends Base {
  componentDidUpdate(prevProps, prevState) {
    super.componentDidUpdate(prevProps, prevState);

    if (!prevProps.stateId && this.props.stateId) {
      this.props.getDocumentsByTypes();
    }
  }

  handleClickAction = (record, action) => {
    this.props.execRecordsAction(record, action /*, this.handleSuccessRecordsAction*/);
  };

  renderPanel() {
    const { dynamicTypes } = this.props;
    const { selectedType, statusFilter, typesStatuses, tableFilter } = this.state;

    return (
      <Panel
        isMobile
        dynamicTypes={dynamicTypes}
        selectedType={selectedType}
        statusFilter={statusFilter}
        typesStatuses={typesStatuses}
        tableFilter={tableFilter}
        renderUploadButton={this.renderUploadButton}
        onSearch={this.handleFilterTable}
        onChangeFilter={this.handleChangeTypeFilter}
        forwardedRef={this._tablePanel}
        // scrollbarHeightMax={this.tableHeight}
      />
    );
  }

  renderTypes() {
    const { dynamicTypes, documentsByTypes } = this.props;

    if (isEmpty(dynamicTypes)) {
      return null;
    }

    return dynamicTypes.map(item => (
      <TypeItem key={item.type} type={item} onUpload={this.handleToggleUploadModalByType}>
        {get(documentsByTypes, [item.type, 'documents'], []).map(document => (
          <DocumentItem key={document[documentFields.id]} {...document} onClick={this.handleClickAction} />
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

// selectWidgetTitle
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(MobileDocuments);
