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

const Grid = ({ stateId, showPreview, onRowClick }) => (
  <Well>
    <JournalsDashletGrid
      stateId={stateId}
      onRowClick={onRowClick}
      doInlineToolsOnRowClick={showPreview}
      className={'ecos-grid_no-top-border'}
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
    let { stateId, showPreview, showPie } = this.props;

    showPie = false;

    let cols = [<Grid stateId={stateId} showPreview={showPreview} onRowClick={this.onRowClick} />];
    if (showPreview)
      cols = [<Grid stateId={stateId} showPreview={showPreview} onRowClick={this.onRowClick} />, <Preview stateId={stateId} />];
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
