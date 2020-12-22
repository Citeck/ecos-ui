import React, { useMemo } from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';

import { BPMNDesignerService } from '../../services/BPMNDesignerService';
import { Grid } from '../common/grid';

const ViewTable = ({ hidden, models, searchText }) => {
  const columns = useMemo(() => BPMNDesignerService.getColumns(), [models]);
  const data = useMemo(() => {
    if (searchText) {
      return BPMNDesignerService.filterModels({ models, searchText });
    }
    return models;
  }, [models, searchText]);

  return (
    <div className={classNames('bpmn-designer-view-table common-container_white h-100', { 'd-none': hidden })}>
      <Grid data={data} columns={columns} scrollable fixedHeader autoHeight byContentHeight />
    </div>
  );
};

const mapStateToProps = state => ({
  models: state.bpmn.models,
  searchText: state.bpmn.searchText,
  isMobile: state.view.isMobile
});

const mapDispatchToProps = dispatch => ({});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ViewTable);
