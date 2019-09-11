import React, { Component, Fragment } from 'react';
import connect from 'react-redux/es/connect/connect';
import { Well } from '../../common/form';
import JournalsDashletGrid from '../JournalsDashletGrid';
import JournalsPreview from '../JournalsPreview';
import JournalsUrlManager from '../JournalsUrlManager';
import Columns from '../../common/templates/Columns/Columns';
import { initPreview } from '../../../actions/journals';
import { wrapArgs } from '../../../helpers/redux';

import './JournalsContent.scss';

const mapDispatchToProps = (dispatch, props) => {
  const w = wrapArgs(props.stateId);

  return {
    initPreview: nodeRef => dispatch(initPreview(w(nodeRef)))
  };
};

const Grid = ({ stateId, showPreview, onRowClick, height }) => (
  <Well className={'ecos-grid_overflow_hidden'}>
    <JournalsDashletGrid
      stateId={stateId}
      onRowClick={onRowClick}
      doInlineToolsOnRowClick={showPreview}
      className={'ecos-grid_no-top-border'}
      toolsClassName={'grid-tools_r_12'}
      doNotCount
      minHeight={height}
    />
  </Well>
);

const Preview = ({ stateId }) => (
  <Well className={'ecos-well_full ecos-journals-content__preview-well'}>
    <JournalsPreview stateId={stateId} />
  </Well>
);

const Pie = () => (
  <Fragment>
    <div>{'showPie'}</div>
  </Fragment>
);

class JournalsContent extends Component {
  onRowClick = row => {
    this.props.initPreview(row.id);
  };

  render() {
    let { stateId, showPreview, showPie, height } = this.props;

    let cols = [<Grid stateId={stateId} showPreview={showPreview} onRowClick={this.onRowClick} height={height} />];
    if (showPreview)
      cols = [
        <Grid stateId={stateId} showPreview={showPreview} onRowClick={this.onRowClick} height={height} />,
        <Preview stateId={stateId} />
      ];
    if (showPie) cols = [<Pie />];

    return (
      <JournalsUrlManager stateId={stateId} params={{ showPreview }}>
        <Columns
          classNamesColumn={'columns_height_full columns__column_margin_0'}
          cols={cols}
          cfgs={[{}, { className: 'ecos-journals-content_col-step' }]}
        />
      </JournalsUrlManager>
    );
  }
}

export default connect(
  null,
  mapDispatchToProps
)(JournalsContent);
