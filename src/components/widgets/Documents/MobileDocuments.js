import React from 'react';

import BaseWidget from '../BaseWidget';
import Dashlet from '../../Dashlet';
import { connect } from 'react-redux';
import { selectDynamicTypes, selectStateByKey, selectWidgetTitle } from '../../../selectors/documents';
import { getStateId } from '../../../helpers/redux';
import Panel from './Panel';
import Base from './Base';
import { initStore } from '../../../actions/documents';

class MobileDocuments extends Base {
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
      </Dashlet>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const baseParams = [state, getStateId(ownProps)];

  return {
    widgetTitle: selectWidgetTitle(...baseParams),
    dynamicTypes: selectDynamicTypes(...baseParams),
    isMobile: state.view.isMobile
  };
};

const mapDispatchToProps = (dispatch, ownProps) => {
  const baseParams = {
    record: ownProps.record,
    key: getStateId(ownProps)
  };

  return {
    initStore: () => dispatch(initStore({ ...baseParams, config: ownProps.config }))
  };
};

// selectWidgetTitle
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(MobileDocuments);
