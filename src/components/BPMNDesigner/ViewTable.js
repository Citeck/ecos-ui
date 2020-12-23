import React, { useMemo, useRef, useState } from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';

import { BPMNDesignerService } from '../../services/BPMNDesignerService';
import { Grid } from '../common/grid';

const ViewTable = ({ hidden, models, searchText }) => {
  const tableCont = useRef(null);
  const [topHeight, setTopHeight] = useState(500);
  const columns = useMemo(() => BPMNDesignerService.getColumns(), [models]);
  const data = useMemo(() => {
    if (searchText) {
      return BPMNDesignerService.filterModels({ models, searchText });
    }
    return models;
  }, [models, searchText]);

  // useEffect(() => {
  //   if(tableCont.current) {
  //     const params = tableCont.current.getBoundingClientRect();
  //     setTopHeight(params.y);
  //   }
  // }, [tableCont]);

  return (
    <div ref={tableCont} className={classNames('bpmn-designer-view-table common-container_white', { 'd-none': hidden })}>
      <Grid data={data} columns={columns} scrollable autoHeight maxHeight={`calc(100vh - ${topHeight}px)`} />
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
